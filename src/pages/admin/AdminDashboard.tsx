import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEventStore } from '../../lib/stores/useEventStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Cookie, Scan, ArrowLeft } from 'lucide-react';
import { BakerManager } from '../../components/organisms/admin';
import { CategoryManager } from '../../components/organisms/admin';
import { CookieReviewer } from '../../components/organisms/admin/CookieReviewer';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { eventId = '' } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategoryForReview, setSelectedCategoryForReview] = useState<string | null>(null);
  const { setActiveEvent, activeEvent } = useEventStore();

  // Get active tab from URL or default to bakers
  const activeTab = searchParams.get('tab') || 'bakers';

  // Set active event when ID changes
  useEffect(() => {
    if (eventId && (!activeEvent || activeEvent.id !== eventId)) {
      setActiveEvent(eventId);
    }
  }, [eventId, activeEvent, setActiveEvent]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="hover:bg-transparent hover:text-primary transition-colors px-0 justify-start"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your cookie voting event, bakers, and submissions.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="w-full flex flex-wrap justify-start h-auto p-1 gap-1">
          <TabsTrigger value="bakers" className="flex-1 min-w-[120px]">
            <Users className="w-4 h-4 mr-2" />
            Bakers
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 min-w-[120px]">
            <Scan className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex-1 min-w-[120px]">
            <Cookie className="w-4 h-4 mr-2" />
            Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bakers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Bakers</CardTitle>
              <CardDescription>Add and manage bakers for this event.</CardDescription>
            </CardHeader>
            <CardContent>
              <BakerManager eventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Categories</CardTitle>
              <CardDescription>Define voting categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManager
                eventId={eventId}
                onCategoryClick={(category) => {
                  setSelectedCategoryForReview(category.id);
                  handleTabChange('processing');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {selectedCategoryForReview ? (
            <CookieReviewer
              eventId={eventId}
              categoryId={selectedCategoryForReview}
              onBack={() => setSelectedCategoryForReview(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Review Cookies</CardTitle>
                <CardDescription>Select a category to review detected cookies.</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryManager
                  eventId={eventId}
                  onCategoryClick={(category) => setSelectedCategoryForReview(category.id)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
