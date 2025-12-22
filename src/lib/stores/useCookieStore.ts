import { create } from 'zustand';
import { db } from '../firebase';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import type { CookieEntity } from '../types';

interface CookieState {
    cookies: CookieEntity[]; // All defined cookies for the active event
    loading: boolean;

    // Actions 
    fetchCookies: (eventId: string) => Promise<void>;
    createCookie: (
        eventId: string,
        categoryId: string,
        imageId: string,
        bakerId: string,
        detectionId: string, // Required now
        x: number, // Still kept for quick display/fallback
        y: number,
        label?: number
    ) => Promise<string>;
    deleteCookie: (eventId: string, cookieId: string) => Promise<void>;
    getCookiesForCategory: (categoryId: string) => CookieEntity[];
}

export const useCookieStore = create<CookieState>((set, get) => ({
    cookies: [],
    loading: false,

    fetchCookies: async (eventId: string) => {
        set({ loading: true });
        try {
            // Fetch ALL cookies for the event at once.
            // Stored in subcollection: events/{id}/cookies
            const q = collection(db, 'events', eventId, 'cookies');
            const snapshot = await getDocs(q);
            const cookies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CookieEntity));
            set({ cookies, loading: false });
        } catch (error) {
            console.error("Error fetching cookies:", error);
            set({ loading: false });
        }
    },

    createCookie: async (eventId, categoryId, imageId, bakerId, detectionId, x, y, label) => {
        try {
            // Auto-generate label number if not provided
            const existingCookies = get().cookies.filter(c => c.categoryId === categoryId);
            const nextLabel = label || (existingCookies.length + 1);

            const newCookie: Omit<CookieEntity, 'id'> = {
                eventId,
                categoryId,
                imageId,
                bakerId,
                detectionId, // Now required
                x,
                y,
                label: nextLabel
            };

            const docRef = await addDoc(collection(db, 'events', eventId, 'cookies'), newCookie);
            const created = { id: docRef.id, ...newCookie };

            set(state => ({ cookies: [...state.cookies, created] }));
            return docRef.id;

        } catch (error) {
            console.error("Error creating cookie:", error);
            throw error;
        }
    },

    deleteCookie: async (eventId: string, cookieId: string) => {
        try {
            await deleteDoc(doc(db, 'events', eventId, 'cookies', cookieId));
            set(state => ({ cookies: state.cookies.filter(c => c.id !== cookieId) }));
        } catch (error) {
            console.error("Error deleting cookie:", error);
            throw error;
        }
    },

    getCookiesForCategory: (categoryId: string) => {
        return get().cookies.filter(c => c.categoryId === categoryId);
    }
}));
