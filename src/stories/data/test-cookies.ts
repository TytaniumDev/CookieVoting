import type { Category } from '../../lib/types';
import type { DetectedCookie } from '../../lib/types';

import detections3Raw from './detections/detections3.json';
import detections4Raw from './detections/detections4.json';
import detections5Raw from './detections/detections5.json';
import detections8Raw from './detections/detections8.json';

const detections3 = detections3Raw as DetectedCookie[];
const detections4 = detections4Raw as DetectedCookie[];
const detections5 = detections5Raw as DetectedCookie[];
const detections8 = detections8Raw as DetectedCookie[];

export const testCookieImages = {
  cookies3: 'test-images/3-cookies/PXL_20251215_000325176-EDIT.jpg',
  cookies4: 'test-images/4-cookies/PXL_20251215_001528843-EDIT.jpg',
  cookies5: 'test-images/5-cookies/PXL_20251215_000827596-EDIT.jpg',
  cookies8: 'test-images/8-cookies/PXL_20251215_000711294-EDIT.jpg',
};

// Helper to map raw detections to CookieCoordinate
const mapDetectionsToCookies = (
  detections: DetectedCookie[],
  startChar: string,
): Category['cookies'] => {
  return detections.map((detection, index) => {
    const charCode = startChar.charCodeAt(0) + index;
    const makerName = String.fromCharCode(charCode);
    return {
      id: `c_${makerName}`,
      number: index + 1,
      x: detection.x,
      y: detection.y,
      makerName: `Maker ${makerName}`,
      detection: detection,
    };
  });
};

export const testCategories: Category[] = [
  {
    id: '1',
    name: 'Best Taste',
    imageUrl: testCookieImages.cookies3,
    cookies: mapDetectionsToCookies(detections3, 'A'),
  },
  {
    id: '2',
    name: 'Best Look',
    imageUrl: testCookieImages.cookies4,
    cookies: mapDetectionsToCookies(detections4, 'D'),
  },
  {
    id: '3',
    name: 'Most Creative',
    imageUrl: testCookieImages.cookies5,
    cookies: mapDetectionsToCookies(detections5, 'H'),
  },
  {
    id: '4',
    name: 'Holiday Spirit',
    imageUrl: testCookieImages.cookies8,
    cookies: mapDetectionsToCookies(detections8, 'M'),
  },
];
