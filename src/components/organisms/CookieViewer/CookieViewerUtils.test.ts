import { describe, it, expect } from 'vitest';
import { calculateCookieBounds, smoothPolygon, type DetectedCookie } from './CookieViewer';

describe('CookieViewer Utils', () => {
  describe('calculateCookieBounds', () => {
    it('calculates bounds for a simple box detection', () => {
      const detection: DetectedCookie = {
        x: 50,
        y: 50,
        width: 20,
        height: 10,
        confidence: 0.9,
      };

      const bounds = calculateCookieBounds(detection);

      expect(bounds).toEqual({
        topLeftX: 40, // 50 - 20/2
        topLeftY: 45, // 50 - 10/2
        bottomY: 55,  // 50 + 10/2
        centerX: 50,
        centerY: 50,
      });
    });

    it('calculates bounds for a polygon detection', () => {
      const detection: DetectedCookie = {
        x: 50,
        y: 50,
        width: 0, // Ignored when polygon is present
        height: 0,
        confidence: 0.9,
        polygon: [
          [40, 40],
          [60, 40],
          [60, 60],
          [40, 60],
        ],
      };

      const bounds = calculateCookieBounds(detection);

      expect(bounds).toEqual({
        topLeftX: 40,
        topLeftY: 40,
        bottomY: 60,
        centerX: 50,
        centerY: 50,
      });
    });

    it('handles polygon with negative coordinates', () => {
      // Should fallback to box if polygon length < 3
      // But let's test a valid polygon
       const validDetection: DetectedCookie = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        confidence: 0.9,
        polygon: [
          [-10, -10],
          [10, -10],
          [0, 10],
        ],
      };

      const bounds = calculateCookieBounds(validDetection);

      expect(bounds).toEqual({
        topLeftX: -10,
        topLeftY: -10,
        bottomY: 10,
        centerX: 0,
        centerY: 0,
      });
    });

    it('falls back to box if polygon has fewer than 3 points', () => {
      const detection: DetectedCookie = {
        x: 50,
        y: 50,
        width: 20,
        height: 10,
        confidence: 0.9,
        polygon: [[40, 40], [60, 60]], // Only 2 points
      };

      const bounds = calculateCookieBounds(detection);

      expect(bounds).toEqual({
        topLeftX: 40,
        topLeftY: 45,
        bottomY: 55,
        centerX: 50,
        centerY: 50,
      });
    });
  });

  describe('smoothPolygon', () => {
    it('returns simple path for less than 3 points', () => {
      const points: Array<[number, number]> = [[0, 0], [10, 10]];
      const path = smoothPolygon(points);
      expect(path).toBe('0,0 10,10');
    });

    it('generates a path command string for 3+ points', () => {
      const points: Array<[number, number]> = [[0, 0], [10, 0], [10, 10], [0, 10]];
      const path = smoothPolygon(points);
      
      // Should start with M (move)
      expect(path).toMatch(/^M/);
      // Should end with Z (close path)
      expect(path).toMatch(/Z$/);
      // Should contain Quadratic curves (Q) or Lines (L)
      expect(path).toMatch(/[LQ]/);
    });

    it('handles degenerate points (zero length segments)', () => {
        const points: Array<[number, number]> = [[0, 0], [0, 0], [10, 10]];
        const path = smoothPolygon(points);
        expect(path).toBeDefined();
        expect(path).toMatch(/Z$/);
    });
  });
});
