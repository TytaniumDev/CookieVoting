import { type CookieCoordinate } from './types';

/**
 * Sorts and numbers cookies for a category.
 * Logic: top to bottom (by y), then left to right (by x).
 * Cookies with similar y values within 15% are considered in the same row.
 */
export function sortAndNumberCookies(cookies: CookieCoordinate[]): CookieCoordinate[] {
  // Sort cookies: top to bottom (by y), then left to right (by x)
  const sorted = [...cookies].sort((a, b) => {
    const yDiff = a.y - b.y;
    // If y difference is small (within 15%), consider them in the same row, sort by x
    if (Math.abs(yDiff) < 15) {
      return a.x - b.x;
    }
    // Otherwise, sort by y (top to bottom)
    return yDiff;
  });

  // Assign numbers based on sorted position
  return sorted.map((cookie, index) => ({
    ...cookie,
    number: index + 1,
  }));
}
