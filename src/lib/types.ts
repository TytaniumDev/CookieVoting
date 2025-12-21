export interface VoteEvent {
  id: string;
  name: string;
  adminCode: string;
  status: 'voting' | 'completed';
  createdAt: number;
}

export interface CookieMaker {
  id: string;
  name: string;
}

export interface CookieCoordinate {
    id: string; // Unique ID for this specific cookie marker
    number: number; // The visible number (1, 2, 3...)
    makerName: string; // "Ryan", "Kelly", etc.
    x: number; // Percent x (for display/backward compatibility)
    y: number; // Percent y (for display/backward compatibility)
    detectedCookieId?: string; // ID of the detected cookie this tag is associated with (new ID-based approach)
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
}
