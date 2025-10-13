import { gutters, tileSize } from '$lib/config/geometry';

export const colRowToPixels = (col: number, row: number) => {
  const { w, h } = tileSize();
  const { gx, gy } = gutters();
  return { x: col * (w + gx), y: row * (h + gy) };
};

