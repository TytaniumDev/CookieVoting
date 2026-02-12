import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBakerStore } from '../../../../lib/stores/useBakerStore';
import { sanitizeInput } from '../../../../lib/validation';
import { bakerNameSchema, type BakerNameFormData } from '../../../../lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

export interface BakerManagerProps {
  eventId: string;
}

export function BakerManager({ eventId }: BakerManagerProps) {
  const { bakers, fetchBakers, addBaker, removeBaker, loading } = useBakerStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BakerNameFormData>({
    resolver: zodResolver(bakerNameSchema),
    defaultValues: {
      name: '',
    },
  });

  // Fetch bakers on mount
  useEffect(() => {
    if (eventId) {
      fetchBakers(eventId);
    }
  }, [eventId, fetchBakers]);

  const onSubmit = useCallback(
    async (data: BakerNameFormData) => {
      const sanitizedName = sanitizeInput(data.name);

      // Check for duplicates
      if (bakers.some((b) => b.name.toLowerCase() === sanitizedName.toLowerCase())) {
        setError('Baker already exists');
        return;
      }

      setError(null);

      try {
        await addBaker(eventId, sanitizedName);
        reset();
      } catch (err) {
        console.error('Failed to add baker:', err);
        setError(err instanceof Error ? err.message : 'Failed to add baker');
      }
    },
    [eventId, bakers, addBaker, reset],
  );

  const handleRemoveBaker = useCallback(
    async (bakerId: string, bakerName: string) => {
      if (
        !window.confirm(
          `Are you sure you want to remove "${bakerName}"? This will remove their cookie assignments.`,
        )
      ) {
        return;
      }

      try {
        await removeBaker(eventId, bakerId);
      } catch (err) {
        console.error('Failed to remove baker:', err);
        setError('Failed to remove baker. Please try again.');
      }
    },
    [eventId, removeBaker],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold">Bakers</h3>
        {bakers.length > 0 && <Badge variant="secondary">{bakers.length}</Badge>}
      </div>

      {/* Add form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <div className="flex-1">
          <Input
            {...register('name')}
            placeholder="Baker name"
            maxLength={50}
            disabled={isSubmitting || loading}
            aria-label="New baker name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting || loading}>
          {isSubmitting ? (
            'Adding...'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" /> Add
            </>
          )}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="text-destructive text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Baker list */}
      {bakers.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          role="list"
          aria-label="Bakers list"
        >
          {bakers.map((baker) => (
            <div
              key={baker.id}
              className="flex items-center justify-between p-3 rounded-lg border border-surface-tertiary bg-surface-secondary hover:bg-surface-tertiary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-xs font-bold ring-1 ring-primary-600/40">
                  {baker.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{baker.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBaker(baker.id, baker.name)}
                className="text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove ${baker.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="text-muted-foreground text-sm">No bakers added yet</p>
      )}
    </div>
  );
}
