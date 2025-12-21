import { CONSTANTS } from './constants';

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate image file before upload
 */
export function validateImage(file: File): ValidationResult {
    // Check file size
    if (file.size > CONSTANTS.MAX_IMAGE_SIZE_BYTES) {
        return {
            valid: false,
            error: CONSTANTS.ERROR_MESSAGES.IMAGE_TOO_LARGE
        };
    }

    // Check file type
    if (!CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type as typeof CONSTANTS.ALLOWED_IMAGE_TYPES[number])) {
        return {
            valid: false,
            error: CONSTANTS.ERROR_MESSAGES.INVALID_IMAGE_TYPE
        };
    }

    return { valid: true };
}

/**
 * Sanitize input string to prevent XSS
 */
export function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate event name
 */
export function validateEventName(name: string): ValidationResult {
    const sanitized = sanitizeInput(name);
    
    if (!sanitized) {
        return {
            valid: false,
            error: 'Event name cannot be empty'
        };
    }

    if (sanitized.length > 100) {
        return {
            valid: false,
            error: 'Event name must be 100 characters or less'
        };
    }

    return { valid: true };
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): ValidationResult {
    const sanitized = sanitizeInput(name);
    
    if (!sanitized) {
        return {
            valid: false,
            error: 'Category name cannot be empty'
        };
    }

    if (sanitized.length > 100) {
        return {
            valid: false,
            error: 'Category name must be 100 characters or less'
        };
    }

    return { valid: true };
}

/**
 * Validate maker name
 */
export function validateMakerName(name: string): ValidationResult {
    const sanitized = sanitizeInput(name);
    
    if (!sanitized) {
        return {
            valid: false,
            error: 'Maker name cannot be empty'
        };
    }

    if (sanitized.length > 50) {
        return {
            valid: false,
            error: 'Maker name must be 50 characters or less'
        };
    }

    return { valid: true };
}

