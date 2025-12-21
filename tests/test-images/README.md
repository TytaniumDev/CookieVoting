# Cookie Detection Test Images

This folder contains test images organized by the number of cookies they contain.

## Folder Structure

```
test-images/
├── 3-cookies/    # Images with exactly 3 cookies
├── 4-cookies/    # Images with exactly 4 cookies
├── 5-cookies/    # Images with exactly 5 cookies
├── 6-cookies/    # Images with exactly 6 cookies
├── 7-cookies/    # Images with exactly 7 cookies
└── 8-cookies/    # Images with exactly 8 cookies
```

## Adding Test Images

1. **Take or select a photo** of cookies arranged on a surface
2. **Count the cookies** in the image
3. **Place the image** in the corresponding folder:
   - If the image has 3 cookies → `3-cookies/`
   - If the image has 4 cookies → `4-cookies/`
   - etc.

4. **Name your image** descriptively (e.g., `sugar-cookies-arranged.jpg`)

## Supported Formats

- JPG/JPEG
- PNG
- Any web-compatible image format

## Running Tests

The automated test suite will:
- Scan each folder
- Run detection on all images
- Verify that each image detects the correct number of cookies
- Report accuracy and performance metrics

Run tests:
```bash
npm test -- cookie-detection-accuracy.test.ts
```

## Test Results

The test will show:
- ✅ Images where detection was correct
- ❌ Images where detection was incorrect (with count difference)
- ⏱️ Performance metrics for each image
- 📊 Overall accuracy statistics

## Tips for Good Test Images

- **Good lighting** - Even, bright lighting helps detection
- **Clear separation** - Cookies should be well-separated from each other
- **Good contrast** - Cookies should contrast with the background
- **Various arrangements** - Include different layouts (rows, circles, scattered)
- **Different cookie types** - Test with various cookie shapes and decorations

