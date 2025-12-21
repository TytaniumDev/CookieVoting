# Cookie Detection Testing Guide

This guide explains how to test cookie detection algorithms with your example image.

## Quick Start

### Option 1: Interactive Browser Test (Recommended)

1. **Place your test image** in the `public/` folder:
   ```
   public/test-cookies.jpg
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Navigate to the test page**:
   ```
   http://localhost:5173/test-cookies.html
   ```

4. **Upload your image** and click "Detect Cookies"

The test page will show:
- ✅ Number of cookies detected (should be 6)
- ⏱️ Performance timing (target: <1000ms for mobile)
- 📍 Visual markers on detected cookies
- 📊 Detailed results for each cookie

### Option 2: Automated Jest Test

1. **Update the test file** (`tests/cookie-detection.test.ts`):
   ```typescript
   const TEST_IMAGE_URL = '/test-cookies.jpg'; // Or use a data URL
   ```

2. **Run the test**:
   ```bash
   npm test -- cookie-detection.test.ts
   ```

## Test Image Requirements

- **Expected cookies**: 6 cookies
- **Format**: JPG, PNG, or any web-compatible image format
- **Size**: Any size (algorithm will scale as needed)

## Performance Targets

- **Mobile**: < 1000ms (1 second)
- **Desktop**: < 500ms (ideal)
- **Maximum**: < 2000ms (2 seconds)

## Current Implementation Issues

The current blob detection method is **too slow** for mobile devices because:
- Complex edge detection (Sobel operator)
- Gaussian blur operations
- Flood fill algorithm for blob detection
- Multiple passes over image data

## Alternative Solutions to Test

### 1. TensorFlow.js with COCO-SSD
- **Pros**: Fast, accurate, works client-side
- **Cons**: ~2-3MB model download
- **Setup**: `npm install @tensorflow/tfjs @tensorflow-models/coco-ssd`

### 2. Simplified Blob Detection
- **Pros**: Very fast, lightweight
- **Cons**: Less accurate, may miss some cookies
- **Approach**: Use simpler edge detection, skip blur

### 3. Canvas-based Contour Detection
- **Pros**: Fast, no external dependencies
- **Cons**: May need tuning for different cookie shapes
- **Approach**: Use canvas `getImageData` with simpler algorithms

### 4. Firebase ML Kit (if budget allows)
- **Pros**: Very accurate with custom model
- **Cons**: Requires Blaze plan, training costs
- **Approach**: Train custom cookie detection model

## Testing Different Solutions

1. **Create a new detection function** in `src/lib/`:
   ```typescript
   // src/lib/cookieDetectionV2.ts (e.g., TensorFlow.js version)
   export async function detectCookiesV2(imageUrl: string): Promise<DetectedCookie[]> {
     // Your new implementation
   }
   ```

2. **Update the test page** to test multiple methods:
   ```javascript
   // In test-cookies.html, add buttons for different methods
   <button onclick="testMethod1()">Method 1: Blob Detection</button>
   <button onclick="testMethod2()">Method 2: TensorFlow.js</button>
   ```

3. **Compare results**:
   - Accuracy (should detect 6 cookies)
   - Performance (should be < 1000ms)
   - Visual quality (markers should align with cookies)

## Example Test Results

### Current Blob Detection (Too Slow)
```
Cookies Detected: 6 / 6 expected ✅
Performance: 3500ms ❌ Very Slow
Accuracy: ✅ Perfect
Status: Too slow for mobile devices
```

### Target Results (Fast Method)
```
Cookies Detected: 6 / 6 expected ✅
Performance: 450ms ✅ Fast
Accuracy: ✅ Perfect
Status: Excellent! Fast enough for mobile devices
```

## Next Steps

1. **Test current implementation** with your image to establish baseline
2. **Try TensorFlow.js** - most likely to work well
3. **Compare performance** using the test page
4. **Choose best solution** based on accuracy and speed

## Notes

- The test page works best in Chrome/Edge (better Canvas performance)
- Mobile testing: Use Chrome DevTools device emulation
- For production, consider lazy-loading the detection model
- Cache detection results if same image is processed multiple times

