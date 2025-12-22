import { create } from 'zustand';
import { db } from '../firebase';
import { 
    collection, 
  setDoc, 
  doc, 
    onSnapshot,
  getDoc
} from 'firebase/firestore';

interface VoteState {
  /**
   * The Global Scoreboard (Admin/Results View)
   * A mapping of Cookie IDs to their total vote count.
   * e.g., { "cookie_123": 42, "cookie_456": 12 }
   */
  aggregateVoteCounts: Record<string, number>; 

  /**
   * The Current User's Ballot (Voting View)
   * A mapping of Category IDs to the Cookie ID the user selected.
   * e.g., { "category_creative": "cookie_123" }
   * This is local state until the user hits "Submit".
   */
  currentUserSelections: Record<string, string>; 
  
  submitted: boolean;
  loading: boolean;
  
  // Actions
  castVote: (categoryId: string, cookieId: string) => void; 
  submitVotes: (eventId: string, userId: string) => Promise<void>;
  loadUserVotes: (eventId: string, userId: string) => Promise<void>;
  
  // Admin/Results Actions
  subscribeToResults: (eventId: string) => () => void; // Returns unsubscribe
}

export const useVoteStore = create<VoteState>((set, get) => ({
    aggregateVoteCounts: {},
    currentUserSelections: {},
    submitted: false,
    loading: false,

    castVote: (categoryId: string, cookieId: string) => {
        set(state => ({
            currentUserSelections: {
                ...state.currentUserSelections,
                [categoryId]: cookieId
            }
        }));
    },

    submitVotes: async (eventId: string, userId: string) => {
        set({ loading: true });
        try {
             // Structure: events/{id}/votes/{userId}
             // Body: { selections: { [categoryId]: cookieId }, timestamp: ... }
             const selections = get().currentUserSelections;
             const docRef = doc(db, 'events', eventId, 'votes', userId);
             
             await setDoc(docRef, {
                 selections,
                 submittedAt: Date.now()
             });
             
             set({ submitted: true, loading: false });
        } catch (error) {
            console.error("Error submitting votes:", error);
            set({ loading: false });
            throw error;
        }
    },

    loadUserVotes: async (eventId: string, userId: string) => {
        set({ loading: true });
        try {
            const docRef = doc(db, 'events', eventId, 'votes', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                set({ 
                    currentUserSelections: data.selections || {},
                    submitted: true 
                });
            } else {
                 set({ submitted: false, currentUserSelections: {} });
            }
             set({ loading: false });
        } catch (error) {
            console.error("Error loading user votes:", error);
            set({ loading: false });
        }
    },

    subscribeToResults: (eventId: string) => {
        // Real-time aggregation of all votes
        const q = collection(db, 'events', eventId, 'votes');
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const counts: Record<string, number> = {};
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const selections = data.selections as Record<string, string>; // categoryId -> cookieId
                
                if (selections) {
                    Object.values(selections).forEach(cookieId => {
                        counts[cookieId] = (counts[cookieId] || 0) + 1;
                    });
                }
            });
            
            set({ aggregateVoteCounts: counts });
        });
        
        return unsubscribe;
    }
}));
