import { create } from 'zustand';
import { db, storage } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ImageEntity, DetectedCookie } from '../types';
import { v4 as uuidv4 } from 'uuid';

/** Options for uploading an image */
export interface UploadImageOptions {
  /**
   * Type of image being uploaded
   * - 'tray_image': Full tray/plate image (default)
   * - 'cropped_cookie': Individual cookie cropped from a tray
   */
  type?: 'tray_image' | 'cropped_cookie';
  /** Category ID (required for cropped_cookie type) */
  categoryId?: string;
  /** Source tray image URL (for cropped_cookie type, for reference) */
  sourceTrayImageUrl?: string;
  /** Original crop region on the source image (for cropped_cookie type) */
  cropRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageState {
  images: Record<string, ImageEntity>; // Map by ID
  loading: boolean;

  // Actions
  uploadImage: (file: File, eventId: string, options?: UploadImageOptions) => Promise<ImageEntity>;
  fetchImagesForEvent: (eventId: string) => Promise<void>;
  fetchCroppedCookiesForCategory: (eventId: string, categoryId: string) => Promise<void>;
  assignBaker: (imageId: string, bakerId: string | null) => Promise<void>;

  // Selectors
  getDetectionData: (imageId: string) => DetectedCookie[] | null;
  getCroppedCookiesForCategory: (categoryId: string) => ImageEntity[];

  // Real-time updates
  watchImage: (imageId: string) => () => void;
  subscribeToCroppedCookies: (eventId: string, categoryId: string) => void;
  unsubscribeFromCroppedCookies: (categoryId: string) => void;

  // Internal
  unsubscribers: Record<string, () => void>;
  updateLocalDetections: (imageId: string, detections: DetectedCookie[]) => void;
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: {},
  loading: false,
  unsubscribers: {},

  uploadImage: async (file: File, eventId: string, options?: UploadImageOptions) => {
    set({ loading: true });
    try {
      const type = options?.type ?? 'tray_image';
      const categoryId = options?.categoryId;
      const sourceTrayImageUrl = options?.sourceTrayImageUrl;
      const cropRegion = options?.cropRegion;

      // Determine storage path based on image type
      const fileExtension = file.name.split('.').pop() || 'png';
      let storagePath: string;

      if (type === 'cropped_cookie' && categoryId) {
        // Cropped cookies go to organized folder structure
        storagePath = `cropped_cookies/${eventId}/${categoryId}/${uuidv4()}.${fileExtension}`;
      } else {
        // Tray images go to shared folder
        storagePath = `shared/cookies/${uuidv4()}.${fileExtension}`;
      }

      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Create Firestore document with all metadata
      // Note: We don't include bakerId here - it will be set later during tagging
      const newImage: Omit<ImageEntity, 'id'> = {
        url,
        storagePath,
        detectedCookies: [], // Initially empty, populated by Cloud Fn for tray images
        eventId,
        createdAt: Date.now(),
        type,
        ...(categoryId && { categoryId }),
        ...(sourceTrayImageUrl && { sourceTrayImageUrl }),
        ...(cropRegion && { cropRegion }),
        // bakerId is intentionally omitted - Firestore doesn't accept undefined values
        // It will be set when the cropped cookie is tagged
      };

      const docRef = await addDoc(collection(db, 'images'), newImage);
      const imageEntity: ImageEntity = { id: docRef.id, ...newImage };

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
    try {
      const q = query(collection(db, 'images'), where('eventId', '==', eventId));
      const snapshot = await getDocs(q);
      const newImages = snapshot.docs.reduce(
        (acc, docSnap) => {
          acc[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as ImageEntity;
          return acc;
        },
        {} as Record<string, ImageEntity>,
      );

      set((state) => ({ images: { ...state.images, ...newImages } }));
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  },

  fetchCroppedCookiesForCategory: async (eventId: string, categoryId: string) => {
    // Deprecated: Use subscribeToCroppedCookies instead
    set({ loading: true });
    try {
      // Query for cropped cookies matching event and category
      const q = query(
        collection(db, 'images'),
        where('eventId', '==', eventId),
        where('categoryId', '==', categoryId),
        where('type', '==', 'cropped_cookie'),
      );
      const snapshot = await getDocs(q);
      const croppedCookies = snapshot.docs.reduce(
        (acc, docSnap) => {
          acc[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as ImageEntity;
          return acc;
        },
        {} as Record<string, ImageEntity>,
      );

      set((state) => ({
        images: { ...state.images, ...croppedCookies },
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching cropped cookies:', error);
      set({ loading: false });
    }
  },

  subscribeToCroppedCookies: (eventId: string, categoryId: string) => {
    const { unsubscribers } = get();

    // If already subscribed, do nothing
    if (unsubscribers[categoryId]) return;

    set({ loading: true });

    const q = query(
      collection(db, 'images'),
      where('eventId', '==', eventId),
      where('categoryId', '==', categoryId),
      where('type', '==', 'cropped_cookie'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const croppedCookies = snapshot.docs.reduce(
          (acc, docSnap) => {
            // Merge with existing image data to preserve local state if any (though typically Firestore is source of truth)
            acc[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as ImageEntity;
            return acc;
          },
          {} as Record<string, ImageEntity>,
        );

        set((state) => ({
          images: { ...state.images, ...croppedCookies },
          loading: false,
        }));
      },
      (error) => {
        console.error('Error in cropped cookies subscription:', error);
        set({ loading: false });
      },
    );

    set((state) => ({
      unsubscribers: { ...state.unsubscribers, [categoryId]: unsubscribe },
    }));
  },

  unsubscribeFromCroppedCookies: (categoryId: string) => {
    const { unsubscribers } = get();
    const unsubscribe = unsubscribers[categoryId];

    if (unsubscribe) {
      unsubscribe();
      set((state) => {
        const newUnsubscribers = { ...state.unsubscribers };
        delete newUnsubscribers[categoryId];
        return { unsubscribers: newUnsubscribers };
      });
    }
  },

  assignBaker: async (imageId: string, bakerId: string | null) => {
    try {
      const docRef = doc(db, 'images', imageId);
      await updateDoc(docRef, { bakerId });

      // Optimistic update
      set((state) => ({
        images: {
          ...state.images,
          [imageId]: {
            ...state.images[imageId],
            bakerId: bakerId ?? undefined,
          },
        },
      }));
    } catch (error) {
      console.error('Error assigning baker:', error);
      throw error;
    }
  },

  getDetectionData: (imageId: string) => {
    const image = get().images[imageId];
    return image?.detectedCookies || null;
  },

  getCroppedCookiesForCategory: (categoryId: string) => {
    const allImages = get().images;
    return Object.values(allImages).filter(
      (img) => img.type === 'cropped_cookie' && img.categoryId === categoryId,
    );
  },

  watchImage: (imageId: string) => {
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

  updateLocalDetections: (imageId: string, detections: DetectedCookie[]) => {
    set((state) => ({
      images: {
        ...state.images,
        [imageId]: {
          ...state.images[imageId],
          detectedCookies: detections,
        },
      },
    }));
  },
}));
