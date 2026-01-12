import { useState, useEffect } from 'react';
import { getEvent, getCategories, getVotes } from '../firestore';
import type { VoteEvent, Category, Cookie, UserVote } from '../types';
import { CONSTANTS } from '../constants';

export interface CookieScore {
  cookieId: string;
  votes: number;
  cookie: Cookie;
}

export interface CategoryResult {
  category: Category;
  scores: CookieScore[];
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
    const scoresMap = new Map<string, number>();
    cat.cookies.forEach((c) => scoresMap.set(c.id, 0));

    votesData.forEach((userVote) => {
      const voteArray = userVote.votes[cat.id];
      if (voteArray && voteArray.length > 0) {
        // For single vote: use first element [cookieId]
        const cookieId = voteArray[0];
        scoresMap.set(cookieId, (scoresMap.get(cookieId) || 0) + 1);
      }
    });

    const scores: CookieScore[] = cat.cookies
      .map((c) => ({
        cookieId: c.id,
        votes: scoresMap.get(c.id) || 0,
        cookie: c,
      }))
      .sort((a, b) => b.votes - a.votes);

    return {
      category: cat,
      scores,
    };
  });
}

