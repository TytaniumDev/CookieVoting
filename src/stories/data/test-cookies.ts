import type { Category } from '../../lib/types';
import type { DetectedCookie } from '../../lib/cookieDetectionGemini';

// Helper to create a placeholder detection
const createPlaceholderDetection = (x: number, y: number): DetectedCookie => ({
    x,
    y,
    width: 10,
    height: 10,
    confidence: 0.95,
    polygon: [
        [x - 5, y - 5],
        [x + 5, y - 5],
        [x + 5, y + 5],
        [x - 5, y + 5]
    ] // Simple box for now
});

export const testCookieImages = {
    cookies3: '/test-images/3-cookies/PXL_20251215_000325176-EDIT.jpg',
    cookies4: '/test-images/4-cookies/PXL_20251215_001528843-EDIT.jpg',
    cookies5: '/test-images/5-cookies/PXL_20251215_000827596-EDIT.jpg',
    cookies8: '/test-images/8-cookies/PXL_20251215_000711294-EDIT.jpg',
};

export const testCategories: Category[] = [
    {
        id: '1',
        name: 'Best Taste',
        imageUrl: testCookieImages.cookies3,
        cookies: [
            // PASTE DETECTION JSON HERE
            { id: 'c1', number: 1, x: 20, y: 30, makerName: 'A', detection: createPlaceholderDetection(20, 30) },
            { id: 'c2', number: 2, x: 70, y: 60, makerName: 'B', detection: createPlaceholderDetection(70, 60) },
            { id: 'c3', number: 3, x: 50, y: 50, makerName: 'C', detection: createPlaceholderDetection(50, 50) }
        ]
    },
    {
        id: '2',
        name: 'Best Look',
        imageUrl: testCookieImages.cookies4,
        cookies: [
             // PASTE DETECTION JSON HERE
            { id: 'c4', number: 1, x: 25, y: 25, makerName: 'D', detection: createPlaceholderDetection(25, 25) },
            { id: 'c5', number: 2, x: 75, y: 25, makerName: 'E', detection: createPlaceholderDetection(75, 25) },
            { id: 'c6', number: 3, x: 25, y: 75, makerName: 'F', detection: createPlaceholderDetection(25, 75) },
            { id: 'c7', number: 4, x: 75, y: 75, makerName: 'G', detection: createPlaceholderDetection(75, 75) }
        ]
    },
    {
        id: '3',
        name: 'Most Creative',
        imageUrl: testCookieImages.cookies5,
        cookies: [
             // PASTE DETECTION JSON HERE
            { id: 'c8', number: 1, x: 50, y: 20, makerName: 'H', detection: createPlaceholderDetection(50, 20) },
            { id: 'c9', number: 2, x: 20, y: 50, makerName: 'I', detection: createPlaceholderDetection(20, 50) },
            { id: 'c10', number: 3, x: 80, y: 50, makerName: 'J', detection: createPlaceholderDetection(80, 50) },
            { id: 'c11', number: 4, x: 35, y: 80, makerName: 'K', detection: createPlaceholderDetection(35, 80) },
            { id: 'c12', number: 5, x: 65, y: 80, makerName: 'L', detection: createPlaceholderDetection(65, 80) }
        ]
    },
    {
        id: '4',
        name: 'Holiday Spirit',
        imageUrl: testCookieImages.cookies8,
        cookies: [
             // PASTE DETECTION JSON HERE
            { id: 'c13', number: 1, x: 15, y: 20, makerName: 'M', detection: createPlaceholderDetection(15, 20) },
            { id: 'c14', number: 2, x: 38, y: 20, makerName: 'N', detection: createPlaceholderDetection(38, 20) },
            { id: 'c15', number: 3, x: 62, y: 20, makerName: 'O', detection: createPlaceholderDetection(62, 20) },
            { id: 'c16', number: 4, x: 85, y: 20, makerName: 'P', detection: createPlaceholderDetection(85, 20) },
            { id: 'c17', number: 5, x: 15, y: 80, makerName: 'Q', detection: createPlaceholderDetection(15, 80) },
            { id: 'c18', number: 6, x: 38, y: 80, makerName: 'R', detection: createPlaceholderDetection(38, 80) },
            { id: 'c19', number: 7, x: 85, y: 80, makerName: 'S', detection: createPlaceholderDetection(85, 80) },
            { id: 'c20', number: 8, x: 62, y: 80, makerName: 'T', detection: createPlaceholderDetection(62, 80) }
        ]
    }
];
