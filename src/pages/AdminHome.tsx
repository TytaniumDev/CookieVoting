import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../lib/hooks/useAdminAuth';
import { createEvent, getAllEvents } from '../lib/firestore';
import { validateEventName, sanitizeInput } from '../lib/validation';
import { CONSTANTS } from '../lib/constants';
import { type VoteEvent } from '../lib/types';

/**
 * AdminHome - Event picker page for admin.
 * Shows list of events to select or create a new one.
 */
export default function AdminHome() {
  const navigate = useNavigate();

  const { user, isAdmin, isLoading: authLoading, error: authError } = useAdminAuth({
    redirectIfNotAuth: '/',
  });

  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<VoteEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch events
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const fetchEvents = async () => {
      try {
        const allEvents = await getAllEvents();
        const sortedEvents = allEvents.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setEvents(sortedEvents);
      } catch {
        setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [authLoading, isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateEventName(eventName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid event name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sanitizedName = sanitizeInput(eventName);
      const event = await createEvent(sanitizedName);
      navigate(`/admin/${event.id}/overview`);
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

  const handleEventClick = (eventId: string) => {
    navigate(`/admin/${eventId}/overview`);
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-primary-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white">
        <p className="text-red-400 mb-4">
          {authError || error || 'You do not have admin access. Please contact a site administrator.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div className="border-b border-surface-tertiary pb-4">
          <h2 className="text-3xl font-bold text-white">🍪 Cookie Voting Admin</h2>
          <p className="text-gray-400 mt-1 text-lg">Select an event to manage or create a new one</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
            {error}
          </div>
        )}

        {/* Create Event Section */}
        <div className="bg-surface rounded-xl p-6 border border-surface-tertiary">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-4 border-2 border-dashed border-surface-tertiary rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-2xl">+</span>
              <span className="font-medium">Create New Event</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="text-2xl">✨</span>
                Create New Event
              </h3>
              <input
                type="text"
                placeholder="Event Name (e.g. Holiday Cookie-Off)"
                value={eventName}
                onChange={(e) => {
                  setEventName(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                disabled={loading}
                maxLength={100}
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEventName('');
                    setError(null);
                  }}
                  className="px-4 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg text-gray-300 hover:bg-surface-tertiary transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Events List */}
        <div className="bg-surface rounded-xl p-6 border border-surface-tertiary">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            Your Events
          </h3>

          {loadingEvents ? (
            <div className="text-gray-400 py-8 text-center">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-gray-400 py-8 text-center">
              <p className="mb-2">No events yet</p>
              <p className="text-sm">Create your first event to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  className="w-full p-4 bg-surface-secondary rounded-lg border border-surface-tertiary hover:border-primary-500/50 hover:bg-surface-tertiary transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium group-hover:text-primary-400 transition-colors">
                        {event.name}
                      </h4>
                      <p className="text-gray-500 text-sm mt-1">
                        Created {formatDate(event.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${event.status === 'voting'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                          }`}
                      >
                        {event.status === 'voting' ? '● Voting' : '○ Closed'}
                      </span>
                      <span className="text-gray-500 group-hover:text-primary-400 transition-colors">
                        →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
