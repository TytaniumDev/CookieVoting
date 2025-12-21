import { type CookieCoordinate } from './types';
import { calculateCookieBounds, type DetectedCookie } from '../components/CookieViewer';

interface CookieWithBounds {
    cookie: CookieCoordinate;
    bounds: { topLeftY: number; bottomY: number; centerX: number };
}

/**
 * Calculate smart label positions for cookie names to avoid overflow and overlap
 * Returns an array of label position data: { top, left, anchor } where anchor is 'top' or 'bottom'
 */
export function calculateSmartLabelPositions(
    items: Array<CookieWithBounds>
): Array<{ top: number; left: number; anchor: 'top' | 'bottom' }> {
    // Estimated label height in percentage (conservative estimate: ~3.5% of image height)
    const LABEL_HEIGHT_PCT = 3.5;
    // Minimum spacing between labels to prevent overlap (percentage)
    const MIN_SPACING_PCT = 1;
    // Buffer from cookie edge
    const COOKIE_BUFFER_PCT = 1;
    // Horizontal threshold for considering labels overlapping
    const HORIZONTAL_OVERLAP_THRESHOLD = 25; // Labels within 25% horizontally are considered overlapping
    
    const positions: Array<{ top: number; left: number; anchor: 'top' | 'bottom' }> = [];
    
    // Helper to check if two label positions would overlap
    const wouldOverlap = (top1: number, left1: number, top2: number, left2: number): boolean => {
        const verticalOverlap = !(top1 + LABEL_HEIGHT_PCT < top2 - MIN_SPACING_PCT || top1 > top2 + LABEL_HEIGHT_PCT + MIN_SPACING_PCT);
        const horizontalOverlap = Math.abs(left1 - left2) < HORIZONTAL_OVERLAP_THRESHOLD;
        return verticalOverlap && horizontalOverlap;
    };
    
    // Calculate all positions, checking for overlaps
    items.forEach((item, index) => {
        const { bounds } = item;
        const centerX = bounds.centerX;
        
        // Try bottom position first (preferred)
        const bottomY = bounds.bottomY;
        const bottomTop = bottomY + COOKIE_BUFFER_PCT;
        const bottomBottom = bottomTop + LABEL_HEIGHT_PCT;
        
        // Check if bottom position would overflow page
        const wouldOverflowBottom = bottomBottom > 100;
        
        // Check for overlaps with existing labels at bottom position
        let bottomHasOverlap = false;
        if (!wouldOverflowBottom) {
            for (let i = 0; i < positions.length; i++) {
                const existing = positions[i];
                if (wouldOverlap(bottomTop, centerX, existing.top, existing.left)) {
                    bottomHasOverlap = true;
                    break;
                }
            }
        }
        
        // If bottom works, use it
        if (!wouldOverflowBottom && !bottomHasOverlap) {
            positions.push({
                top: Math.min(100, bottomTop),
                left: centerX,
                anchor: 'bottom'
            });
            return;
        }
        
        // Try top position as fallback
        const topY = bounds.topLeftY;
        const topTop = Math.max(0, topY - COOKIE_BUFFER_PCT - LABEL_HEIGHT_PCT);
        
        // Check for overlaps at top position
        let topHasOverlap = false;
        for (let i = 0; i < positions.length; i++) {
            const existing = positions[i];
            if (wouldOverlap(topTop, centerX, existing.top, existing.left)) {
                topHasOverlap = true;
                break;
            }
        }
        
        // If top works without overlap, use it
        if (!topHasOverlap) {
            positions.push({
                top: topTop,
                left: centerX,
                anchor: 'top'
            });
            return;
        }
        
        // Both positions have overlap - use bottom anyway but add horizontal offset to reduce clustering
        // Find nearby labels at similar vertical positions
        const nearbyLabels = positions.filter(p => {
            const yDiff = Math.abs(bottomTop - p.top);
            return yDiff < LABEL_HEIGHT_PCT * 2.5; // Within 2.5 label heights
        });
        
        let horizontalOffset = 0;
        if (nearbyLabels.length > 0) {
            // Calculate average horizontal position of nearby labels
            const avgNearbyX = nearbyLabels.reduce((sum, p) => sum + p.left, 0) / nearbyLabels.length;
            
            // Offset away from the cluster
            const offsetDirection = centerX > avgNearbyX ? 1 : -1;
            const maxOffset = Math.min(15, Math.abs(centerX - avgNearbyX) + 8);
            horizontalOffset = offsetDirection * maxOffset;
            
            // If offset would still cause overlap, try the other direction
            const proposedLeft = centerX + horizontalOffset;
            const stillOverlaps = positions.some(p => wouldOverlap(bottomTop, proposedLeft, p.top, p.left));
            
            if (stillOverlaps) {
                // Try opposite direction
                horizontalOffset = -horizontalOffset;
                const altProposedLeft = centerX + horizontalOffset;
                const altOverlaps = positions.some(p => wouldOverlap(bottomTop, altProposedLeft, p.top, p.left));
                
                if (altOverlaps) {
                    // Both directions overlap, just use minimal offset to separate
                    horizontalOffset = (index % 2 === 0 ? 1 : -1) * 10;
                }
            }
        } else {
            // No nearby labels, but we have overlap - use alternating offset
            horizontalOffset = (index % 2 === 0 ? 1 : -1) * 8;
        }
        
        positions.push({
            top: Math.min(100, bottomTop),
            left: Math.max(0, Math.min(100, centerX + horizontalOffset)),
            anchor: 'bottom'
        });
    });
    
    return positions;
}

/**
 * Helper function to calculate bounds from a cookie coordinate and detected cookie
 */
export function calculateBoundsFromCookie(
    cookie: CookieCoordinate,
    detectedCookie: DetectedCookie | null
): { topLeftX: number; topLeftY: number; bottomY: number; centerX: number } {
    if (detectedCookie) {
        return calculateCookieBounds(detectedCookie);
    } else {
        // Default: assume cookie is ~8% in size, positioned from center
        return {
            topLeftX: cookie.x - 4,
            topLeftY: cookie.y - 4,
            bottomY: cookie.y + 4,
            centerX: cookie.x
        };
    }
}

