import { create } from 'zustand';
import { db, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ImageEntity, DetectedCookie } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ImageState {
  images: Record<string, ImageEntity>; // Map by ID
  loading: boolean;

  // Actions
  uploadImage: (file: File, eventId?: string) => Promise<ImageEntity>;
  fetchImagesForEvent: (eventId: string) => Promise<void>;

  // Detection Logic
  getDetectionData: (imageId: string) => DetectedCookie[] | null;
  // We might want a listener for specific images to update detection results in real-time
  watchImage: (imageId: string) => () => void;
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: {},
  loading: false,

  uploadImage: async (file: File, eventId?: string) => {
    set({ loading: true });
    try {
      // 1. Upload to Storage
      const fileExtension = file.name.split('.').pop();
      const storagePath = `images/${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // 2. Create 'images' document
      // Note: The cloud function for detection usually triggers on Storage upload.
      // It might update this doc later, or create a separate detection doc.
      // For our architecture, we want the detection results to end up on this doc.
      // If the current backend uses a separate 'image_detections' collection keyed by path,
      // we might need to conform to that or update the backend.
      // **Assumption**: We will write to the 'images' collection here.

      const newImage: Omit<ImageEntity, 'id'> = {
        url,
        storagePath,
        detectedCookies: [], // Initially empty, populated by Cloud Fn later
        eventId,
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'images'), newImage);
      const imageEntity = { id: docRef.id, ...newImage };

      set((state) => ({
        images: { ...state.images, [docRef.id]: imageEntity },
      }));

      set({ loading: false });
      return imageEntity;
    } catch (error) {
      console.error('Error uploading image:', error);
      set({ loading: false });
      throw error;
    }
  },

  fetchImagesForEvent: async (eventId: string) => {
    // This is useful if we want to show a gallery of all images for an event
    try {
      const q = query(collection(db, 'images'), where('eventId', '==', eventId));
      const snapshot = await getDocs(q);
      const newImages = snapshot.docs.reduce(
        (acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() } as ImageEntity;
          return acc;
        },
        {} as Record<string, ImageEntity>,
      );

      set((state) => ({ images: { ...state.images, ...newImages } }));
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  },

  getDetectionData: (imageId: string) => {
    const image = get().images[imageId];
    return image?.detectedCookies || null;
  },

  watchImage: (imageId: string) => {
    // Real-time listener for a specific image doc (to catch when detections arrive)
    const unsub = onSnapshot(doc(db, 'images', imageId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as ImageEntity;
        set((state) => ({
          images: { ...state.images, [imageId]: data },
        }));
      }
    });
    return unsub;
  },
}));
