import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { DetectedCookie } from '../../../lib/types';
import { cn } from '../../../lib/cn';

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
  /** Optional CSS class name for the image element */
  imageClassName?: string;
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
  /** Index of the currently selected cookie (for styling specific detections without numbers) */
  selectedIndex?: number;
  /** Callback when a numbered cookie is selected */
  onSelectCookie?: (cookieNumber: number) => void;
  /** Optional flag to disable zoom and pan functionality */
  disableZoom?: boolean;
}

/**
 * Smooth out polygon corners by converting sharp angles to curved segments.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function smoothPolygon(points: Array<[number, number]>, radius: number = 2): string {
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
 */
// eslint-disable-next-line react-refresh/only-export-components
export function calculateCookieBounds(detected: DetectedCookie): CookieBounds {
  if (detected.polygon && detected.polygon.length >= 3) {
    const xs = detected.polygon.map((p) => p[0]);
    const ys = detected.polygon.map((p) => p[1]);
    return {
      topLeftX: Math.min(...xs),
      topLeftY: Math.min(...ys),
      bottomY: Math.max(...ys),
      centerX: detected.x,
      centerY: detected.y,
    };
  } else {
    return {
      topLeftX: detected.x - detected.width / 2,
      topLeftY: detected.y - detected.height / 2,
      bottomY: detected.y + detected.height / 2,
      centerX: detected.x,
      centerY: detected.y,
    };
  }
}

/**
 * CookieViewer - Component for displaying cookie images with detection overlays.
 *
 * The component ensures the image is never cropped - it scales to fit while maintaining
 * aspect ratio. Detection overlays are positioned relative to the actual rendered image.
 */
export function CookieViewer({
  imageUrl,
  detectedCookies,
  onCookieClick,
  className,
  imageClassName,
  borderColor = 'transparent',
  renderTopLeft,
  renderBottom,
  renderCenter,
  cookieNumbers,
  selectedCookieNumber,
  selectedIndex,
  onSelectCookie,
  disableZoom = false,
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  // Track the actual rendered image area (accounting for object-fit: contain)
  const [renderedImageBounds, setRenderedImageBounds] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate the actual rendered image bounds within an object-fit: contain element
  const updateImageDimensions = useCallback(() => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;

    if (naturalWidth === 0 || naturalHeight === 0 || clientWidth === 0 || clientHeight === 0) {
      return;
    }

    // Calculate the rendered image size with object-fit: contain
    const naturalAspect = naturalWidth / naturalHeight;
    const containerAspect = clientWidth / clientHeight;

    let renderedWidth: number;
    let renderedHeight: number;

    if (naturalAspect > containerAspect) {
      // Image is wider than container - constrained by width
      renderedWidth = clientWidth;
      renderedHeight = clientWidth / naturalAspect;
    } else {
      // Image is taller than container - constrained by height
      renderedHeight = clientHeight;
      renderedWidth = clientHeight * naturalAspect;
    }

    // Calculate offset (centered due to object-fit: contain)
    const offsetX = (clientWidth - renderedWidth) / 2;
    const offsetY = (clientHeight - renderedHeight) / 2;

    setRenderedImageBounds({
      width: renderedWidth,
      height: renderedHeight,
      offsetX,
      offsetY,
    });
  }, []);


  useEffect(() => {
    updateImageDimensions();
    window.addEventListener('resize', updateImageDimensions);
    return () => window.removeEventListener('resize', updateImageDimensions);
  }, [updateImageDimensions]);

  // Handle cookie clicks
  const handleCookieClick = (detected: DetectedCookie, index: number, event: React.MouseEvent) => {
    const cookieNumber = cookieNumbers?.[index];
    if (cookieNumber !== undefined && onSelectCookie) {
      event.stopPropagation();
      onSelectCookie(cookieNumber);
    } else {
      onCookieClick?.(detected, index, event);
    }
  };

  const handleCookieKeyDown = (
    detected: DetectedCookie,
    index: number,
    event: React.KeyboardEvent,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const cookieNumber = cookieNumbers?.[index];
      if (cookieNumber !== undefined && onSelectCookie) {
        onSelectCookie(cookieNumber);
      } else {
        const syntheticEvent = {
          ...event,
          stopPropagation: () => { },
        } as unknown as React.MouseEvent;
        onCookieClick?.(detected, index, syntheticEvent);
      }
    }
  };

  const isSelected = (index: number): boolean => {
    if (cookieNumbers && cookieNumbers[index] !== undefined && selectedCookieNumber !== undefined) {
      return cookieNumbers[index] === selectedCookieNumber;
    }
    return false;
  };

  return (
    <div
      className={cn(
        'relative w-full h-full flex items-center justify-center overflow-hidden',
        isZoomed && 'fixed inset-0 w-screen h-screen bg-black z-[9999]',
        className
      )}
      style={isZoomed ? { zIndex: 9999 } : undefined}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={3}
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: 'reset' }}
        smooth={true}
        disabled={disableZoom}
        onZoom={(ref) => {
          setIsZoomed(ref.state.scale > 1.01);
        }}
        onTransformed={(ref) => {
          setIsZoomed(ref.state.scale > 1.01);
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Image wrapper that sizes to image content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Cookie detection"
              className={cn('block w-full h-full object-contain relative z-[1] pointer-events-none', imageClassName)}
              onLoad={updateImageDimensions}
              style={{
                // Critical: width/height 100% with object-fit: contain ensures image fits within container
                // while maintaining aspect ratio. The image will be letterboxed if aspect ratios differ.
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />

            {/* Overlay container - matches the actual rendered image area (accounting for object-fit: contain letterboxing) */}
            {renderedImageBounds && (
              <div
                className="absolute top-0 left-0 pointer-events-none z-10"
                data-testid="overlay-container"
                style={{
                  position: 'absolute',
                  top: renderedImageBounds.offsetY,
                  left: renderedImageBounds.offsetX,
                  width: renderedImageBounds.width,
                  height: renderedImageBounds.height,
                  pointerEvents: 'none',
                }}
              >
                {detectedCookies.map((detected, index) => {
                  const bounds = calculateCookieBounds(detected);
                  const polygon = detected.polygon;
                  const hasPolygon = polygon && polygon.length >= 3;
                  const selected = isSelected(index);
                  const cookieNumber = cookieNumbers?.[index];
                  const hasNumber = cookieNumber !== undefined;

                  const cookieKey = `cookie-${Math.round(detected.x * 100)}-${Math.round(detected.y * 100)}-${index}`;

                  const isHovered = hoveredIndex === index;
                  const isSelectedByIndex = selectedIndex === index;

                  const effectiveBorderColor = isSelectedByIndex
                    ? 'rgba(255, 255, 255, 0.8)'
                    : borderColor;
                  const effectiveStrokeWidth = isSelectedByIndex ? '2' : '0.5';
                  const effectiveFill =
                    isHovered || isSelectedByIndex
                      ? 'rgba(33, 150, 243, 0.3)'
                      : 'rgba(33, 150, 243, 0)';

                  return (
                    <React.Fragment key={cookieKey}>
                      {/* SVG Overlay for Polygon */}
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
                            fill={effectiveFill}
                            stroke={effectiveBorderColor}
                            strokeWidth={effectiveStrokeWidth}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            style={{
                              cursor:
                                (hasNumber && onSelectCookie) || (!hasNumber && onCookieClick)
                                  ? 'pointer'
                                  : 'default',
                              pointerEvents: 'all',
                              transition: 'fill 0.2s ease',
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={(e) => handleCookieClick(detected, index, e)}
                            onDoubleClick={(e) => e.stopPropagation()}
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
                        /* Fallback Rect */
                        <div
                          className="absolute border-[0.5px] bg-[rgba(33,150,243,0)] box-border rounded z-[5] transition-colors"
                          style={{
                            left: `${detected.x - detected.width / 2}%`,
                            top: `${detected.y - detected.height / 2}%`,
                            width: `${detected.width}%`,
                            height: `${detected.height}%`,
                            backgroundColor: effectiveFill,
                            borderColor: effectiveBorderColor,
                            borderWidth: isSelectedByIndex ? '2px' : '0.5px',
                            cursor:
                              (hasNumber && onSelectCookie) || (!hasNumber && onCookieClick)
                                ? 'pointer'
                                : 'default',
                            transition: 'background-color 0.2s ease',
                            pointerEvents: 'all',
                            zIndex: 15,
                          }}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onClick={(e) => handleCookieClick(detected, index, e)}
                          onDoubleClick={(e) => e.stopPropagation()}
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

                      {/* Marker Button */}
                      {hasNumber && (
                        <button
                          className={cn(
                            'absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/30 border-2 border-white rounded-full flex items-center justify-center cursor-pointer z-10 transition-all p-0 m-0 hover:bg-[#dc2626] hover:-translate-x-1/2 hover:-translate-y-1/2 hover:scale-120 hover:z-[11] focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,0.5)] md:w-12 md:h-12 md:min-w-12 md:min-h-12',
                            selected && 'bg-[#16a34a] border-[#16a34a] shadow-[0_0_10px_#16a34a]'
                          )}
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
                          onDoubleClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-white font-extrabold text-xl text-shadow-[0_1px_2px_black] md:text-[1.4rem]">{cookieNumber}</span>
                        </button>
                      )}

                      {/* Custom Overlays */}
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
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
