// Stub cropUtils - minimal implementation for testing
export interface SliceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  isSaved?: boolean;
  savedImageId?: string;
}

export interface GridConfig {
  rows: number;
  cols: number;
  padding: number;
}

export function sliceImage(_image: HTMLImageElement, _regions: SliceRegion[]): Promise<Blob[]> {
  return Promise.resolve([]);
}

export function generateGrid(_rows: number, _cols: number, _width: number, _height: number): SliceRegion[] {
  return [];
}

export function clampRegion(region: SliceRegion, _width: number, _height: number): SliceRegion {
  return region;
}

export function validateRegion(_region: SliceRegion, _width: number, _height: number): boolean {
  return true;
}

