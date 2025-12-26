export interface Position {
    x: number;
    y: number;
}

export interface Dimensions {
    width: number;
    height: number;
}

/**
 * Calculates the adjusted position for a dropdown to keep it within the viewport window.
 * 
 * @param currentX The desired X coordinate (usually mouse click)
 * @param currentY The desired Y coordinate (usually mouse click)
 * @param dropdownWidth The width of the dropdown element
 * @param dropdownHeight The height of the dropdown element
 * @param windowWidth The width of the viewport
 * @param windowHeight The height of the viewport
 * @param padding Minimum padding from the edges (default 10px)
 * @returns The adjusted {x, y} coordinates
 */
export function calculateAdjustedPosition(
    currentX: number,
    currentY: number,
    dropdownWidth: number,
    dropdownHeight: number,
    windowWidth: number,
    windowHeight: number,
    padding: number = 10
): Position {
    let x = currentX;
    let y = currentY;

    // Check right overflow
    if (x + dropdownWidth > windowWidth - padding) {
        // Shift left to fit
        x = windowWidth - dropdownWidth - padding;
    }

    // Check bottom overflow
    if (y + dropdownHeight > windowHeight - padding) {
        // Shift up to fit
        y = windowHeight - dropdownHeight - padding;
    }

    // Check top/left underflow (apply after overflow checks to prioritize top-left visibility)
    x = Math.max(padding, x);
    y = Math.max(padding, y);

    return { x, y };
}
