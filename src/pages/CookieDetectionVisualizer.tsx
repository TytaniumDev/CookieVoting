import { useState } from 'react';
import { ImageWithDetections, type DetectedCookie } from '../components/ImageWithDetections';
import styles from './CookieDetectionVisualizer.module.css';

export default function CookieDetectionVisualizer() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [detectedCookies, setDetectedCookies] = useState<DetectedCookie[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageFile(null);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  };

  const parseAndRender = () => {
    try {
      setError(null);
      
      // Try to extract JSON from the input (handle cases where it might be wrapped in markdown or text)
      let jsonText = jsonInput.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to find JSON array in the text
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of cookie objects');
      }

      // Convert to DetectedCookie format
      const cookies: DetectedCookie[] = parsed.map((cookie: any, index: number) => {
        // Validate required fields
        if (typeof cookie.x !== 'number' || typeof cookie.y !== 'number') {
          throw new Error(`Cookie ${index} is missing x or y coordinates`);
        }
        if (typeof cookie.width !== 'number' || typeof cookie.height !== 'number') {
          throw new Error(`Cookie ${index} is missing width or height`);
        }
        if (typeof cookie.confidence !== 'number') {
          throw new Error(`Cookie ${index} is missing confidence`);
        }

        return {
          x: cookie.x,
          y: cookie.y,
          width: cookie.width,
          height: cookie.height,
          polygon: cookie.polygon && Array.isArray(cookie.polygon) 
            ? cookie.polygon.map((point: any) => {
                if (Array.isArray(point) && point.length === 2) {
                  return [point[0], point[1]] as [number, number];
                }
                if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                  return [point.x, point.y] as [number, number];
                }
                throw new Error(`Invalid polygon point format in cookie ${index}`);
              })
            : undefined,
          confidence: cookie.confidence,
        };
      });

      setDetectedCookies(cookies);
      console.log(`[CookieDetectionVisualizer] Parsed ${cookies.length} cookies:`, cookies);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse JSON';
      setError(errorMessage);
      console.error('[CookieDetectionVisualizer] Parse error:', err);
      setDetectedCookies([]);
    }
  };

  const handleClear = () => {
    setImageUrl('');
    setImageFile(null);
    setJsonInput('');
    setDetectedCookies([]);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Cookie Detection Visualizer</h1>
        <p className={styles.subtitle}>
          Test Gemini detection results without using Firebase quota. Paste your Gemini JSON response to visualize the detected cookies.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <label htmlFor="image-input">Image (Upload or URL):</label>
            <div className={styles.imageInputs}>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <span className={styles.or}>or</span>
              <input
                type="text"
                placeholder="Paste image URL here..."
                value={imageUrl}
                onChange={handleUrlChange}
                className={styles.urlInput}
              />
            </div>
            {imageUrl && (
              <div className={styles.imagePreview}>
                <img src={imageUrl} alt="Preview" className={styles.previewImage} />
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="json-input">Gemini JSON Response:</label>
            <textarea
              id="json-input"
              value={jsonInput}
              onChange={handleJsonChange}
              placeholder='Paste Gemini JSON response here, e.g.:&#10;[&#10;  {&#10;    "x": 25,&#10;    "y": 30,&#10;    "width": 15,&#10;    "height": 15,&#10;    "polygon": [[20, 25], [30, 25], [30, 35], [20, 35]],&#10;    "confidence": 0.95&#10;  }&#10;]'
              className={styles.jsonInput}
              rows={15}
            />
            <div className={styles.buttonGroup}>
              <button onClick={parseAndRender} className={styles.renderButton} disabled={!imageUrl || !jsonInput}>
                Render Detection
              </button>
              <button onClick={handleClear} className={styles.clearButton}>
                Clear All
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {detectedCookies.length > 0 && (
            <div className={styles.stats}>
              <p>
                <strong>{detectedCookies.length}</strong> cookie{detectedCookies.length !== 1 ? 's' : ''} detected
                {' • '}
                <strong>{detectedCookies.filter(c => c.polygon && c.polygon.length >= 3).length}</strong> with polygons
              </p>
            </div>
          )}
        </div>

        <div className={styles.outputSection}>
          {imageUrl && detectedCookies.length > 0 ? (
            <div className={styles.visualization}>
              <h2>Visualization</h2>
              <div className={styles.imageContainer}>
                <ImageWithDetections
                  imageUrl={imageUrl}
                  detectedCookies={detectedCookies}
                  onCookieClick={(cookie, index) => {
                    console.log(`Cookie ${index} clicked:`, cookie);
                  }}
                />
              </div>
              <div className={styles.cookieDetails}>
                <h3>Cookie Details:</h3>
                <div className={styles.cookieList}>
                  {detectedCookies.map((cookie, index) => (
                    <div key={index} className={styles.cookieItem}>
                      <strong>Cookie {index + 1}:</strong>
                      <ul>
                        <li>Center: ({cookie.x.toFixed(1)}%, {cookie.y.toFixed(1)}%)</li>
                        <li>Bounding box: {cookie.width.toFixed(1)}% × {cookie.height.toFixed(1)}%</li>
                        <li>Bounding box position: 
                          Left: {(cookie.x - cookie.width / 2).toFixed(1)}%, 
                          Top: {(cookie.y - cookie.height / 2).toFixed(1)}%, 
                          Right: {(cookie.x + cookie.width / 2).toFixed(1)}%, 
                          Bottom: {(cookie.y + cookie.height / 2).toFixed(1)}%
                        </li>
                        <li>Confidence: {(cookie.confidence * 100).toFixed(1)}%</li>
                        <li>Polygon points: {cookie.polygon ? cookie.polygon.length : 'None'}</li>
                        {cookie.polygon && cookie.polygon.length > 0 && (
                          <>
                            <li className={styles.polygonPoints}>
                              First 3 points: {cookie.polygon.slice(0, 3).map(p => `[${p[0].toFixed(1)}, ${p[1].toFixed(1)}]`).join(', ')}
                            </li>
                            <li className={styles.polygonPoints}>
                              Polygon bounds: 
                              X: {Math.min(...cookie.polygon.map(p => p[0])).toFixed(1)} - {Math.max(...cookie.polygon.map(p => p[0])).toFixed(1)}, 
                              Y: {Math.min(...cookie.polygon.map(p => p[1])).toFixed(1)} - {Math.max(...cookie.polygon.map(p => p[1])).toFixed(1)}
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : imageUrl ? (
            <div className={styles.placeholder}>
              <p>Enter Gemini JSON response and click "Render Detection" to see the visualization.</p>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <p>Upload an image or enter an image URL to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

