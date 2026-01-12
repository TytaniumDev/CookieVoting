import { z } from 'zod';

/**
 * Validation schemas using Zod.
 * These schemas are used with React Hook Form for form validation.
 */

/**
 * Event name validation schema
 */
export const eventNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Event name cannot be empty')
    .max(100, 'Event name must be 100 characters or less')
    .trim(),
});

export type EventNameFormData = z.infer<typeof eventNameSchema>;

/**
 * Category name validation schema
 */
export const categoryNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name cannot be empty')
    .max(100, 'Category name must be 100 characters or less')
    .trim(),
});

export type CategoryNameFormData = z.infer<typeof categoryNameSchema>;

/**
 * Baker/Maker name validation schema
 */
export const bakerNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Baker name cannot be empty')
    .max(50, 'Baker name must be 50 characters or less')
    .trim(),
});

export type BakerNameFormData = z.infer<typeof bakerNameSchema>;

/**
 * Category creation schema (includes file)
 */
export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name cannot be empty')
    .max(100, 'Category name must be 100 characters or less')
    .trim(),
  image: z
    .instanceof(File, { message: 'Image file is required' })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'Image size must be 5MB or less'
    )
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Invalid image type. Please use JPEG, PNG, WebP, or GIF.'
    ),
});

export type CategoryCreateFormData = z.infer<typeof categoryCreateSchema>;
