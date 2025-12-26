import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder (needed for some libraries)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock browser APIs for tests running in Node/jsdom environment
// These are needed for any code that uses Image, Canvas, etc.

// Mock Image constructor
class MockImage {
    width = 0;
    height = 0;
    private _src = '';
    crossOrigin: string | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(value: string) {
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
        return this._src;
    }
}

global.Image = MockImage as unknown as typeof Image;

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = ((tagName: string) => {
    if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas');
        const imageData = {
            data: new Uint8ClampedArray(4),
            width: 1,
            height: 1,
        };

        canvas.getContext = ((contextType: string) => {
            if (contextType === '2d') {
                return {
                    drawImage: (
                        img: { width?: number; height?: number },
                        _dx: number,
                        _dy: number,
                        dWidth?: number,
                        dHeight?: number
                    ) => {
                        if (img && img.width && img.height) {
                            canvas.width = dWidth || img.width;
                            canvas.height = dHeight || img.height;
                            const size = canvas.width * canvas.height * 4;
                            imageData.data = new Uint8ClampedArray(size);
                            imageData.width = canvas.width;
                            imageData.height = canvas.height;
                        }
                    },
                    getImageData: (_sx: number, _sy: number, sw: number, sh: number) => {
                        const regionSize = sw * sh * 4;
                        const regionData = new Uint8ClampedArray(regionSize);

                        // Fill with some test data (gray pixels)
                        for (let i = 0; i < regionSize; i += 4) {
                            regionData[i] = 128; // R
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
        }) as typeof canvas.getContext;

        return canvas;
    }
    return originalCreateElement(tagName);
}) as typeof document.createElement;

// Mock performance API (if not available)
if (typeof global.performance === 'undefined') {
    global.performance = {
        now: () => Date.now(),
    } as Performance;
}
