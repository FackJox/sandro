import {
  centerTile,
  tileOrigin,
  tileSpacing,
  type CameraState,
  type Viewport
} from '$lib/config/geometry';

type ViewportOverride = Partial<Viewport> | undefined;

export const colRowToPixels = (col: number, row: number, viewport?: ViewportOverride) =>
  tileOrigin(col, row, viewport);

export const colRowToCamera = (col: number, row: number, viewport?: ViewportOverride): CameraState =>
  centerTile(col, row, viewport);

export const pixelsToColRow = (x: number, y: number, viewport?: ViewportOverride) => {
  const spacing = tileSpacing(viewport);
  return {
    col: Math.round(x / spacing.x),
    row: Math.round(y / spacing.y)
  };
};
