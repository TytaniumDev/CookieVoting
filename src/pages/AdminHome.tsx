import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdminAuth } from '../lib/hooks/useAdminAuth';
import { createEvent, getAllEvents, deleteEvent as deleteEventFirestore } from '../lib/firestore';
import { sanitizeInput } from '../lib/validation';
import { CONSTANTS } from '../lib/constants';
import { type VoteEvent } from '../lib/types';
import { eventNameSchema, type EventNameFormData } from '../lib/schemas';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, ArrowRight, Cookie } from "lucide-react";
import { format } from 'date-fns';

/**
 * AdminHome - Event picker page for admin.
 * Shows list of events to select or create a new one.
 */
export default function AdminHome() {
  const navigate = useNavigate();

  const { user, isAdmin, isLoading: authLoading, error: authError } = useAdminAuth({
    redirectIfNotAuth: '/',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<VoteEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EventNameFormData>({
    resolver: zodResolver(eventNameSchema),
    defaultValues: {
      name: '',
    },
  });

  // Fetch events
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    fetchEvents();
  }, [authLoading, isAdmin]);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const allEvents = await getAllEvents();
      const sortedEvents = allEvents.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEvents(sortedEvents);
    } catch {
      setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
    } finally {
      setLoadingEvents(false);
    }
  };

  const onSubmit = async (data: EventNameFormData) => {
    setLoading(true);
    setError(null);

    try {
      const sanitizedName = sanitizeInput(data.name);
      const event = await createEvent(sanitizedName);
      reset();
      setOpenCreateDialog(false);
      navigate(`/admin/${event.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      let errorMessage =
        error instanceof Error ? error.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE;

      if (
        error instanceof Error &&
        (error.message.includes('permission') || error.message.includes('Permission'))
      ) {
        if (user) {
          errorMessage = `Permission denied: Your account (${user.email || user.uid}) is not a global admin.`;
        } else {
          errorMessage = 'Permission denied: You must be signed in as a global admin to create events.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEventFirestore(eventId);
      setEventToDelete(null);
      fetchEvents(); // Refresh list
    } catch (error) {
      console.error("Failed to delete event:", error);
      setError("Failed to delete event. Please check your permissions.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              {authError || error || 'You do not have admin access. Please contact a site administrator.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} variant="default" className="w-full">
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cookie className="h-8 w-8 text-primary" />
            Cookie Voting Admin
          </h1>
          <p className="text-muted-foreground mt-1">Select an event to manage or create a new one.</p>
        </div>

        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Create New Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Give your voting event a name to get started. You can add categories and bakers later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Holiday Cookie-Off 2026"
                  {...register('name')}
                  disabled={isSubmitting || loading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || loading}>
                  {isSubmitting || loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-destructive font-medium">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <h2 className="text-xl font-semibold tracking-tight">Your Events</h2>

        {loadingEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-[100px] bg-muted/50" />
                <CardContent className="h-[50px] bg-muted/30" />
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p className="mb-2 text-lg font-medium">No events yet</p>
                <p className="mb-4">Create your first event to get started!</p>
                <Button variant="outline" onClick={() => setOpenCreateDialog(true)}>
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
              <Card key={event.id} className="group hover:shadow-lg transition-all duration-200 border-muted-foreground/20 hover:border-primary/50 cursor-pointer overflow-hidden flex flex-col" onClick={() => navigate(`/admin/${event.id}`)}>
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                      {event.name}
                    </CardTitle>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${event.status === 'voting'
                          ? 'bg-green-500/10 text-green-600 border-green-500/20'
                          : 'bg-muted text-muted-foreground border-transparent'
                        }`}
                    >
                      {event.status === 'voting' ? 'Voting Active' : 'Closed'}
                    </span>
                  </div>
                  <CardDescription>
                    Created {format(event.createdAt || Date.now(), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200">
                      Manage Event <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Dialog open={eventToDelete === event.id} onOpenChange={(open) => setEventToDelete(open ? event.id : null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Event: {event.name}?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete the event, all voting data, and baker assignments.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEventToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleDeleteEvent(event.id)}>Delete Event</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
