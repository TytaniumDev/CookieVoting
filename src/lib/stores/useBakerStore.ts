import { create } from 'zustand';
import { db } from '../firebase';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    query,
    where
} from 'firebase/firestore';
import type { Baker } from '../types';

interface BakerState {
    bakers: Baker[]; // Bakers for the active event context
    loading: boolean;

    // Actions
    fetchBakers: (eventId: string) => Promise<void>;
    addBaker: (eventId: string, name: string) => Promise<void>;
    removeBaker: (eventId: string, bakerId: string) => Promise<void>;
}

export const useBakerStore = create<BakerState>((set, get) => ({
    bakers: [],
    loading: false,

    fetchBakers: async (eventId: string) => {
        set({ loading: true });
        try {
            // Assuming bakers are a subcollection of events, OR a top level collection with eventId.
            // Based on previous code analysis (CookieTaggingStep uses 'bakers' prop usually passed down),
            // let's assume they are a subcollection 'bakers' under the event document for better encapsulation.
            const q = collection(db, 'events', eventId, 'bakers');
            const snapshot = await getDocs(q);
            const bakers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Baker));
            set({ bakers, loading: false });
        } catch (error) {
            console.error("Error fetching bakers:", error);
            set({ loading: false });
        }
    },

    addBaker: async (eventId: string, name: string) => {
        try {
            await addDoc(collection(db, 'events', eventId, 'bakers'), { name });
            await get().fetchBakers(eventId);
        } catch (error) {
            console.error("Error adding baker:", error);
            throw error;
        }
    },

    removeBaker: async (eventId: string, bakerId: string) => {
        try {
            await deleteDoc(doc(db, 'events', eventId, 'bakers', bakerId));
            set(state => ({ bakers: state.bakers.filter(b => b.id !== bakerId) }));
        } catch (error) {
            console.error("Error deleting baker:", error);
            throw error;
        }
    }
}));
