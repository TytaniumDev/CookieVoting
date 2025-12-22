// Application constants
export const CONSTANTS = {
  // Image upload limits
  MAX_IMAGE_SIZE_MB: 5,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],

  // Default values
  DEFAULT_MAKER_NAME: 'Unknown',

  // Error messages
  ERROR_MESSAGES: {
    EVENT_NOT_FOUND: 'Event not found',
    FAILED_TO_LOAD: 'Failed to load data. Please try again.',
    FAILED_TO_SAVE: 'Failed to save. Please try again.',
    FAILED_TO_DELETE: 'Failed to delete. Please try again.',
    FAILED_TO_UPLOAD: 'Failed to upload image. Please try again.',
    IMAGE_TOO_LARGE: `Image is too large. Maximum size is 5MB.`,
    INVALID_IMAGE_TYPE: 'Invalid image type. Please use JPEG, PNG, WebP, or GIF.',
    INVALID_ADMIN_CODE: 'Invalid admin code. Please try again.',
    VOTING_COMPLETED: 'This event is no longer accepting votes.',
    VOTE_INCOMPLETE: 'Please vote in all categories before submitting!',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  },

  // Success messages
  SUCCESS_MESSAGES: {
    EVENT_CREATED: 'Event created successfully!',
    CATEGORY_ADDED: 'Category added successfully!',
    COOKIES_SAVED: 'Cookie tags saved successfully!',
    VOTES_SUBMITTED: 'Votes submitted successfully!',
    EVENT_DELETED: 'Event deleted successfully!',
  },

  // Medals for results
  MEDALS: ['🥇', '🥈', '🥉'] as const,
} as const;
