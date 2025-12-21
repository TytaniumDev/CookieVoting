require('dotenv').config({
  path: '.env.test',
});

// Mock import.meta for Vite environment variables in tests
// This allows testAuth.ts and other files to use import.meta.env
global.importMeta = {
  env: {
    DEV: true,
    MODE: 'development',
    ...process.env,
  },
};

// Mock browser APIs for tests
// These are needed for any code that uses Image, Canvas, etc.

// Mock Image constructor
global.Image = class MockImage {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.src = '';
    this.crossOrigin = null;
    this.onload = null;
    this.onerror = null;
  }

  // Simulate image loading with a data URL
  set src(value) {
    this._src = value;
    // If it's a data URL, simulate successful load
    if (value && value.startsWith('data:')) {
      // Set default dimensions for test image
      this.width = 800;
      this.height = 600;
      // Trigger onload asynchronously
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  }

  get src() {
    return this._src || '';
  }
};

// Mock document
global.document = {
  createElement: (tagName) => {
    if (tagName === 'canvas') {
      // Create a mock canvas
      const canvas = {
        width: 0,
        height: 0,
        getContext: (contextType) => {
          if (contextType === '2d') {
            // Create mock 2D context
            const imageData = {
              data: new Uint8ClampedArray(4), // RGBA for 1 pixel
              width: 1,
              height: 1,
            };

            return {
              drawImage: (img, dx, dy, dWidth, dHeight) => {
                // Update canvas dimensions based on image
                if (img && img.width && img.height) {
                  canvas.width = dWidth || img.width;
                  canvas.height = dHeight || img.height;
                  // Create image data array for the full canvas
                  const size = canvas.width * canvas.height * 4;
                  imageData.data = new Uint8ClampedArray(size);
                  imageData.width = canvas.width;
                  imageData.height = canvas.height;
                }
              },
              getImageData: (sx, sy, sw, sh) => {
                // Return image data for the requested region
                const regionSize = sw * sh * 4;
                const regionData = new Uint8ClampedArray(regionSize);
                
                // Fill with some test data (gray pixels)
                for (let i = 0; i < regionSize; i += 4) {
                  regionData[i] = 128;     // R
                  regionData[i + 1] = 128; // G
                  regionData[i + 2] = 128; // B
                  regionData[i + 3] = 255; // A
                }
                
                return {
                  data: regionData,
                  width: sw,
                  height: sh,
                };
              },
            };
          }
          return null;
        },
      };
      return canvas;
    }
    return {};
  },
};

// Mock performance API
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}