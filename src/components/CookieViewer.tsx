import React from 'react';
import type { DetectedCookie } from '../lib/cookieDetectionGemini';
import styles from './CookieViewer.module.css';

// Re-export for convenience
export type { DetectedCookie };

export interface CookieBounds {
  topLeftX: number;
  topLeftY: number;
  bottomY: number;
  centerX: number;
  centerY: number;
}

interface OverlayRenderProps {
  detected: DetectedCookie;
  index: number;
  bounds: CookieBounds;
}

interface Props {
  /** URL of the image to display */
  imageUrl: string;
  /** Array of detected cookie objects with position and shape data */
  detectedCookies: DetectedCookie[];
  /** Callback when a cookie overlay is clicked */
  onCookieClick?: (cookie: DetectedCookie, index: number, event: React.MouseEvent) => void;
  /** Optional CSS class name for the container */
  className?: string;
  /** Border/stroke color for cookie overlays (default: transparent) */
  borderColor?: string;
  /** Custom component renderer for top-left overlay position */
  renderTopLeft?: (props: OverlayRenderProps) => React.ReactNode;
  /** Custom component renderer for bottom overlay position */
  renderBottom?: (props: OverlayRenderProps) => React.ReactNode;
  /** Custom component renderer for center overlay position (e.g., animations) */
  renderCenter?: (props: OverlayRenderProps) => React.ReactNode;
  /** Optional array of cookie numbers (parallel to detectedCookies) for numbered markers */
  cookieNumbers?: (number | undefined)[];
  /** Currently selected cookie number (for highlighting) */
  selectedCookieNumber?: number;
  /** Callback when a numbered cookie marker is clicked */
  onSelectCookie?: (cookieNumber: number) => void;
}

/**
 * Smooth out polygon corners by converting sharp angles to curved segments.
 * 
 * This function takes a polygon defined by points and converts sharp corners
 * into smooth curved segments using quadratic Bezier curves. This creates a
 * more visually appealing overlay shape.
 * 
 * @param points - Array of [x, y] coordinate pairs defining the polygon
 * @param radius - Radius of curvature for corners (default: 2)
 * @returns SVG path string with smoothed corners
 */
function smoothPolygon(points: Array<[number, number]>, radius: number = 2): string {
  if (points.length < 3) {
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  }

  const pathSegments: string[] = [];
  const numPoints = points.length;

  for (let i = 0; i < numPoints; i++) {
    const prev = points[(i - 1 + numPoints) % numPoints];
    const curr = points[i];
    const next = points[(i + 1) % numPoints];

    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    
    if (len1 === 0 || len2 === 0) {
      pathSegments.push(`${i === 0 ? 'M' : 'L'} ${curr[0]},${curr[1]}`);
      continue;
    }

    const nx1 = dx1 / len1;
    const ny1 = dy1 / len1;
    const nx2 = dx2 / len2;
    const ny2 = dy2 / len2;

    const dot = nx1 * nx2 + ny1 * ny2;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

    const dist = Math.min(radius, len1 * 0.5, len2 * 0.5);

    if (angle < Math.PI - 0.1) {
      const offset1X = curr[0] - nx1 * dist;
      const offset1Y = curr[1] - ny1 * dist;
      const offset2X = curr[0] + nx2 * dist;
      const offset2Y = curr[1] + ny2 * dist;

      if (i === 0) {
        pathSegments.push(`M ${offset1X},${offset1Y}`);
      } else {
        pathSegments.push(`L ${offset1X},${offset1Y}`);
      }
      pathSegments.push(`Q ${curr[0]},${curr[1]} ${offset2X},${offset2Y}`);
    } else {
      if (i === 0) {
        pathSegments.push(`M ${curr[0]},${curr[1]}`);
      } else {
        pathSegments.push(`L ${curr[0]},${curr[1]}`);
      }
    }
  }

  pathSegments.push('Z');
  return pathSegments.join(' ');
}

/**
 * Calculate bounds for a detected cookie (polygon or bounding box).
 * 
 * @param detected - Detected cookie object with position and shape data
 * @returns Object containing top-left position, bottom position, and center coordinates
 */
// eslint-disable-next-line react-refresh/only-export-components
export function calculateCookieBounds(detected: DetectedCookie): CookieBounds {
  if (detected.polygon && detected.polygon.length >= 3) {
    const xs = detected.polygon.map(p => p[0]);
    const ys = detected.polygon.map(p => p[1]);
    return {
      topLeftX: Math.min(...xs),
      topLeftY: Math.min(...ys),
      bottomY: Math.max(...ys),
      centerX: detected.x,
      centerY: detected.y
    };
  } else {
    return {
      topLeftX: detected.x - detected.width / 2,
      topLeftY: detected.y - detected.height / 2,
      bottomY: detected.y + detected.height / 2,
      centerX: detected.x,
      centerY: detected.y
    };
  }
}

/**
 * CookieViewer - Component for displaying cookie images with detection overlays.
 * 
 * This component displays an image with visual overlays for detected cookies.
 * It supports polygon-based detection shapes and bounding boxes as fallback.
 * The component provides interactive features like hover effects and click handlers,
 * and allows for custom rendering of overlays at different positions.
 * 
 * Features:
 * - Polygon-based detection shapes with smooth corners
 * - Bounding box fallback for detections without polygons
 * - Optional numbered markers for cookies
 * - Interactive hover effects and click handlers
 * - Custom overlay rendering at top-left, bottom, and center positions
 * 
 * @example
 * ```tsx
 * // Basic detection mode
 * <CookieViewer
 *   imageUrl="/path/to/image.jpg"
 *   detectedCookies={[
 *     { x: 50, y: 50, width: 10, height: 10, confidence: 0.95, polygon: [[45,45], [55,45], [55,55], [45,55]] }
 *   ]}
 *   onCookieClick={(cookie, index) => console.log('Clicked cookie', index)}
 * />
 * 
 * // With numbered markers and selection
 * <CookieViewer
 *   imageUrl="/path/to/image.jpg"
 *   detectedCookies={detectedCookies}
 *   cookieNumbers={[1, 2, 3, 4, 5]}
 *   selectedCookieNumber={2}
 *   onSelectCookie={(num) => console.log('Selected cookie', num)}
 * />
 * ```
 */
export function CookieViewer({
  imageUrl,
  detectedCookies,
  onCookieClick,
  className,
  borderColor = 'transparent',
  renderTopLeft,
  renderBottom,
  renderCenter,
  cookieNumbers,
  selectedCookieNumber,
  onSelectCookie
}: Props) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Handle cookie clicks
  const handleCookieClick = (detected: DetectedCookie, index: number, event: React.MouseEvent) => {
    // If we have numbered markers and onSelectCookie, use that
    const cookieNumber = cookieNumbers?.[index];
    if (cookieNumber !== undefined && onSelectCookie) {
      event.stopPropagation();
      onSelectCookie(cookieNumber);
    } else {
      // Otherwise use the generic onCookieClick
      onCookieClick?.(detected, index, event);
    }
  };

  const handleCookieKeyDown = (detected: DetectedCookie, index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const cookieNumber = cookieNumbers?.[index];
      if (cookieNumber !== undefined && onSelectCookie) {
        onSelectCookie(cookieNumber);
      } else {
        // Create a synthetic mouse event for onCookieClick
        const syntheticEvent = {
          ...event,
          stopPropagation: () => {},
        } as unknown as React.MouseEvent;
        onCookieClick?.(detected, index, syntheticEvent);
      }
    }
  };

  // Determine if a cookie is selected
  const isSelected = (index: number): boolean => {
    if (cookieNumbers && cookieNumbers[index] !== undefined && selectedCookieNumber !== undefined) {
      return cookieNumbers[index] === selectedCookieNumber;
    }
    return false;
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.imageWrapper}>
        <img 
          src={imageUrl} 
          alt="Cookie detection" 
          className={styles.image}
          style={{ pointerEvents: 'none' }}
        />
        {detectedCookies.map((detected, index) => {
        const bounds = calculateCookieBounds(detected);
        const polygon = detected.polygon;
        const hasPolygon = polygon && polygon.length >= 3;
        const selected = isSelected(index);
        const cookieNumber = cookieNumbers?.[index];
        const hasNumber = cookieNumber !== undefined;
        
        // Create a stable key based on cookie position
        const cookieKey = `cookie-${Math.round(detected.x * 100)}-${Math.round(detected.y * 100)}-${index}`;
        
        return (
          <React.Fragment key={cookieKey}>
            {hasPolygon && polygon ? (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 15,
                }}
              >
                <path
                  d={smoothPolygon(polygon, 5)}
                  fill={hoveredIndex === index ? "rgba(33, 150, 243, 0.3)" : "rgba(33, 150, 243, 0)"}
                  stroke={borderColor}
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ 
                    cursor: (hasNumber && onSelectCookie) || (!hasNumber && onCookieClick) ? 'pointer' : 'default',
                    pointerEvents: 'all',
                    transition: 'fill 0.2s ease',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={(e) => handleCookieClick(detected, index, e)}
                  onKeyDown={(e) => handleCookieKeyDown(detected, index, e)}
                  role="button"
                  tabIndex={0}
                  aria-label={hasNumber ? `Cookie ${cookieNumber}` : `Cookie ${index + 1}`}
                />
                <title>
                  {hasNumber
                    ? `Cookie ${cookieNumber}`
                    : `Cookie ${index + 1}: ${(detected.confidence * 100).toFixed(1)}% confidence`}
                </title>
              </svg>
            ) : (
              <div
                className={styles.boundingBox}
                style={{
                  left: `${detected.x - detected.width / 2}%`,
                  top: `${detected.y - detected.height / 2}%`,
                  width: `${detected.width}%`,
                  height: `${detected.height}%`,
                  backgroundColor: hoveredIndex === index ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0)',
                  borderColor: borderColor,
                  cursor: (hasNumber && onSelectCookie) || (!hasNumber && onCookieClick) ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease',
                  pointerEvents: 'all',
                  zIndex: 15,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={(e) => handleCookieClick(detected, index, e)}
                onKeyDown={(e) => handleCookieKeyDown(detected, index, e)}
                role="button"
                tabIndex={0}
                aria-label={
                  hasNumber
                    ? `Cookie ${cookieNumber}`
                    : `Cookie ${index + 1}: ${(detected.confidence * 100).toFixed(1)}% confidence`
                }
                title={
                  hasNumber
                    ? `Cookie ${cookieNumber}`
                    : `Cookie ${index + 1}: ${(detected.confidence * 100).toFixed(1)}% confidence`
                }
              />
            )}
            
            {/* Numbered marker */}
            {hasNumber && (
              <button
                className={`${styles.marker} ${selected ? styles.selected : ''}`}
                style={{ 
                  left: `${detected.x}%`, 
                  top: `${detected.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectCookie) {
                    onSelectCookie(cookieNumber);
                  }
                }}
              >
                <span className={styles.markerNumber}>{cookieNumber}</span>
              </button>
            )}
            
            {/* Custom overlays */}
            {(() => {
              const overlayProps: OverlayRenderProps = { detected, index, bounds };
              return (
                <>
                  {renderTopLeft && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${Math.max(0, bounds.topLeftX)}%`,
                        top: `${Math.max(0, bounds.topLeftY)}%`,
                        zIndex: 20,
                        pointerEvents: 'none',
                      }}
                    >
                      {renderTopLeft(overlayProps)}
                    </div>
                  )}
                  
                  {renderCenter && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${bounds.centerX}%`,
                        top: `${bounds.centerY}%`,
                        zIndex: 19,
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {renderCenter(overlayProps)}
                    </div>
                  )}
                  
                  {renderBottom && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${bounds.centerX}%`,
                        top: `${Math.min(100, bounds.bottomY + 1)}%`,
                        zIndex: 20,
                        pointerEvents: 'none',
                        transform: 'translate(-50%, 0)',
                      }}
                    >
                      {renderBottom(overlayProps)}
                    </div>
                  )}
                </>
              );
            })()}
          </React.Fragment>
        );
      })}
      </div>
    </div>
  );
}
