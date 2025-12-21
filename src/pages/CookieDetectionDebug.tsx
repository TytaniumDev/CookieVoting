/**
 * Cookie Detection Debug Page
 * 
 * Interactive debugging tool to visualize what the detection algorithm sees.
 * Helps tune parameters and understand why detection fails.
 */

import { useState, useRef } from 'react';
import { detectCookiesGemini } from '../lib/cookieDetectionGemini';
import styles from './CookieDetectionDebug.module.css';

export default function CookieDetectionDebug() {
  const [detecting, setDetecting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [detectedCookies, setDetectedCookies] = useState<Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    polygon?: Array<[number, number]>;
  }>>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setCurrentImageUrl(url);
      setDetectedCookies([]);
      setDebugInfo('');
    };
    reader.readAsDataURL(file);
  };

  const visualizeDetection = async () => {
    if (!currentImageUrl || !canvasRef.current) return;

    setDetecting(true);
    setDebugInfo('Running detection...\n');

    try {
      const startTime = performance.now();
      const detected = await detectCookiesGemini(currentImageUrl);
      const endTime = performance.now();
      const duration = endTime - startTime;

      setDetectedCookies(detected);
      setDebugInfo(`Detection completed in ${duration.toFixed(2)}ms\nDetected ${detected.length} potential cookies\n\n`);

      // Draw visualization on canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && currentImageUrl) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Draw detected cookies
          detected.forEach((cookie, i) => {
            const x = (cookie.x / 100) * canvas.width;
            const y = (cookie.y / 100) * canvas.height;
            const w = (cookie.width / 100) * canvas.width;
            const h = (cookie.height / 100) * canvas.height;
            
            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - w/2, y - h/2, w, h);
            
            // Draw center point
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw number
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(`${i + 1}`, x + w/2 - 10, y - h/2 + 20);
          });
        };
        img.src = currentImageUrl;
      }
    } catch (error) {
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>🔍 Cookie Detection Debug Tool</h1>
      <p>Upload an image to see what the detection algorithm finds</p>

      <div className={styles.controls}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <button onClick={visualizeDetection} disabled={!currentImageUrl || detecting}>
          {detecting ? 'Detecting...' : 'Run Detection'}
        </button>
      </div>

      {currentImageUrl && (
        <div className={styles.visualization}>
          <div className={styles.imageContainer}>
            <img src={currentImageUrl} alt="Test" />
            <canvas ref={canvasRef} className={styles.overlay} />
          </div>
          <div className={styles.info}>
            <h3>Detection Results</h3>
            <pre>{debugInfo}</pre>
            {detectedCookies.length > 0 && (
              <div>
                <h4>Detected Cookies ({detectedCookies.length})</h4>
                {detectedCookies.map((cookie, i) => (
                  <div key={`cookie-${cookie.x.toFixed(2)}-${cookie.y.toFixed(2)}-${cookie.confidence.toFixed(2)}`} className={styles.cookieInfo}>
                    Cookie {i + 1}: x={cookie.x.toFixed(1)}%, y={cookie.y.toFixed(1)}%, 
                    confidence={cookie.confidence.toFixed(2)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

