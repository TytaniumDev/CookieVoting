import { useState, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEventStore } from '../../../../lib/stores/useEventStore';

export interface ResultsTimeManagerProps {
  eventId: string;
}

export function ResultsTimeManager({ eventId }: ResultsTimeManagerProps) {
  const { activeEvent, updateResultsAvailableTime } = useEventStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTime = activeEvent?.resultsAvailableTime
    ? new Date(activeEvent.resultsAvailableTime)
    : null;

  const handleDateChange = useCallback(
    async (date: Date | null) => {
      if (!date || isUpdating) return;

      setIsUpdating(true);
      setError(null);

      try {
        await updateResultsAvailableTime(eventId, date.getTime());
      } catch (err) {
        console.error('Failed to update results time:', err);
        setError('Failed to update. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    },
    [eventId, updateResultsAvailableTime, isUpdating],
  );

  // Calculate default open date: 4 hours from now, rounded to next hour
  const getDefaultOpenDate = () => {
    const now = new Date();
    const target = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    if (target.getMinutes() > 0 || target.getSeconds() > 0) {
      target.setHours(target.getHours() + 1);
      target.setMinutes(0, 0, 0);
    }
    return target;
  };

  if (!activeEvent) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label htmlFor="results-time-picker" className="block text-sm text-gray-400">
        Results Available At:
      </label>

      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400 pointer-events-none z-10">📅</span>
        <DatePicker
          id="results-time-picker"
          selected={currentTime}
          onChange={handleDateChange}
          showTimeSelect
          dateFormat="MMM d, yyyy h:mm aa"
          timeIntervals={60}
          placeholderText="Select reveal time"
          className="w-full pl-10 pr-4 py-2 bg-surface-tertiary border border-surface-tertiary focus:border-primary-500 focus:outline-none rounded-lg text-white placeholder-gray-500"
          openToDate={currentTime || getDefaultOpenDate()}
          minDate={new Date()}
          disabled={isUpdating}
          wrapperClassName="w-full"
        />
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <p className="text-sm text-gray-500 italic">Votes will be hidden until this time</p>
    </div>
  );
}
