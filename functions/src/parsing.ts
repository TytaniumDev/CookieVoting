export interface DetectedCookie {
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: Array<[number, number]>;
  confidence: number;
}

export function parseGeminiResponse(text: string): DetectedCookie[] {
  if (!text) return [];

  try {
    // Clean and extract JSON from response
    let jsonString = text.trim();

    // Remove markdown code blocks if present (more robust regex)
    // Matches ```json ... ``` or just ``` ... ``` or nothing
    const markdownRegex = /```(?:json)?\s*(\[[\s\S]*?\])\s*```/i;
    const match = jsonString.match(markdownRegex);

    if (match) {
      jsonString = match[1];
    } else {
      // If no markdown blocks, try to find the array brackets
      const arrayStart = jsonString.indexOf('[');
      const arrayEnd = jsonString.lastIndexOf(']');
      
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        jsonString = jsonString.substring(arrayStart, arrayEnd + 1);
      }
    }

    // Attempt to parse
    const detectedCookies = JSON.parse(jsonString);

    // Validate result is an array
    if (!Array.isArray(detectedCookies)) {
      console.warn('Parsed result is not an array:', typeof detectedCookies);
      return [];
    }

    // Validate and normalize items
    // We reuse the validation logic from the original file but make it pure
    return detectedCookies
      .filter((cookie: any) => {
        if (!cookie || typeof cookie !== 'object') return false;

        // Basic numeric checks
        const isValid =
          typeof cookie.x === 'number' &&
          typeof cookie.y === 'number' &&
          typeof cookie.width === 'number' &&
          typeof cookie.height === 'number' &&
          !isNaN(cookie.x) &&
          !isNaN(cookie.y) &&
          !isNaN(cookie.width) &&
          !isNaN(cookie.height);
          
         return isValid;
      })
      .map((cookie: any) => {
          let polygon: Array<[number, number]> | undefined = undefined;
          
          if (Array.isArray(cookie.polygon)) {
              const validPoints = cookie.polygon.filter((p: any) => 
                  Array.isArray(p) && p.length === 2 && 
                  typeof p[0] === 'number' && typeof p[1] === 'number'
              ).map((p: [number, number]) => [
                  Math.max(0, Math.min(100, p[0])), 
                  Math.max(0, Math.min(100, p[1]))
              ] as [number, number]);
              
              if (validPoints.length >= 3) {
                  polygon = validPoints;
              }
          }

          return {
            x: Math.max(0, Math.min(100, cookie.x)),
            y: Math.max(0, Math.min(100, cookie.y)),
            width: Math.max(0.1, Math.min(100, cookie.width)),
            height: Math.max(0.1, Math.min(100, cookie.height)),
            polygon,
            confidence: typeof cookie.confidence === 'number' ? Math.max(0, Math.min(1, cookie.confidence)) : 0.8,
          };
      });

  } catch (error) {
    console.warn('Failed to parse Gemini response:', error);
    return [];
  }
}