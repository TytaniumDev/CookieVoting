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
  /** Firestore Document ID */
  id: string;
  /** Public download URL for the image */
  url: string;
  /** Firebase Storage path (e.g., "shared/cookies/uuid.png" or "cropped_cookies/eventId/catId/uuid.png") */
  storagePath: string;
  /** AI-detected cookie regions on this image (for tray images) */
  detectedCookies: DetectedCookie[];
  /** Associated event ID */
  eventId?: string;
  /** Timestamp when the image was uploaded */
  createdAt: number;
  /**
   * Image type to distinguish between tray images and individual cropped cookies
   * - 'tray_image': Full tray/plate image uploaded to a category
   * - 'cropped_cookie': Individual cookie image created by the Cookie Cropper
   */
  type?: 'tray_image' | 'cropped_cookie';
  /** Category this image belongs to (required for cropped_cookie type) */
  categoryId?: string;
  /** Assigned baker ID (for cropped_cookie type, set during tagging) */
  bakerId?: string;
  /** Source tray image URL this was cropped from (for cropped_cookie type) */
  sourceTrayImageUrl?: string;
  /** Original crop region on the source image (for cropped_cookie type) */
  cropRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * AI-detected cookie bounding box.
 * Coordinates are in PIXELS (absolute position on the source image).
 */
export interface DetectedCookie {
  /** X position in pixels from left edge of image */
  x: number;
  /** Y position in pixels from top edge of image */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** AI confidence score (0-1) */
  confidence: number;
  /** Optional polygon outline for irregular cookie shapes */
  polygon?: [number, number][];
}

/**
 * Tagged cookie entity for voting.
 * Coordinates are NORMALIZED as percentages (0-100) relative to the category image.
 */
export interface CookieEntity {
  id: string; // Unique ID (Vote target)
  eventId: string;
  categoryId: string; // The "Plate" it belongs to
  bakerId: string; // Who made it
  imageId: string; // Visual source
  detectionId?: string; // Link to raw detection (for polygon/bbox). Optional because manual tags might not have detections.
  label: number; // "Cookie #1"
  /** Normalized X position (0-100 percentage from left edge) */
  x: number;
  /** Normalized Y position (0-100 percentage from top edge) */
  y: number;
}

/**
 * Cookie coordinate for display on category images.
 * Coordinates are PERCENTAGES (0-100) for responsive positioning.
 */
export interface CookieCoordinate {
  id: string; // Unique ID for this specific cookie marker
  number: number; // The visible number (1, 2, 3...)
  makerName: string; // "Ryan", "Kelly", etc.
  /** Percentage X position (0-100) for display */
  x: number;
  /** Percentage Y position (0-100) for display */
  y: number;
  detectedCookieId?: string; // ID of the detected cookie this tag is associated with (new ID-based approach)
  detection?: DetectedCookie; // The full detection object for rendering
}

// Cookie coordinate without maker name (for voting UI privacy)
export type CookieCoordinatePublic = Omit<CookieCoordinate, 'makerName'>;

/**
 * Cookie interface for individual cookie images.
 * Used for Vision API processed cookies stored in Category.cookies array.
 */
export interface Cookie {
  id: string; // Unique ID (used for voting)
  imageUrl: string; // Public URL to the individual cropped cookie image
  bakerId?: string; // Optional baker ID reference
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  cookies: Cookie[]; // Array of individual cookie images
  order?: number; // Optional order field for sorting
  batchId?: string; // Links to cookie_batches/{batchId} if processed via Vision API
}

export interface UserVote {
  userId: string;
  votes: Record<string, string[]>; // categoryId -> cookieId[] (array for ranked choice compatibility)
  timestamp: number;
  viewedResults?: boolean; // If true, user has seen results and cannot change votes
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}
