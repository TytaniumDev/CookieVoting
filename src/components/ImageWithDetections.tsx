import React from 'react';
import type { DetectedCookie } from '../lib/cookieDetectionGemini';
import styles from './ImageWithDetections.module.css';

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
  imageUrl: string;
  detectedCookies: DetectedCookie[];
  onCookieClick?: (cookie: DetectedCookie, index: number, event: React.MouseEvent) => void;
  className?: string;
  borderColor?: string; // Border/stroke color. Defaults to transparent (no border)
  renderTopLeft?: (props: OverlayRenderProps) => React.ReactNode; // Custom component for top-left
  renderBottom?: (props: OverlayRenderProps) => React.ReactNode; // Custom component for bottom
  renderCenter?: (props: OverlayRenderProps) => React.ReactNode; // Custom component for center (e.g., animations)
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
    // Fallback to simple polygon for insufficient points
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  }

  const pathSegments: string[] = [];
  const numPoints = points.length;

  for (let i = 0; i < numPoints; i++) {
    const prev = points[(i - 1 + numPoints) % numPoints];
    const curr = points[i];
    const next = points[(i + 1) % numPoints];

    // Calculate vectors
    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];

    // Normalize
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

    // Calculate angle
    const dot = nx1 * nx2 + ny1 * ny2;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

    // Calculate distance to offset control points
    const dist = Math.min(radius, len1 * 0.5, len2 * 0.5);

    if (angle < Math.PI - 0.1) {
      // Sharp corner - add rounded corner
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
      // Smooth corner - straight line
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
 * This utility function extracts bounding box information from a detected cookie.
 * If the cookie has a polygon shape, it calculates bounds from the polygon points.
 * Otherwise, it uses the bounding box properties directly.
 * 
 * @param detected - Detected cookie object with position and shape data
 * @returns Object containing top-left position, bottom position, and center coordinates
 */
export function calculateCookieBounds(detected: DetectedCookie): CookieBounds {
  if (detected.polygon && detected.polygon.length >= 3) {
    // Use actual polygon bounds
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
    // Fall back to bounding box
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
 * Reusable component for rendering images with cookie detection overlays.
 * 
 * This component displays an image with visual overlays for detected cookies.
 * It supports both polygon-based detection shapes and bounding boxes as fallback.
 * The component provides interactive features like hover effects and click handlers,
 * and allows for custom rendering of overlays at different positions.
 * 
 * @example
 * ```tsx
 * <ImageWithDetections
 *   imageUrl="/path/to/image.jpg"
 *   detectedCookies={[
 *     { x: 50, y: 50, width: 10, height: 10, confidence: 0.95, polygon: [[45,45], [55,45], [55,55], [45,55]] }
 *   ]}
 *   onCookieClick={(cookie, index) => console.log('Clicked cookie', index)}
 * />
 * ```
 * 
 * @param props - Component props
 * @param props.imageUrl - URL of the image to display
 * @param props.detectedCookies - Array of detected cookie objects with position and shape data
 * @param props.onCookieClick - Optional callback when a cookie overlay is clicked
 * @param props.className - Optional CSS class name for the container
 * @param props.borderColor - Border color for cookie overlays (default: transparent)
 * @param props.renderTopLeft - Optional render function for top-left overlay content
 * @param props.renderBottom - Optional render function for bottom overlay content
 * @param props.renderCenter - Optional render function for center overlay content (e.g., animations)
 * 
 * @returns JSX element containing the image with detection overlays
 */
export function ImageWithDetections({ 
  imageUrl, 
  detectedCookies, 
  onCookieClick,
  className,
  borderColor = 'transparent',
  renderTopLeft,
  renderBottom,
  renderCenter
}: Props) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  
  // Debug logging
  React.useEffect(() => {
    console.log('[ImageWithDetections] Rendering with:', {
      imageUrl,
      cookieCount: detectedCookies.length,
      cookiesWithPolygons: detectedCookies.filter(c => c.polygon && c.polygon.length >= 3).length,
      hoveredIndex,
    });
  }, [imageUrl, detectedCookies.length, hoveredIndex]);
  
  React.useEffect(() => {
    if (hoveredIndex !== null) {
      console.log('[ImageWithDetections] Hover state changed - now hovering over cookie:', hoveredIndex);
    }
  }, [hoveredIndex]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.imageWrapper}>
        <img 
          src={imageUrl} 
          alt="Cookie detection" 
          className={styles.image}
          style={{ pointerEvents: 'none' }}
        />
        {/* Render detected cookie outlines */}
        {detectedCookies.map((detected, index) => {
          // Calculate bounds for this cookie
          const bounds = calculateCookieBounds(detected);
          
          // Use polygon if available, otherwise fall back to bounding box
          const hasPolygon = detected.polygon && detected.polygon.length >= 3;
          
          // Debug: log if polygon is missing or invalid
          if (!hasPolygon && detected.polygon) {
            console.warn(`[ImageWithDetections] Cookie ${index} has invalid polygon:`, {
              polygonLength: detected.polygon.length,
              polygon: detected.polygon,
            });
          }
          
          return (
            <React.Fragment key={`cookie-${index}`}>
              {hasPolygon ? (
                // Render polygon shape with very transparent blue overlay
                <svg
                  key={`detected-polygon-${index}`}
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
                    className={styles.cookieOverlay}
                    d={smoothPolygon(detected.polygon!, 5)}
                    fill={hoveredIndex === index ? "rgba(33, 150, 243, 0.3)" : "rgba(33, 150, 243, 0)"}
                    stroke={borderColor}
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ 
                      cursor: onCookieClick ? 'pointer' : 'default',
                      pointerEvents: 'all',
                      transition: 'fill 0.2s ease',
                    }}
                    onMouseEnter={() => {
                      console.log(`[ImageWithDetections] Mouse enter cookie ${index}`);
                      setHoveredIndex(index);
                    }}
                    onMouseLeave={() => {
                      console.log(`[ImageWithDetections] Mouse leave cookie ${index}`);
                      setHoveredIndex(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCookieClick?.(detected, index, e);
                    }}
                  />
                  <title>{`Cookie ${index + 1}: ${(detected.confidence * 100).toFixed(1)}% confidence`}</title>
                </svg>
              ) : (
                // Fall back to bounding box
                <div
                  key={`detected-${index}`}
                  className={`${styles.boundingBox} ${styles.cookieOverlay}`}
                  style={{
                    left: `${detected.x - detected.width / 2}%`,
                    top: `${detected.y - detected.height / 2}%`,
                    width: `${detected.width}%`,
                    height: `${detected.height}%`,
                    backgroundColor: hoveredIndex === index ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0)',
                    borderColor: borderColor,
                    cursor: onCookieClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s ease',
                    pointerEvents: 'all',
                    zIndex: 15,
                  }}
                  onMouseEnter={(e) => {
                    console.log(`[ImageWithDetections] Mouse enter bounding box ${index}`, e);
                    e.stopPropagation();
                    setHoveredIndex(index);
                  }}
                  onMouseLeave={(e) => {
                    console.log(`[ImageWithDetections] Mouse leave bounding box ${index}`, e);
                    e.stopPropagation();
                    setHoveredIndex(null);
                  }}
                  title={`Cookie ${index + 1}: ${(detected.confidence * 100).toFixed(1)}% confidence`}
                  onClick={(e) => {
                    console.log(`[ImageWithDetections] Bounding box ${index} clicked`);
                    e.stopPropagation();
                    onCookieClick?.(detected, index, e);
                  }}
                />
              )}
              
              {/* Custom overlays */}
              {(() => {
                const overlayProps: OverlayRenderProps = { detected, index, bounds };
                return (
                  <>
                    {/* Custom top-left overlay */}
                    {renderTopLeft && (
                      <div
                        key={`top-left-${index}`}
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
                    
                    {/* Custom center overlay (for animations, etc.) */}
                    {renderCenter && (
                      <div
                        key={`center-${index}`}
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
                    
                    {/* Custom bottom overlay */}
                    {renderBottom && (
                      <div
                        key={`bottom-${index}`}
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
