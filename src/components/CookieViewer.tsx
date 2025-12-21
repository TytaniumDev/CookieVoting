import { useState, type MouseEvent } from 'react';
import { type CookieCoordinate, type CookieCoordinatePublic } from '../lib/types';
import styles from './CookieViewer.module.css';

/**
 * Props for the CookieViewer component
 */
interface Props {
  /** URL of the image to display */
  imageUrl: string;
  /** Array of cookie coordinates to display as markers on the image */
  cookies: CookieCoordinate[] | CookieCoordinatePublic[];
  /** ID of the currently selected cookie (as string) */
  selectedCookieId: string | undefined;
  /** Callback function called when a cookie marker is clicked */
  onSelectCookie: (cookieNumber: number) => void;
  /** Callback function called when the back button is clicked */
  onBack: () => void;
}

/**
 * CookieViewer - An interactive image viewer for displaying cookies with numbered markers.
 * 
 * This component provides a zoomable and pannable image viewer with numbered markers
 * for each cookie. Users can zoom in/out, pan when zoomed, and click on cookie markers
 * to select them. The component supports both mouse and touch interactions, including
 * pinch-to-zoom on mobile devices.
 * 
 * Features:
 * - Zoom controls (1x to 4x)
 * - Pan/drag when zoomed
 * - Touch support with pinch-to-zoom
 * - Numbered markers for each cookie
 * - Visual indication of selected cookie
 * 
 * @example
 * ```tsx
 * <CookieViewer
 *   imageUrl="/path/to/image.jpg"
 *   cookies={[
 *     { id: '1', number: 1, x: 25, y: 30 },
 *     { id: '2', number: 2, x: 75, y: 40 }
 *   ]}
 *   selectedCookieId="1"
 *   onSelectCookie={(num) => console.log('Selected cookie', num)}
 *   onBack={() => navigate('/')}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns JSX element containing the interactive image viewer
 */
export function CookieViewer({ imageUrl, cookies, selectedCookieId, onSelectCookie, onBack }: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(1, prev + delta), 4));
  };

  // Pinch-to-zoom support for mobile
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  
  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const handleTouchMovePinch = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      
      if (lastPinchDistance !== null) {
        const delta = (distance - lastPinchDistance) / 100;
        setScale(prev => Math.min(Math.max(1, prev + delta), 4));
      }
      
      setLastPinchDistance(distance);
    } else {
      setLastPinchDistance(null);
      // Handle single touch drag
      if (dragging && e.touches.length === 1) {
        e.preventDefault();
        setPosition({
          x: e.touches[0].clientX - startPos.x,
          y: e.touches[0].clientY - startPos.y
        });
      }
    }
  };
  
  const handleTouchEndPinch = () => {
    setLastPinchDistance(null);
    setDragging(false);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (scale > 1) {
      setDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setDragging(true);
      setStartPos({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    } else if (e.touches.length === 2) {
      setLastPinchDistance(getDistance(e.touches[0], e.touches[1]));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button onClick={onBack} className={styles.backButton}>&larr; Back</button>
        <div className={styles.controls}>
          <button onClick={() => handleZoom(-0.5)}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => handleZoom(0.5)}>+</button>
        </div>
      </div>

      <div 
        className={styles.viewport}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMovePinch}
        onTouchEnd={handleTouchEndPinch}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
      >
        <div 
          className={styles.imageContainer}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: dragging ? 'none' : 'transform 0.2s'
          }}
        >
          <img src={imageUrl} alt="Cookie Category" className={styles.image} />
          {cookies.map(cookie => (
            <button
              key={cookie.id}
              className={`${styles.marker} ${selectedCookieId === String(cookie.number) ? styles.selected : ''}`}
              style={{ left: `${cookie.x}%`, top: `${cookie.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCookie(cookie.number);
              }}
            >
              <span className={styles.markerNumber}>{cookie.number}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.instruction}>
        Tap a number to select it. {scale > 1 ? 'Drag to pan. ' : ''}
        {window.innerWidth <= 768 ? 'Pinch to zoom. ' : 'Use +/- to zoom. '}
      </div>
    </div>
  );
}
