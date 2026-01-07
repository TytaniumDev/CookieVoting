import { describe, it, expect } from 'vitest';
import { parseGeminiResponse } from './parsing';

describe('parseGeminiResponse', () => {
  it('should parse valid JSON array', () => {
    const input = '[{"x": 50, "y": 50, "width": 10, "height": 10, "confidence": 0.9}]';
    const result = parseGeminiResponse(input);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(50);
  });

  it('should parse JSON wrapped in markdown code blocks', () => {
    const input = '```json\n[{"x": 50, "y": 50, "width": 10, "height": 10, "confidence": 0.9}]\n```';
    const result = parseGeminiResponse(input);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(50);
  });

  it('should parse JSON with text before and after', () => {
    const input = 'Here is the data: [{"x": 50, "y": 50, "width": 10, "height": 10, "confidence": 0.9}] Hope this helps!';
    const result = parseGeminiResponse(input);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(50);
  });

  it('should handle empty response gracefully', () => {
    const result = parseGeminiResponse('');
    expect(result).toEqual([]);
  });

  it('should handle invalid JSON gracefully (return empty array)', () => {
    const input = 'This is not JSON';
    const result = parseGeminiResponse(input);
    expect(result).toEqual([]);
  });
  
  it('should parse JSON without markdown but with newlines', () => {
      const input = `
      [
        {
            "x": 50,
            "y": 50,
            "width": 10,
            "height": 10,
            "confidence": 0.9
        }
      ]
      `;
      const result = parseGeminiResponse(input);
      expect(result).toHaveLength(1);
  });
});
