/**
 * Detection Comparison Page
 *
 * Compares Gemini Vision and Google Cloud Vision API detection results
 * to evaluate which approach works better for cookie detection.
 */

import { useState } from 'react';
import { compareDetectionMethods, type ComparisonResults } from '../lib/cookieDetectionVision';
import type { DetectedCookie } from '../lib/cookieDetectionGemini';
import styles from './DetectionComparison.module.css';

interface TestImage {
  folder: string;
  name: string;
  expected: number;
  url: string;
}

// Test images with known cookie counts
const testImages: TestImage[] = [
  { folder: '3-cookies', name: 'PXL_20251215_000325176-EDIT.jpg', expected: 3, url: 'test-images/3-cookies/PXL_20251215_000325176-EDIT.jpg' },
  { folder: '4-cookies', name: 'PXL_20251215_001528843-EDIT.jpg', expected: 4, url: 'test-images/4-cookies/PXL_20251215_001528843-EDIT.jpg' },
  { folder: '5-cookies', name: 'PXL_20251215_000827596-EDIT.jpg', expected: 5, url: 'test-images/5-cookies/PXL_20251215_000827596-EDIT.jpg' },
  { folder: '5-cookies', name: 'PXL_20251215_001018054-EDIT.jpg', expected: 5, url: 'test-images/5-cookies/PXL_20251215_001018054-EDIT.jpg' },
  { folder: '6-cookies', name: 'PXL_20251215_000558884-EDIT.jpg', expected: 6, url: 'test-images/6-cookies/PXL_20251215_000558884-EDIT.jpg' },
  { folder: '6-cookies', name: 'PXL_20251215_001159218-EDIT.jpg', expected: 6, url: 'test-images/6-cookies/PXL_20251215_001159218-EDIT.jpg' },
  { folder: '6-cookies', name: 'test-cookies.jpg', expected: 6, url: 'test-images/6-cookies/test-cookies.jpg' },
  { folder: '8-cookies', name: 'PXL_20251215_000711294-EDIT.jpg', expected: 8, url: 'test-images/8-cookies/PXL_20251215_000711294-EDIT.jpg' },
];

interface ComparisonResult extends ComparisonResults {
  testImage: TestImage;
  geminiAccurate: boolean;
  visionAccurate: boolean;
}

function CookieOverlay({ 
  cookies, 
  color,
  showPolygon = false,
}: { 
  cookies: DetectedCookie[]; 
  color: string;
  showPolygon?: boolean;
}) {
  return (
    <>
      {cookies.map((cookie, index) => (
        <div
          key={`${color}-${cookie.x.toFixed(2)}-${cookie.y.toFixed(2)}-${cookie.width.toFixed(2)}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Bounding box */}
          <div
            className={styles.boundingBox}
            style={{
              left: `${cookie.x - cookie.width / 2}%`,
              top: `${cookie.y - cookie.height / 2}%`,
              width: `${cookie.width}%`,
              height: `${cookie.height}%`,
              borderColor: color,
              backgroundColor: `${color}20`,
            }}
          />
          {/* Polygon (if available and enabled) */}
          {showPolygon && cookie.polygon && cookie.polygon.length >= 3 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points={cookie.polygon.map(([x, y]) => `${x},${y}`).join(' ')}
                fill={`${color}15`}
                stroke={color}
                strokeWidth="0.5"
              />
            </svg>
          )}
          {/* Center marker */}
          <div
            className={styles.marker}
            style={{
              left: `${cookie.x}%`,
              top: `${cookie.y}%`,
              backgroundColor: color,
            }}
          >
            {index + 1}
          </div>
        </div>
      ))}
    </>
  );
}

export default function DetectionComparison() {
  const [testing, setTesting] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);
  const [showPolygons, setShowPolygons] = useState(true);
  const [showGemini, setShowGemini] = useState(true);
  const [showVision, setShowVision] = useState(true);

  const runComparison = async () => {
    setTesting(true);
    setResults([]);
    const allResults: ComparisonResult[] = [];

    for (const testImage of testImages) {
      setCurrentImage(`${testImage.folder}/${testImage.name}`);
      
      try {
        console.log(`[Comparison] Testing ${testImage.folder}/${testImage.name}`);
        // Convert relative URL to absolute URL for the Cloud Function
        // Node.js fetch requires absolute URLs since it has no origin context
        const absoluteUrl = testImage.url.startsWith('http')
          ? testImage.url
          : `${window.location.origin}/${testImage.url}`;
        const comparison = await compareDetectionMethods(absoluteUrl);
        
        const result: ComparisonResult = {
          ...comparison,
          testImage,
          geminiAccurate: comparison.results.gemini.count === testImage.expected,
          visionAccurate: comparison.results.vision.count === testImage.expected,
        };
        
        allResults.push(result);
        setResults([...allResults]);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error testing ${testImage.name}:`, error);
        // Create a failed result
        allResults.push({
          imageUrl: testImage.url,
          testImage,
          results: {
            gemini: { cookies: [], count: 0, duration: 0, error: String(error) },
            vision: { cookies: [], count: 0, duration: 0, objects: [], labels: [], error: String(error) },
          },
          summary: { geminiCount: 0, visionCount: 0, geminiDuration: 0, visionDuration: 0 },
          geminiAccurate: false,
          visionAccurate: false,
        });
        setResults([...allResults]);
      }
    }

    setTesting(false);
    setCurrentImage(null);
  };

  const geminiAccuracy = results.length > 0
    ? (results.filter(r => r.geminiAccurate).length / results.length * 100).toFixed(1)
    : '0';
  const visionAccuracy = results.length > 0
    ? (results.filter(r => r.visionAccurate).length / results.length * 100).toFixed(1)
    : '0';
  const avgGeminiDuration = results.length > 0
    ? (results.reduce((sum, r) => sum + r.summary.geminiDuration, 0) / results.length).toFixed(0)
    : '0';
  const avgVisionDuration = results.length > 0
    ? (results.reduce((sum, r) => sum + r.summary.visionDuration, 0) / results.length).toFixed(0)
    : '0';

  return (
    <div className={styles.container}>
      <h1>🔬 Detection Method Comparison</h1>
      <p className={styles.subtitle}>
        Compare Gemini Vision AI vs. Google Cloud Vision API for cookie detection accuracy
      </p>

      <div className={styles.controlsSection}>
        <div className={styles.controls}>
          <button 
            onClick={runComparison} 
            disabled={testing}
            className={styles.primaryButton}
          >
            {testing ? `Testing... ${currentImage || ''}` : 'Run Comparison on All Test Images'}
          </button>
        </div>

        {results.length > 0 && (
          <div className={styles.toggles}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={showGemini}
                onChange={(e) => setShowGemini(e.target.checked)}
              />
              <span className={styles.geminiLabel}>Show Gemini</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={showVision}
                onChange={(e) => setShowVision(e.target.checked)}
              />
              <span className={styles.visionLabel}>Show Vision API</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={showPolygons}
                onChange={(e) => setShowPolygons(e.target.checked)}
              />
              <span>Show Polygons</span>
            </label>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {results.length > 0 && (
        <div className={styles.summarySection}>
          <h2>Summary</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>
                <span className={styles.geminiDot} />
                Gemini Vision AI
              </div>
              <div className={styles.summaryStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Accuracy</span>
                  <span className={`${styles.statValue} ${Number(geminiAccuracy) >= 80 ? styles.good : Number(geminiAccuracy) >= 50 ? styles.medium : styles.poor}`}>
                    {geminiAccuracy}%
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg Duration</span>
                  <span className={styles.statValue}>{avgGeminiDuration}ms</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Correct</span>
                  <span className={styles.statValue}>
                    {results.filter(r => r.geminiAccurate).length}/{results.length}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>
                <span className={styles.visionDot} />
                Cloud Vision API
              </div>
              <div className={styles.summaryStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Accuracy</span>
                  <span className={`${styles.statValue} ${Number(visionAccuracy) >= 80 ? styles.good : Number(visionAccuracy) >= 50 ? styles.medium : styles.poor}`}>
                    {visionAccuracy}%
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Avg Duration</span>
                  <span className={styles.statValue}>{avgVisionDuration}ms</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Correct</span>
                  <span className={styles.statValue}>
                    {results.filter(r => r.visionAccurate).length}/{results.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className={styles.resultsSection}>
          <h2>Detailed Results</h2>
          <div className={styles.resultsGrid}>
            {results.map((result) => (
              <div 
                key={`result-${result.testImage.folder}-${result.testImage.name}`}
                className={styles.resultCard}
                onClick={() => setSelectedResult(selectedResult === result ? null : result)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedResult(selectedResult === result ? null : result);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.resultHeader}>
                  <span className={styles.imageName}>
                    {result.testImage.folder}/{result.testImage.name}
                  </span>
                  <span className={styles.expected}>
                    Expected: {result.testImage.expected}
                  </span>
                </div>

                <div className={styles.imageContainer}>
                  <img src={result.testImage.url} alt={result.testImage.name} />
                  {showGemini && (
                    <CookieOverlay 
                      cookies={result.results.gemini.cookies} 
                      color="#4ade80"
                      showPolygon={showPolygons}
                    />
                  )}
                  {showVision && (
                    <CookieOverlay 
                      cookies={result.results.vision.cookies} 
                      color="#f472b6"
                      showPolygon={showPolygons}
                    />
                  )}
                </div>

                <div className={styles.resultStats}>
                  <div className={`${styles.methodResult} ${result.geminiAccurate ? styles.correct : styles.incorrect}`}>
                    <span className={styles.geminiDot} />
                    <span className={styles.methodName}>Gemini:</span>
                    <span className={styles.count}>{result.results.gemini.count}</span>
                    <span className={styles.duration}>{result.results.gemini.duration}ms</span>
                    <span className={styles.status}>
                      {result.geminiAccurate ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className={`${styles.methodResult} ${result.visionAccurate ? styles.correct : styles.incorrect}`}>
                    <span className={styles.visionDot} />
                    <span className={styles.methodName}>Vision:</span>
                    <span className={styles.count}>{result.results.vision.count}</span>
                    <span className={styles.duration}>{result.results.vision.duration}ms</span>
                    <span className={styles.status}>
                      {result.visionAccurate ? '✅' : '❌'}
                    </span>
                  </div>
                </div>

                {/* Expandable details */}
                {selectedResult === result && (
                  <div className={styles.expandedDetails}>
                    <div className={styles.detailSection}>
                      <h4>Vision API Labels:</h4>
                      <div className={styles.labelsList}>
                        {result.results.vision.labels.slice(0, 8).map((label) => (
                          <span key={`label-${label.description}`} className={styles.label}>
                            {label.description} ({(label.score * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.detailSection}>
                      <h4>Vision API Objects:</h4>
                      <div className={styles.labelsList}>
                        {result.results.vision.objects.map((obj) => (
                          <span key={`obj-${obj.name}-${obj.score}`} className={styles.label}>
                            {obj.name} ({(obj.score * 100).toFixed(0)}%)
                          </span>
                        ))}
                        {result.results.vision.objects.length === 0 && (
                          <span className={styles.noData}>No objects detected</span>
                        )}
                      </div>
                    </div>
                    {result.results.gemini.error && (
                      <div className={styles.error}>Gemini Error: {result.results.gemini.error}</div>
                    )}
                    {result.results.vision.error && (
                      <div className={styles.error}>Vision Error: {result.results.vision.error}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Section */}
      {results.length > 0 && (
        <div className={styles.analysisSection}>
          <h2>Analysis</h2>
          <div className={styles.analysisContent}>
            <h3>Key Findings:</h3>
            <ul>
              <li>
                <strong>Gemini Vision AI</strong> uses prompt-based detection with detailed instructions 
                about Christmas cookie shapes, decorations, and polygon boundaries.
              </li>
              <li>
                <strong>Cloud Vision API</strong> uses pre-trained object detection models that identify 
                general objects like &quot;Food&quot;, &quot;Baked goods&quot;, &quot;Snack&quot;, etc.
              </li>
              <li>
                The Vision API&apos;s pre-trained models may not specifically detect &quot;cookies&quot; as 
                individual objects, which is why it may show fewer detections.
              </li>
              <li>
                Gemini can be prompted to understand context (Christmas cookies, unusual shapes) while 
                the Vision API relies on its training data.
              </li>
            </ul>
            
            <h3>Recommendation:</h3>
            <p>
              Based on the comparison results, you can evaluate which approach better suits your needs:
            </p>
            <ul>
              <li>If accuracy on cookie-specific detection is critical, the prompted Gemini approach may be better.</li>
              <li>If speed and consistency are priorities, the Vision API may be preferred (if it detects cookies reliably).</li>
              <li>Consider the cost implications - Vision API pricing vs. Gemini API pricing for your usage patterns.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Instructions */}
      {results.length === 0 && !testing && (
        <div className={styles.instructions}>
          <h2>About This Comparison</h2>
          <p>
            This page compares two different approaches for detecting cookies in images:
          </p>
          <ol>
            <li>
              <strong>Gemini Vision AI (Current):</strong> Uses Google&apos;s Gemini model with a detailed 
              prompt that explains what Christmas cookies look like, including unusual shapes and decorations.
            </li>
            <li>
              <strong>Cloud Vision API:</strong> Uses Google Cloud&apos;s pre-trained object detection 
              models which can identify objects in images but may not be cookie-specific.
            </li>
          </ol>
          <p>
            Click &quot;Run Comparison&quot; to test both methods on all test images and see which 
            provides more accurate cookie detection.
          </p>
        </div>
      )}
    </div>
  );
}
