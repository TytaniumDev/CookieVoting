/**
 * Cookie Detection Test Page
 * 
 * Comprehensive browser-based test that automatically loads all test images
 * and validates detection accuracy.
 */

import { useState, useEffect } from 'react';
import { detectCookiesGemini } from '../lib/cookieDetectionGemini';
import styles from './CookieDetectionTest.module.css';

interface TestResult {
  folder: string;
  expected: number;
  imageName: string;
  detected: number;
  duration: number;
  passed: boolean;
  imageUrl: string;
  detectedCookies: Array<{x: number, y: number, width: number, height: number, confidence: number}>;
}

export default function CookieDetectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // Test images organized by expected cookie count
  const testImages = [
    { folder: '3-cookies', expected: 3, images: ['PXL_20251215_000325176-EDIT.jpg'] },
    { folder: '4-cookies', expected: 4, images: ['PXL_20251215_001528843-EDIT.jpg'] },
    { folder: '5-cookies', expected: 5, images: ['PXL_20251215_000827596-EDIT.jpg', 'PXL_20251215_001018054-EDIT.jpg'] },
    { folder: '6-cookies', expected: 6, images: ['PXL_20251215_000558884-EDIT.jpg', 'PXL_20251215_001159218-EDIT.jpg', 'test-cookies.jpg'] },
    { folder: '8-cookies', expected: 8, images: ['PXL_20251215_000711294-EDIT.jpg'] },
  ];

  const testSingleImage = async (folder: string, imageName: string, expected: number): Promise<TestResult> => {
    const imageUrl = `test-images/${folder}/${imageName}`;
    setCurrentTest(`${folder}/${imageName}`);
    
    // Wait for image to load
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve; // Continue even if image fails
      img.src = imageUrl;
      setTimeout(resolve, 500); // Max wait
    });

    const startTime = performance.now();
    const detected = await detectCookiesGemini(imageUrl);
    const duration = performance.now() - startTime;

    return {
      folder,
      expected,
      imageName,
      detected: detected.length,
      duration,
      passed: detected.length === expected,
      imageUrl,
      detectedCookies: detected,
    };
  };

  const runAllTests = async () => {
    setAutoTesting(true);
    setTesting(true);
    setResults([]);
    const allResults: TestResult[] = [];

    console.log('Starting automated tests...');
    for (const testGroup of testImages) {
      for (const imageName of testGroup.images) {
        try {
          console.log(`Testing ${testGroup.folder}/${imageName} (expected: ${testGroup.expected})`);
          const result = await testSingleImage(testGroup.folder, imageName, testGroup.expected);
          allResults.push(result);
          setResults([...allResults]);
          console.log(`Result: ${result.detected}/${result.expected} cookies, ${result.passed ? 'PASS' : 'FAIL'}`);
          
          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error testing ${imageName}:`, error);
          allResults.push({
            folder: testGroup.folder,
            expected: testGroup.expected,
            imageName,
            detected: 0,
            duration: 0,
            passed: false,
            imageUrl: `/test-images/${testGroup.folder}/${imageName}`,
            detectedCookies: [],
          });
          setResults([...allResults]);
        }
      }
    }

    console.log('All tests complete!');
    setTesting(false);
    setAutoTesting(false);
    setCurrentTest(null);
  };


  // Auto-run tests on mount
  useEffect(() => {
    // Wait a bit for page to fully load, then auto-run tests
    const timer = setTimeout(() => {
      console.log('Auto-running tests...');
      runAllTests();
    }, 2000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const passedCount = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const allPassed = totalTests > 0 && passedCount === totalTests;
  const avgDuration = totalTests > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / totalTests : 0;

  return (
    <div className={styles.container}>
      <h1>🍪 Cookie Detection Test</h1>
      <p className={styles.subtitle}>
        Test cookie detection accuracy. Run all tests automatically or test individual images.
      </p>

      <div className={styles.testSection}>
        <h2>Automated Testing</h2>
        <div className={styles.controls}>
          <button
            onClick={runAllTests}
            disabled={testing}
            className={styles.primaryButton}
          >
            {testing ? `Testing... ${currentTest || ''}` : 'Run All Tests'}
          </button>
        </div>

        {results.length > 0 && (
          <div className={styles.imageGrid}>
            <h2>Test Images with Detections</h2>
            <div className={styles.scrollableGrid}>
              {results.map((result) => (
                <div key={`result-${result.folder}-${result.imageName}-${result.imageUrl.slice(-30)}`} className={styles.imageCard}>
                  <div className={styles.imageCardHeader}>
                    <span className={styles.resultIcon}>{result.passed ? '✅' : '❌'}</span>
                    <span className={styles.imageCardTitle}>
                      <strong>{result.folder}/{result.imageName}</strong>
                    </span>
                    <span className={styles.imageCardCount}>
                      {result.detected}/{result.expected}
                    </span>
                  </div>
                  <div className={styles.imageContainer}>
                    <img src={result.imageUrl} alt={`${result.folder}/${result.imageName}`} />
                    {result.detectedCookies.map((cookie, index) => (
                      <div key={`cookie-${result.folder}-${result.imageName}-${cookie.x.toFixed(2)}-${cookie.y.toFixed(2)}-${cookie.width.toFixed(2)}-${cookie.height.toFixed(2)}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {/* Bounding box outline */}
                        <div
                          className={styles.boundingBox}
                          style={{
                            left: `${cookie.x - cookie.width / 2}%`,
                            top: `${cookie.y - cookie.height / 2}%`,
                            width: `${cookie.width}%`,
                            height: `${cookie.height}%`,
                          }}
                          title={`Cookie ${index + 1}: ${(cookie.confidence * 100).toFixed(1)}% confidence`}
                        />
                        {/* Center marker with number */}
                        <div
                          className={styles.marker}
                          style={{
                            left: `${cookie.x}%`,
                            top: `${cookie.y}%`,
                          }}
                          title={`Cookie ${index + 1}: ${(cookie.confidence * 100).toFixed(1)}% confidence`}
                        >
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.imageCardFooter}>
                    <span className={styles.imageCardDuration}>{result.duration.toFixed(0)}ms</span>
                    {!result.passed && (
                      <span className={styles.imageCardError}>
                        Off by {Math.abs(result.detected - result.expected)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.results}>
            <h3>Test Results</h3>
            <div className={styles.summary}>
              <div className={`${styles.summaryItem} ${allPassed ? styles.success : styles.error}`}>
                <strong>Status:</strong> {allPassed ? '✅ All Tests Passed' : `❌ ${passedCount}/${totalTests} Passed`}
              </div>
              <div className={styles.summaryItem}>
                <strong>Total Tests:</strong> {totalTests}
              </div>
              <div className={styles.summaryItem}>
                <strong>Average Duration:</strong> {avgDuration.toFixed(2)}ms
              </div>
            </div>

            <div className={styles.resultList}>
              {results.map((result) => (
                <div key={`result-row-${result.folder}-${result.imageName}-${result.imageUrl.slice(-30)}`} className={`${styles.resultRow} ${result.passed ? styles.passed : styles.failed}`}>
                  <div className={styles.resultHeader}>
                    <span className={styles.resultIcon}>{result.passed ? '✅' : '❌'}</span>
                    <span className={styles.resultName}><strong>{result.folder}/{result.imageName}</strong></span>
                    <span className={styles.resultCount}>Expected: {result.expected}, Detected: {result.detected}</span>
                    <span className={styles.resultDuration}>{result.duration.toFixed(2)}ms</span>
                  </div>
                  {!result.passed && (
                    <div className={styles.resultDetails}>
                      Off by {Math.abs(result.detected - result.expected)} cookies
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.instructions}>
          <h3>Testing Instructions</h3>
          <ol>
            <li>Click &quot;Run All Tests&quot; to automatically test all images</li>
            <li>Or upload individual images and click &quot;Detect Cookies&quot;</li>
            <li>Verify the detected count matches the folder name (e.g., 6-cookies should detect 6 cookies)</li>
            <li>Continue tuning the algorithm until all tests pass</li>
          </ol>
          <p><strong>Test Images Available:</strong></p>
          <ul>
            {testImages.map((group) => (
              <li key={`test-group-${group.folder}-${group.expected}-${group.images.length}`}>
                <strong>{group.folder}</strong>: {group.images.length} image(s) - Expected {group.expected} cookies each
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
