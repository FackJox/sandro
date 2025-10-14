export type CameraState = { x: number; y: number; scale: number };
export type Viewport = { vw: number; vh: number };
export type Gutters = { gx: number; gy: number };
export type TileSize = { w: number; h: number };

const DEFAULT_VIEWPORT: Viewport = { vw: 1440, vh: 900 };
const MIN_VIEWPORT_WIDTH = 360;
const MAX_VIEWPORT_WIDTH = 1920;

const GRID_SCALE_CLAMP = { min: 0.28, max: 0.42, minViewport: 360, maxViewport: 1600 };
const GUTTER_X_CLAMP = { min: 24, max: 80, minViewport: 360, maxViewport: 1680 };
const GUTTER_Y_CLAMP = { min: 32, max: 96, minViewport: 360, maxViewport: 1680 };

type ClampConfig = {
  min: number;
  max: number;
  minViewport?: number;
  maxViewport?: number;
};

const viewportKey = ({ vw, vh }: Viewport) => `${Math.round(vw)}x${Math.round(vh)}`;

let cachedViewportKey: string | null = null;
let cachedGutters: Gutters | null = null;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const resolveViewport = (override?: Partial<Viewport>): Viewport => {
  if (override) {
    return {
      vw: override.vw ?? DEFAULT_VIEWPORT.vw,
      vh: override.vh ?? DEFAULT_VIEWPORT.vh
    };
  }
  if (typeof window === 'undefined') {
    return DEFAULT_VIEWPORT;
  }
  return {
    vw: window.innerWidth || DEFAULT_VIEWPORT.vw,
    vh: window.innerHeight || DEFAULT_VIEWPORT.vh
  };
};

const clampViewport = (value: number, minViewport: number, maxViewport: number) => {
  if (value < minViewport) return minViewport;
  if (value > maxViewport) return maxViewport;
  return value;
};

const responsiveClampInternal = (config: ClampConfig, viewport: Viewport) => {
  const { min, max } = config;
  const minViewport = config.minViewport ?? MIN_VIEWPORT_WIDTH;
  const maxViewport = config.maxViewport ?? MAX_VIEWPORT_WIDTH;
  if (min === max || maxViewport === minViewport) {
    return min;
  }
  const width = clampViewport(viewport.vw, minViewport, maxViewport);
  const range = maxViewport - minViewport;
  const progress = clamp01((width - minViewport) / range);
  return min + (max - min) * progress;
};

const computeGutters = (viewport: Viewport): Gutters => {
  const horizontal = responsiveClampInternal(GUTTER_X_CLAMP, viewport);
  const vertical = responsiveClampInternal(GUTTER_Y_CLAMP, viewport);
  return { gx: horizontal, gy: vertical };
};

const computeTileSize = (viewport: Viewport): TileSize => ({
  w: viewport.vw,
  h: viewport.vh
});

const computeTileSpacing = (viewport: Viewport) => {
  const { w, h } = computeTileSize(viewport);
  const { gx, gy } = computeGutters(viewport);
  return { x: w + gx, y: h + gy };
};

const computeTileOrigin = (col: number, row: number, viewport: Viewport) => {
  const spacing = computeTileSpacing(viewport);
  return {
    x: col * spacing.x,
    y: row * spacing.y
  };
};

const computeTileCenter = (col: number, row: number, viewport: Viewport) => {
  const origin = computeTileOrigin(col, row, viewport);
  const { w, h } = computeTileSize(viewport);
  return {
    x: origin.x + w / 2,
    y: origin.y + h / 2
  };
};

const centerFromTarget = (center: { x: number; y: number }, scale: number, viewport: Viewport): CameraState => {
  const halfWidth = viewport.vw / (scale * 2);
  const halfHeight = viewport.vh / (scale * 2);
  return {
    x: center.x - halfWidth,
    y: center.y - halfHeight,
    scale
  };
};

/**
 * Returns the best-fit viewport metrics, defaulting to SSR-safe values when `window` is unavailable.
 */
export const getViewport = (override?: Partial<Viewport>): Viewport => resolveViewport(override);

/**
 * CSS `clamp()` equivalent driven by viewport width. Useful for fluid tokens and grid scaling.
 */
export const responsiveClamp = (config: ClampConfig, override?: Partial<Viewport>) =>
  responsiveClampInternal(config, resolveViewport(override));

/**
 * Memoized gutter calculation that scales with viewport width. Accepts an optional override for testing.
 */
export const gutters = (override?: Partial<Viewport>): Gutters => {
  const viewport = resolveViewport(override);
  if (!override) {
    const key = viewportKey(viewport);
    if (cachedViewportKey === key && cachedGutters) {
      return { ...cachedGutters };
    }
    const result = computeGutters(viewport);
    cachedViewportKey = key;
    cachedGutters = result;
    return { ...result };
  }
  return computeGutters(viewport);
};

/**
 * Returns tile dimensions in world-space pixels. Tiles default to viewport size for full-bleed focus states.
 */
export const tileSize = (override?: Partial<Viewport>): TileSize => computeTileSize(resolveViewport(override));

/**
 * Combined tile size and gutter spacing between columns/rows.
 */
export const tileSpacing = (override?: Partial<Viewport>) => computeTileSpacing(resolveViewport(override));

/**
 * Horizontal and vertical scale used to frame the full grid during zoomed-out states.
 */
export const gridScale = (override?: Partial<Viewport>) =>
  Number(responsiveClampInternal(GRID_SCALE_CLAMP, resolveViewport(override)).toFixed(4));

type GridShape = { columns: number; rows: number };

const computeGridSize = (grid: GridShape, viewport: Viewport) => {
  const { w, h } = computeTileSize(viewport);
  const { gx, gy } = computeGutters(viewport);
  const width = grid.columns > 0 ? grid.columns * w + Math.max(0, grid.columns - 1) * gx : 0;
  const height = grid.rows > 0 ? grid.rows * h + Math.max(0, grid.rows - 1) * gy : 0;
  return { width, height };
};

/**
 * Total pixel footprint for a grid of tiles, including inter-tile gutters.
 */
export const gridSize = (grid: GridShape, override?: Partial<Viewport>) =>
  computeGridSize(grid, resolveViewport(override));

/**
 * Top-left pixel origin for a tile at the requested column/row coordinates.
 */
export const tileOrigin = (col: number, row: number, override?: Partial<Viewport>) =>
  computeTileOrigin(col, row, resolveViewport(override));

/**
 * Center point in world-space pixels for a tile at the requested coordinates.
 */
export const tileCenter = (col: number, row: number, override?: Partial<Viewport>) =>
  computeTileCenter(col, row, resolveViewport(override));

/**
 * Camera position that centers a specific tile at the given column/row index.
 */
export const centerTile = (col: number, row: number, override?: Partial<Viewport>): CameraState => {
  const viewport = resolveViewport(override);
  return centerFromTarget(computeTileCenter(col, row, viewport), 1, viewport);
};

/**
 * Camera position that centers the specified row. An optional tile index can center a sibling tile in the same row.
 */
export const centerRow = (
  rowIndex: number,
  options: { tileIndex?: number } = {},
  override?: Partial<Viewport>
): CameraState => {
  const column = options.tileIndex ?? 0;
  return centerTile(column, rowIndex, override);
};

/**
 * Camera position that frames the entire grid while maintaining aspect ratio.
 */
export const centerGrid = (grid: GridShape, override?: Partial<Viewport>): CameraState => {
  const viewport = resolveViewport(override);
  const { width, height } = computeGridSize(grid, viewport);
  const center = { x: width / 2, y: height / 2 };
  const scale = gridScale(viewport);
  return centerFromTarget(center, scale, viewport);
};
