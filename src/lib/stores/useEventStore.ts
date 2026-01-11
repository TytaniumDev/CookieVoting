import { create } from 'zustand';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import type { VoteEvent, Category } from '../types';

interface EventState {
  activeEvent: VoteEvent | null;
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  setActiveEvent: (eventId: string) => Promise<void>;
  fetchAllEvents: () => Promise<void>;
  fetchCategories: (eventId: string) => Promise<void>;
  addCategory: (eventId: string, name: string, imageUrl: string) => Promise<void>;
  updateCategory: (eventId: string, categoryId: string, name: string) => Promise<void>;
  deleteCategory: (eventId: string, categoryId: string) => Promise<void>;
  updateCategoryOrder: (eventId: string, categoryId: string, newOrder: number) => Promise<void>;
  updateResultsAvailableTime: (eventId: string, time: number | null) => Promise<void>;
  updateEventStatus: (eventId: string, status: 'voting' | 'completed') => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  activeEvent: null,
  categories: [],
  events: [],
  loading: false,
  error: null,

  setActiveEvent: async (eventId: string) => {
    // Check if we already have the event in our list
    const { events } = get();
    const cachedEvent = events.find((e) => e.id === eventId);

    if (cachedEvent) {
      set({ activeEvent: cachedEvent, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'events', eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ activeEvent: { id: docSnap.id, ...docSnap.data() } as VoteEvent, loading: false });
      } else {
        set({ error: 'Event not found', loading: false });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      set({ error: 'Failed to fetch event', loading: false });
    }
  },

  fetchAllEvents: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as VoteEvent);
      set({ events, loading: false });
    } catch (error) {
      console.error('Error fetching all events:', error);
      set({ error: 'Failed to fetch events', loading: false });
    }
  },

  fetchCategories: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'events', eventId, 'categories'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Category);
      set({ categories, loading: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ error: 'Failed to fetch categories', loading: false });
    }
  },

  addCategory: async (eventId: string, name: string, imageUrl: string) => {
    set({ loading: true, error: null });
    try {
      const newOrder = get().categories.length;
      await addDoc(collection(db, 'events', eventId, 'categories'), {
        name,
        imageUrl,
        cookies: [],
        order: newOrder,
      });
      await get().fetchCategories(eventId);
    } catch (error) {
      console.error('Error adding category:', error);
      set({ error: 'Failed to add category', loading: false });
    }
  },

  updateCategory: async (eventId: string, categoryId: string, name: string) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'events', eventId, 'categories', categoryId);
      await updateDoc(docRef, { name });

      // Optimistic update
      set((state) => ({
        categories: state.categories.map((c) => (c.id === categoryId ? { ...c, name } : c)),
        loading: false,
      }));
    } catch (error) {
      console.error('Error updating category:', error);
      set({ error: 'Failed to update category', loading: false });
    }
  },

  deleteCategory: async (eventId: string, categoryId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'events', eventId, 'categories', categoryId));

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
        loading: false,
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
      set({ error: 'Failed to delete category', loading: false });
    }
  },

  updateCategoryOrder: async (eventId: string, categoryId: string, newOrder: number) => {
    // For now, this just updates one. Reordering usually involves swapping or shifting.
    // AdminDashboard logic handles the swap call, so we just specific update here.
    try {
      const docRef = doc(db, 'events', eventId, 'categories', categoryId);
      await updateDoc(docRef, { order: newOrder });

      // We rely on fetchCategories or manual local state update from component for full list sync
      // But let's do a basic local update
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId ? { ...c, order: newOrder } : c,
        ),
      }));
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  updateResultsAvailableTime: async (eventId: string, time: number | null) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'events', eventId);
      await updateDoc(docRef, { resultsAvailableTime: time });

      set((state) => ({
        activeEvent: state.activeEvent
          ? { ...state.activeEvent, resultsAvailableTime: time || undefined }
          : null,
        loading: false,
      }));
    } catch (error) {
      console.error('Error updating results time:', error);
      set({ error: 'Failed to update results time', loading: false });
    }
  },

  updateEventStatus: async (eventId: string, status: 'voting' | 'completed') => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'events', eventId);
      await updateDoc(docRef, { status });

      set((state) => ({
        activeEvent: state.activeEvent ? { ...state.activeEvent, status } : null,
        loading: false,
      }));
    } catch (error) {
      console.error('Error updating event status:', error);
      set({ error: 'Failed to update event status', loading: false });
    }
  },
}));
