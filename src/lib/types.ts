export interface VoteEvent {
  id: string;
  name: string;
  adminCode: string;
  status: 'voting' | 'completed';
  createdAt: number;
  resultsAvailableTime?: number; // Timestamp when results become visible
}

export interface CookieMaker {
  id: string;
  name: string;
}

export type Baker = CookieMaker; // Alias for clarity in new architecture

export interface ImageEntity {
  id: string; // Firestore Doc ID
  url: string;
  storagePath: string;
  detectedCookies: DetectedCookie[];
  eventId?: string; // Optional association
  createdAt: number;
}

export interface DetectedCookie {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  polygon?: [number, number][];
}

export interface CookieEntity {
  id: string; // Unique ID (Vote target)
  eventId: string;
  categoryId: string; // The "Plate" it belongs to
  bakerId: string;    // Who made it
  imageId: string;    // Visual source
  detectionId?: string; // Link to raw detection (for polygon/bbox). Optional because manual tags might not have detections.
  label: number;      // "Cookie #1"
  x: number;          // Normalized X (0-100)
  y: number;          // Normalized Y (0-100)
}



export interface CookieCoordinate {
    id: string; // Unique ID for this specific cookie marker
    number: number; // The visible number (1, 2, 3...)
    makerName: string; // "Ryan", "Kelly", etc.
    x: number; // Percent x (for display/backward compatibility)
    y: number; // Percent y (for display/backward compatibility)
    detectedCookieId?: string; // ID of the detected cookie this tag is associated with (new ID-based approach)
  detection?: DetectedCookie; // The full detection object for rendering
}

// Cookie coordinate without maker name (for voting UI privacy)
export type CookieCoordinatePublic = Omit<CookieCoordinate, 'makerName'>;

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  cookies: CookieCoordinate[];
  order?: number; // Optional order field for sorting
}

export interface UserVote {
  userId: string;
  votes: Record<string, number>; // categoryId -> cookieNumber
  timestamp: number;
  viewedResults?: boolean; // If true, user has seen results and cannot change votes
}
