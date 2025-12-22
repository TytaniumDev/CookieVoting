import { doc, setDoc, getDoc, collection, query, getDocs, updateDoc, writeBatch, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { type VoteEvent, type Category, type CookieCoordinate, type UserVote, type CookieMaker } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get or create a session ID for unauthenticated users
// This provides a persistent identifier per browser/device
function getOrCreateSessionId(): string {
    const SESSION_ID_KEY = 'cookie_voting_session_id';
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = `session_${uuidv4()}`;
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
}

// Helper function to get user ID - prefers authenticated user, falls back to session ID
export function getUserIdForVoting(): string {
    if (auth.currentUser) {
        return auth.currentUser.uid;
    }
    return getOrCreateSessionId();
}

export async function submitVote(eventId: string, userId: string | null, votes: Record<string, number>): Promise<void> {
    // Use provided userId, or get one (authenticated user or session ID)
    const finalUserId = userId || getUserIdForVoting();
    const voteId = `${eventId}_${finalUserId}`; // One vote per user per event
    const voteData: UserVote = {
        userId: finalUserId,
        votes,
        timestamp: Date.now()
    };
    
    await setDoc(doc(db, 'events', eventId, 'votes', voteId), voteData);
}

export async function getUserVote(eventId: string, userId: string | null): Promise<UserVote | null> {
    // Use provided userId, or get one (authenticated user or session ID)
    const finalUserId = userId || getUserIdForVoting();
    const voteId = `${eventId}_${finalUserId}`;
    
    const docRef = doc(db, 'events', eventId, 'votes', voteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return docSnap.data() as UserVote;
    }
    
    return null;
}

export async function updateCategoryCookies(eventId: string, categoryId: string, cookies: CookieCoordinate[]): Promise<void> {
    const ref = doc(db, 'events', eventId, 'categories', categoryId);
    await updateDoc(ref, { cookies });
}

/**
 * Check if a user is a global admin using Custom Claims
 */
export async function isGlobalAdmin(userId: string): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return false;
    try {
      // Force refresh to ensure we have the latest claims
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);
      return !!idTokenResult.claims.admin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
}


export async function createEvent(name: string): Promise<VoteEvent> {
    // For Firestore operations, we need the authenticated user's UID
    if (!auth.currentUser) {
        throw new Error('You must be signed in to create events');
    }
    
    const currentUserId = auth.currentUser.uid;
    
    // Check if user is admin
    const userIsAdmin = await isGlobalAdmin(currentUserId);
    
    if (!userIsAdmin) {
        console.error('❌ Permission denied: User is not a global admin');
        console.log('📋 Your User UID:', currentUserId);
        if (auth.currentUser.email) {
            console.log('📧 Your Email:', auth.currentUser.email);
        }
        console.log('🔧 To fix this:');
      console.log('   Run this script locally to bootstrap the first admin:');
      console.log('   node scripts/set-admin.js ' + (auth.currentUser.email || currentUserId));
        throw new Error('Permission denied: You must be a global admin to create events');
    }
    
    const id = uuidv4();
    const adminCode = uuidv4().split('-')[0]; // Simple short code for now

    const eventData: VoteEvent = {
        id,
        name,
        adminCode,
        status: 'voting',
        createdAt: Date.now()
    };

    await setDoc(doc(db, 'events', id), eventData);
    
    return eventData;
}

export async function getEvent(id: string): Promise<VoteEvent | null> {
    const docRef = doc(db, 'events', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return docSnap.data() as VoteEvent;
    }
    
    return null;
}

export async function getAllEvents(): Promise<VoteEvent[]> {
    const q = query(collection(db, 'events'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as VoteEvent);
}

export async function addCategory(eventId: string, name: string, imageUrl: string): Promise<Category> {
    console.log(`[addCategory] Starting - eventId: ${eventId}, name: ${name}`);
    
    // Check if user is authenticated
    if (!auth.currentUser) {
        console.error('[addCategory] ❌ User not authenticated');
        throw new Error('You must be signed in to add categories');
    }
    
    const currentUserId = auth.currentUser.uid;
    console.log(`[addCategory] User authenticated: ${currentUserId}`);
    
    // Check if user is admin
    const userIsAdmin = await isGlobalAdmin(currentUserId);
    console.log(`[addCategory] User is admin: ${userIsAdmin}`);
    
    if (!userIsAdmin) {
        console.error('❌ Permission denied: User is not a global admin');
        console.log('📋 Your User UID:', currentUserId);
        if (auth.currentUser.email) {
            console.log('📧 Your Email:', auth.currentUser.email);
        }
        console.log('🔧 To fix this:');
      console.log('   Run this script locally to bootstrap the first admin:');
      console.log('   node scripts/set-admin.js ' + (auth.currentUser.email || currentUserId));
        throw new Error('Permission denied: You must be a global admin to add categories');
    }
    
    const id = uuidv4();
    console.log(`[addCategory] Generated category ID: ${id}`);
    
    // Get existing categories to determine order
    const existingCategories = await getCategories(eventId);
    const maxOrder = existingCategories.reduce((max, cat) => Math.max(max, cat.order || 0), -1);
    console.log(`[addCategory] Existing categories: ${existingCategories.length}, max order: ${maxOrder}`);
    
    const categoryData: Category = {
        id,
        name,
        imageUrl,
        cookies: [], // No cookies tagged yet
        order: maxOrder + 1
    };

    // Store categories as a subcollection
    const categoryRef = doc(db, 'events', eventId, 'categories', id);
    console.log(`[addCategory] Writing to: events/${eventId}/categories/${id}`);
    
    try {
        await setDoc(categoryRef, categoryData);
        console.log(`[addCategory] ✅ Successfully created category: ${id} - ${name}`);
        return categoryData;
    } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        console.error(`[addCategory] ❌ Failed to write category:`, error);
        console.error(`[addCategory] Error code: ${firebaseError.code}, message: ${firebaseError.message}`);
        if (firebaseError.code === 'permission-denied') {
            console.error('[addCategory] Permission denied - check Firestore rules');
        }
        throw error;
    }
}

export async function getCategories(eventId: string): Promise<Category[]> {
    const q = query(collection(db, 'events', eventId, 'categories'));
    const querySnapshot = await getDocs(q);
    
    const categories = querySnapshot.docs.map(doc => doc.data() as Category);
    // Sort by order, then by creation (if no order)
    return categories.sort((a, b) => {
        const orderA = a.order ?? Infinity;
        const orderB = b.order ?? Infinity;
        return orderA - orderB;
    });
}

export async function updateCategoryOrder(eventId: string, categoryId: string, newOrder: number): Promise<void> {
    const ref = doc(db, 'events', eventId, 'categories', categoryId);
    await updateDoc(ref, { order: newOrder });
}

export async function getVotes(eventId: string): Promise<UserVote[]> {
    const q = query(collection(db, 'events', eventId, 'votes'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserVote);
}

async function deleteSubcollection(eventId: string, subcollectionName: string): Promise<void> {
    const subcollectionRef = collection(db, 'events', eventId, subcollectionName);
    const snapshot = await getDocs(subcollectionRef);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

export async function updateEventStatus(eventId: string, status: 'voting' | 'completed'): Promise<void> {
    const ref = doc(db, 'events', eventId);
    await updateDoc(ref, { status });
}

export async function deleteCategory(eventId: string, categoryId: string, imageUrl: string): Promise<void> {
    // Delete category document
    await deleteDoc(doc(db, 'events', eventId, 'categories', categoryId));
    
    // Delete image from storage (extract path from URL)
    try {
        // Extract file path from URL - Firebase Storage URLs have the file path encoded
        const urlParts = imageUrl.split('/');
        const oIndex = urlParts.findIndex(part => part === 'o');
        if (oIndex !== -1 && oIndex < urlParts.length - 1) {
            // Get the path after 'o' and before '?'
            const encodedPath = urlParts[oIndex + 1].split('?')[0];
            const filePath = decodeURIComponent(encodedPath);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
        }
    } catch (err) {
        console.error("Failed to delete image from storage:", err);
        // Continue even if storage delete fails
    }
}

/**
 * Convert polygon from Firestore format [{x, y}, {x, y}] to tuple format [[x, y], [x, y]]
 */
function convertPolygonFromFirestore(
  polygon: Array<{ x: number; y: number }> | undefined | null
): Array<[number, number]> | undefined {
  if (!polygon || !Array.isArray(polygon) || polygon.length === 0) {
    return undefined;
  }
  try {
    return polygon.map((point) => {
      if (typeof point === 'object' && 'x' in point && 'y' in point) {
        return [point.x, point.y] as [number, number];
      }
      // Handle case where point might already be in tuple format
      if (Array.isArray(point) && point.length === 2) {
        return [point[0], point[1]] as [number, number];
      }
      throw new Error(`Invalid polygon point format: ${JSON.stringify(point)}`);
    });
  } catch (error) {
    console.warn('Error converting polygon from Firestore format:', error);
    return undefined;
  }
}

/**
 * Extract file path from Firebase Storage download URL
 * Handles both formats:
 * - https://storage.googleapis.com/{bucket}/{path}
 * - https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
 */
function extractFilePathFromUrl(imageUrl: string): string | null {
  try {
    // Try storage.googleapis.com format first
    if (imageUrl.includes('storage.googleapis.com')) {
      const urlParts = imageUrl.split('storage.googleapis.com/');
      if (urlParts.length > 1) {
        const pathPart = urlParts[1].split('?')[0];
        return pathPart;
      }
    }
    
    // Try firebasestorage.googleapis.com format
    const urlParts = imageUrl.split('/');
    const oIndex = urlParts.findIndex(part => part === 'o');
    if (oIndex !== -1 && oIndex < urlParts.length - 1) {
      // Get the path after 'o' and before '?'
      const encodedPath = urlParts[oIndex + 1].split('?')[0];
      const filePath = decodeURIComponent(encodedPath);
      return filePath;
    }

    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
}

/**
 * Get cookie detection results for an image URL
 * Returns null if no detection results are found
 */
export async function getImageDetectionResults(imageUrl: string): Promise<Array<{
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: Array<[number, number]>;
  confidence: number;
}> | null> {
  try {
    console.log(`[getImageDetectionResults] Attempting to get results for imageUrl: ${imageUrl}`);
    const filePath = extractFilePathFromUrl(imageUrl);
    if (!filePath) {
      console.warn('[getImageDetectionResults] Could not extract file path from URL:', imageUrl);
      return null;
    }
    console.log(`[getImageDetectionResults] Extracted filePath: ${filePath}`);

    // Create document ID from file path (same logic as storage trigger)
    const detectionDocId = filePath.replace(/\//g, '_').replace(/\./g, '_');
    console.log(`[getImageDetectionResults] Generated detectionDocId: ${detectionDocId}`);
    const detectionRef = doc(db, 'image_detections', detectionDocId);
    const detectionSnap = await getDoc(detectionRef);

    console.log(`[getImageDetectionResults] Document exists: ${detectionSnap.exists()}`);
    if (detectionSnap.exists()) {
      const data = detectionSnap.data();
      const cookies = data.detectedCookies || null;
      if (cookies && Array.isArray(cookies)) {
        console.log(`[getImageDetectionResults] Found ${cookies.length} detected cookies`);
        // Convert polygons from Firestore format back to tuple format
        interface FirestoreCookie {
          x?: unknown;
          y?: unknown;
          width?: unknown;
          height?: unknown;
          polygon?: unknown;
          confidence?: unknown;
          [key: string]: unknown;
        }
        const convertedCookies = cookies.map((cookie: FirestoreCookie) => {
          const converted = {
            ...cookie,
            polygon: convertPolygonFromFirestore(cookie.polygon),
          };
          if (converted.polygon) {
            console.log(`[getImageDetectionResults] Cookie has polygon with ${converted.polygon.length} points`);
          }
          return converted;
        });
        return convertedCookies;
      }
      return cookies;
    }

    return null;
  } catch (error) {
    console.error('Error fetching detection results:', error);
    return null;
  }
}

/**
 * Watch for cookie detection results for an image URL using a real-time listener
 * Returns an unsubscribe function
 */
export function watchImageDetectionResults(
  imageUrl: string,
  callback: (results: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    polygon?: Array<[number, number]>;
    confidence: number;
  }> | null) => void
): () => void {
  const filePath = extractFilePathFromUrl(imageUrl);
  if (!filePath) {
    console.warn('[watchImageDetectionResults] Could not extract file path from URL:', imageUrl);
    callback(null);
    return () => {}; // Return no-op unsubscribe
  }

  // Create document ID from file path (same logic as storage trigger)
  const detectionDocId = filePath.replace(/\//g, '_').replace(/\./g, '_');
  const detectionRef = doc(db, 'image_detections', detectionDocId);
  
  console.log(`[watchImageDetectionResults] Setting up listener for imageUrl: ${imageUrl}`);
  console.log(`[watchImageDetectionResults] Extracted filePath: ${filePath}`);
  console.log(`[watchImageDetectionResults] Generated detectionDocId: ${detectionDocId}`);
  console.log(`[watchImageDetectionResults] Full document path: image_detections/${detectionDocId}`);
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(
    detectionRef,
    (snapshot) => {
      console.log(`[watchImageDetectionResults] Snapshot exists: ${snapshot.exists()}`);
      console.log(`[watchImageDetectionResults] Document path: image_detections/${detectionDocId}`);
      if (!snapshot.exists()) {
        console.warn(`[watchImageDetectionResults] Detection document does not exist. File path: ${filePath}, Doc ID: ${detectionDocId}`);
        console.warn(`[watchImageDetectionResults] This usually means detection hasn't been run for this image yet.`);
      }
      if (snapshot.exists()) {
        const data = snapshot.data();
        const cookies = data.detectedCookies || null;
        console.log(`[watchImageDetectionResults] Cookies data type: ${typeof cookies}, isArray: ${Array.isArray(cookies)}, length: ${cookies?.length || 0}`);
        if (cookies && Array.isArray(cookies)) {
          console.log(`[watchImageDetectionResults] Found ${cookies.length} detected cookies`);
          // Convert polygons from Firestore format to tuple format
          interface FirestoreCookie {
            x?: unknown;
            y?: unknown;
            width?: unknown;
            height?: unknown;
            polygon?: unknown;
            confidence?: unknown;
            [key: string]: unknown;
          }
          const convertedCookies = cookies.map((cookie: FirestoreCookie) => {
            const converted = {
              ...cookie,
              polygon: convertPolygonFromFirestore(cookie.polygon),
            };
            if (converted.polygon) {
              console.log(`[watchImageDetectionResults] Cookie has polygon with ${converted.polygon.length} points`);
            }
            return converted;
          });
          callback(convertedCookies);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error watching detection results:', error);
      callback(null);
    }
  );

  return unsubscribe;
}

/**
 * Get all image detection results from Firestore
 * Returns array of detection documents with converted polygons
 */
export async function getAllImageDetections(): Promise<Array<{
  id: string;
  filePath: string;
  imageUrl: string;
  detectedCookies: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    polygon?: Array<[number, number]>;
    confidence: number;
  }>;
  count: number;
  detectedAt?: unknown;
  contentType?: string;
}>> {
  try {
    const detectionsRef = collection(db, 'image_detections');
    const snapshot = await getDocs(detectionsRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const cookies = data.detectedCookies || [];
      
      // Convert polygons from Firestore format to tuple format
      interface FirestoreCookie {
        x?: unknown;
        y?: unknown;
        width?: unknown;
        height?: unknown;
        polygon?: unknown;
        confidence?: unknown;
        [key: string]: unknown;
      }
      const convertedCookies = cookies.map((cookie: FirestoreCookie) => ({
        ...cookie,
        polygon: convertPolygonFromFirestore(cookie.polygon),
      }));
      
      return {
        id: doc.id,
        filePath: data.filePath || '',
        imageUrl: data.imageUrl || '',
        detectedCookies: convertedCookies,
        count: data.count || convertedCookies.length,
        detectedAt: data.detectedAt,
        contentType: data.contentType,
      };
    });
  } catch (error) {
    console.error('Error fetching all image detections:', error);
    throw error;
  }
}

/**
 * Watch for changes to all image detections in real-time
 * 
 * This function sets up a real-time listener that watches the entire image_detections collection
 * and calls the callback whenever any detection changes. The callback receives all detections
 * and should filter them as needed.
 * 
 * @param callback - Function called whenever detections change, receives all detections
 * @returns Unsubscribe function to stop watching
 */
export function watchAllImageDetections(
  callback: (detections: Array<{
    id: string;
    filePath: string;
    imageUrl: string;
    detectedCookies: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      polygon?: Array<[number, number]>;
      confidence: number;
    }>;
    count: number;
    detectedAt?: unknown;
    contentType?: string;
  }>) => void
): () => void {
  const detectionsRef = collection(db, 'image_detections');
  
  const unsubscribe = onSnapshot(
    detectionsRef,
    (snapshot) => {
      const detections = snapshot.docs.map(doc => {
        const data = doc.data();
        const cookies = data.detectedCookies || [];
        
        // Convert polygons from Firestore format to tuple format
        interface FirestoreCookie {
          x?: unknown;
          y?: unknown;
          width?: unknown;
          height?: unknown;
          polygon?: unknown;
          confidence?: unknown;
          [key: string]: unknown;
        }
        const convertedCookies = cookies.map((cookie: FirestoreCookie) => ({
          ...cookie,
          polygon: convertPolygonFromFirestore(cookie.polygon),
        }));
        
        return {
          id: doc.id,
          filePath: data.filePath || '',
          imageUrl: data.imageUrl || '',
          detectedCookies: convertedCookies,
          count: data.count || convertedCookies.length,
          detectedAt: data.detectedAt,
          contentType: data.contentType,
        };
      });
      
      callback(detections);
    },
    (error) => {
      console.error('[watchAllImageDetections] Error watching detections:', error);
      callback([]);
    }
  );

  return unsubscribe;
}

export async function updateCategory(eventId: string, categoryId: string, updates: { name?: string }): Promise<void> {
    const ref = doc(db, 'events', eventId, 'categories', categoryId);
    const updateData: { name?: string } = {};
    if (updates.name !== undefined) {
        updateData.name = updates.name;
    }
    await updateDoc(ref, updateData);
}

export async function addBaker(eventId: string, bakerName: string): Promise<CookieMaker> {
    const bakerId = bakerName; // Use name as ID for consistency
    const bakerData: CookieMaker = {
        id: bakerId,
        name: bakerName
    };
    await setDoc(doc(db, 'events', eventId, 'bakers', bakerId), bakerData);
    return bakerData;
}

export async function removeBaker(eventId: string, bakerId: string): Promise<void> {
    await deleteDoc(doc(db, 'events', eventId, 'bakers', bakerId));
}

export async function getBakers(eventId: string): Promise<CookieMaker[]> {
    const q = query(collection(db, 'events', eventId, 'bakers'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as CookieMaker);
}

export async function deleteEvent(eventId: string): Promise<void> {
    // Delete subcollections first
    await deleteSubcollection(eventId, 'votes');
    await deleteSubcollection(eventId, 'categories');
    await deleteSubcollection(eventId, 'bakers');

    // Then delete the event itself
    await deleteDoc(doc(db, 'events', eventId));

    // Note: Images are now stored in shared/cookies and can be reused across events
    // We don't delete shared images when deleting an event since they might be used by other events
    // If you need to clean up unused images, you'll need to check which events reference each image
}