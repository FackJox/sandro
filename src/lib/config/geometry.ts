export type CameraState = { x: number; y: number; scale: number };

// Grid density controls (Utopia-style fluid via viewport width).
export const s_grid = 0.35; // tile width in grid = 100vw * s_grid
export const g = 0.06; // gutter as ratio of 100vw

export const getViewport = () => ({
  vw: typeof window !== 'undefined' ? window.innerWidth : 1920,
  vh: typeof window !== 'undefined' ? window.innerHeight : 1080
});

export const gutters = () => {
  const { vw } = getViewport();
  const gx = vw * g;
  const gy = gx; // equal vertical/horizontal by default
  return { gx, gy };
};

export const tileSize = () => {
  const { vw, vh } = getViewport();
  return { w: vw, h: vh };
};

export const gridScale = () => s_grid;

export const toPixelCoords = (col: number, row: number) => {
  const { w, h } = tileSize();
  const { gx, gy } = gutters();
  return { x: col * (w + gx), y: row * (h + gy) };
};

export const centerTile = (col: number, row: number): CameraState => {
  const { x, y } = toPixelCoords(col, row);
  // Camera coordinates represent the top-left of the viewport in world pixels
  return { x, y, scale: 1 };
};

