import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { detectCookiesGemini } from './cookieDetectionGemini';
import { httpsCallable } from 'firebase/functions';

// Mock dependencies
vi.mock('./firebase', () => ({
  functions: {}
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn()
}));

describe('detectCookiesGemini', () => {
  const mockHttpsCallable = httpsCallable as Mock;
  const mockFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpsCallable.mockReturnValue(mockFunction);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return cookies on success', async () => {
    const mockData = {
      data: {
        cookies: [{ x: 50, y: 50, width: 10, height: 10, confidence: 0.9 }],
        count: 1
      }
    };
    mockFunction.mockResolvedValue(mockData);

    const result = await detectCookiesGemini('https://example.com/image.jpg');
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(50);
  });

  it('should retry on internal error', async () => {
    // Fail twice, then succeed
    mockFunction
      .mockRejectedValueOnce(new Error('internal'))
      .mockRejectedValueOnce(new Error('internal'))
      .mockResolvedValue({
        data: {
          cookies: [{ x: 50, y: 50, width: 10, height: 10, confidence: 0.9 }],
          count: 1
        }
      });

    const result = await detectCookiesGemini('https://example.com/image.jpg');
    expect(result).toHaveLength(1);
    expect(mockFunction).toHaveBeenCalledTimes(3);
  });

  it('should throw immediately on unauthenticated error (no retry)', async () => {
    mockFunction.mockRejectedValue(new Error('unauthenticated'));

    await expect(detectCookiesGemini('https://example.com/image.jpg'))
      .rejects.toThrow('You must be signed in');
    
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('should throw immediately on failed-precondition error (no retry)', async () => {
    mockFunction.mockRejectedValue(new Error('failed-precondition'));

    await expect(detectCookiesGemini('https://example.com/image.jpg'))
      .rejects.toThrow('Gemini API is not configured');
    
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('should throw immediately on not found error (no retry)', async () => {
    mockFunction.mockRejectedValue(new Error('not found'));

    await expect(detectCookiesGemini('https://example.com/image.jpg'))
      .rejects.toThrow('Cookie detection service is not available');
    
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('should exhaust retries and throw final error', async () => {
    mockFunction.mockRejectedValue(new Error('internal error'));

    await expect(detectCookiesGemini('https://example.com/image.jpg'))
      .rejects.toThrow('Failed to detect cookies');
    
    // Initial + 2 retries = 3 calls
    expect(mockFunction).toHaveBeenCalledTimes(3);
  });
});
