# Quick Start: Adding Test Images

## Step 1: Count Cookies in Your Image

Look at your image and count how many cookies are visible.

## Step 2: Place Image in Correct Folder

Copy your image file to the folder matching the cookie count:

- **3 cookies** → `3-cookies/` folder
- **4 cookies** → `4-cookies/` folder  
- **5 cookies** → `5-cookies/` folder
- **6 cookies** → `6-cookies/` folder
- **7 cookies** → `7-cookies/` folder
- **8 cookies** → `8-cookies/` folder

## Step 3: Run the Test

```bash
npm test -- cookie-detection-accuracy.test.ts
```

## Example

If you have an image with 6 cookies:
1. Copy it to `tests/test-images/6-cookies/my-image.jpg`
2. Run the test
3. Check the results - it should detect exactly 6 cookies

## What the Test Shows

- ✅ **Correct detections** - Images where the algorithm found the right number
- ❌ **Incorrect detections** - Images where it was wrong (with count difference)
- ⏱️ **Performance** - How fast detection ran (should be < 1000ms)
- 📊 **Accuracy stats** - Overall percentage of correct detections

## Tips

- Name your images descriptively (e.g., `sugar-cookies-arranged.jpg`)
- Test with various lighting conditions
- Include different cookie arrangements
- Test with different cookie types/shapes

