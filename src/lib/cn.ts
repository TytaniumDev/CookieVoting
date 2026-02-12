import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

/**
 * Merges Tailwind classes using `clsx` and `tailwind-merge`.
 * This ensures that conflicting Tailwind classes (e.g., `p-4` and `p-2`)
 * are resolved correctly, with later classes taking precedence.
 *
 * @example
 * cn('p-4 bg-white', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
