import { useState, useEffect } from 'react';
import { getEvent, getCategories, getVotes } from '../firestore';
import type { VoteEvent, Category, CookieCoordinate, UserVote } from '../types';
import type { DetectedCookie } from '../../components/organisms/CookieViewer/CookieViewer';
import { CONSTANTS } from '../constants';

export interface CookieScore {
  cookieNumber: number;
  votes: number;
  maker: string;
  cookie: CookieCoordinate;
}

export interface CategoryResult {
  category: Category;
  scores: CookieScore[];
  detectedCookies: DetectedCookie[] | null;
}

export const useResultsData = (eventId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<VoteEvent | null>(null);
  const [results, setResults] = useState<CategoryResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        const [eventData, catsData, votesData] = await Promise.all([
          getEvent(eventId),
          getCategories(eventId),
          getVotes(eventId),
        ]);
        setEvent(eventData);

        // Calculate initial results (tally)
        const computedResults = calculateResults(catsData, votesData);
        setResults(computedResults);
      } catch (err) {
        console.error('Failed to load results', err);
        setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  return { event, results, loading, error };
};

// Helper to tally votes
function calculateResults(categories: Category[], votesData: UserVote[]): CategoryResult[] {
  return categories.map((cat) => {
    const scoresMap = new Map<number, number>();
    cat.cookies.forEach((c) => scoresMap.set(c.number, 0));

    votesData.forEach((userVote) => {
      const votedNumber = userVote.votes[cat.id];
      if (votedNumber !== undefined) {
        scoresMap.set(votedNumber, (scoresMap.get(votedNumber) || 0) + 1);
      }
    });

    const scores: CookieScore[] = cat.cookies
      .map((c) => ({
        cookieNumber: c.number,
        votes: scoresMap.get(c.number) || 0,
        maker: c.makerName || 'Unknown',
        cookie: c,
      }))
      .sort((a, b) => b.votes - a.votes);

    return {
      category: cat,
      scores,
      detectedCookies: null,
    };
  });
}

