import { describe, it, expect } from 'vitest';
import {
  eventNameSchema,
  categoryNameSchema,
  bakerNameSchema,
  categoryCreateSchema,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('eventNameSchema', () => {
    it('should validate valid event name', () => {
      const result = eventNameSchema.safeParse({ name: 'Holiday Cookie-Off' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = eventNameSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = eventNameSchema.safeParse({ name: longName });
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = eventNameSchema.safeParse({ name: '  Test Event  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Event');
      }
    });
  });

  describe('categoryNameSchema', () => {
    it('should validate valid category name', () => {
      const result = categoryNameSchema.safeParse({ name: 'Sugar Cookies' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = categoryNameSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('bakerNameSchema', () => {
    it('should validate valid baker name', () => {
      const result = bakerNameSchema.safeParse({ name: 'John Doe' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = bakerNameSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name over 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = bakerNameSchema.safeParse({ name: longName });
      expect(result.success).toBe(false);
    });
  });

  describe('categoryCreateSchema', () => {
    it('should validate valid category with image', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = categoryCreateSchema.safeParse({
        name: 'Sugar Cookies',
        image: file,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing image', () => {
      const result = categoryCreateSchema.safeParse({
        name: 'Sugar Cookies',
      });
      expect(result.success).toBe(false);
    });

    it('should reject image over 5MB', () => {
      const largeFile = new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = categoryCreateSchema.safeParse({
        name: 'Sugar Cookies',
        image: largeFile,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid image type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = categoryCreateSchema.safeParse({
        name: 'Sugar Cookies',
        image: file,
      });
      expect(result.success).toBe(false);
    });
  });
});
