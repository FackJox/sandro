import { describe, expect, it } from 'vitest';
import {
  centerGrid,
  centerTile,
  getViewport,
  gridScale,
  gridSize,
  gutters,
  responsiveClamp,
  tileOrigin,
  tileSpacing
} from './geometry';

const SMALL_VIEWPORT = { vw: 375, vh: 667 };
const LARGE_VIEWPORT = { vw: 1600, vh: 900 };
const MID_VIEWPORT = { vw: 1200, vh: 800 };

describe('responsiveClamp', () => {
  it('returns min and max values at configured breakpoints', () => {
    const config = { min: 12, max: 48, minViewport: 360, maxViewport: 1440 };
    const small = responsiveClamp(config, SMALL_VIEWPORT);
    const large = responsiveClamp(config, LARGE_VIEWPORT);

    expect(small).toBeGreaterThanOrEqual(12);
    expect(small).toBeLessThan(14);
    expect(large).toBeCloseTo(48, 5);
  });
});

describe('gutters', () => {
  it('scales with viewport width', () => {
    const small = gutters(SMALL_VIEWPORT);
    const large = gutters(LARGE_VIEWPORT);

    expect(small.gx).toBeLessThan(large.gx);
    expect(small.gy).toBeLessThan(large.gy);
  });

  it('memoizes results for identical viewport sizes', () => {
    const first = gutters();
    const second = gutters();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});

describe('gridScale', () => {
  it('clamps to configured min for narrow screens', () => {
    expect(gridScale(SMALL_VIEWPORT)).toBeCloseTo(0.1102, 4);
  });

  it('clamps to configured max for wide screens', () => {
    expect(gridScale(LARGE_VIEWPORT)).toBeCloseTo(0.13, 4);
  });
});

describe('centering helpers', () => {
  it('computes tile origins and spacing using gutters', () => {
    const spacing = tileSpacing(MID_VIEWPORT);
    const origin = tileOrigin(2, 1, MID_VIEWPORT);

    expect(spacing.x).toBeGreaterThan(MID_VIEWPORT.vw);
    expect(spacing.y).toBeGreaterThan(MID_VIEWPORT.vh);
    expect(origin.x).toBeCloseTo(spacing.x * 2, 5);
    expect(origin.y).toBeCloseTo(spacing.y * 1, 5);
  });

  it('centers individual tiles at unit scale', () => {
    const camera = centerTile(1, 1, MID_VIEWPORT);
    const spacing = tileSpacing(MID_VIEWPORT);

    expect(camera.scale).toBe(1);
    expect(camera.x).toBeCloseTo(spacing.x, 5);
    expect(camera.y).toBeCloseTo(spacing.y, 5);
  });

  it('centers full grid and reports aggregate size', () => {
    const shape = { columns: 3, rows: 2 };
    const size = gridSize(shape, MID_VIEWPORT);
    const gridCamera = centerGrid(shape, MID_VIEWPORT);

    expect(size.width).toBeGreaterThan(MID_VIEWPORT.vw);
    expect(size.height).toBeGreaterThan(MID_VIEWPORT.vh);
    expect(gridCamera.scale).toBeCloseTo(gridScale(MID_VIEWPORT), 5);
    expect(gridCamera.x).toBeLessThan(size.width);
    expect(gridCamera.y).toBeLessThan(size.height);
  });

  it('allows anchoring the grid to a specific tile', () => {
    const shape = { columns: 3, rows: 2 };
    const anchor = tileSpacing(MID_VIEWPORT);
    const anchorPoint = {
      x: anchor.x * 2 + MID_VIEWPORT.vw / 2,
      y: anchor.y * 1 + MID_VIEWPORT.vh / 2
    };
    const anchoredCamera = centerGrid(shape, MID_VIEWPORT, { anchor: anchorPoint });
    const scale = gridScale(MID_VIEWPORT);
    const halfWidth = MID_VIEWPORT.vw / (scale * 2);
    const halfHeight = MID_VIEWPORT.vh / (scale * 2);
    const { width, height } = gridSize(shape, MID_VIEWPORT);
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const maxX = Math.max(0, width - MID_VIEWPORT.vw / scale);
    const maxY = Math.max(0, height - MID_VIEWPORT.vh / scale);
    const anchorBounds = {
      x: clamp(anchorPoint.x, 0, width),
      y: clamp(anchorPoint.y, 0, height)
    };
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const expectedX =
      scaledWidth < MID_VIEWPORT.vw
        ? -(MID_VIEWPORT.vw - scaledWidth) / 2
        : clamp(anchorBounds.x - halfWidth, 0, maxX);
    const tileHeight = MID_VIEWPORT.vh;
    const middleTileRow = (shape.rows - 1) / 2;
    const middleTileCenterY = middleTileRow * tileHeight + tileHeight / 2;
    const expectedY =
      scaledHeight < MID_VIEWPORT.vh
        ? middleTileCenterY * scale - MID_VIEWPORT.vh / 2
        : clamp(anchorBounds.y - halfHeight, 0, maxY);

    expect(anchoredCamera.scale).toBeCloseTo(scale, 5);
    expect(anchoredCamera.x).toBeCloseTo(expectedX, 5);
    expect(anchoredCamera.y).toBeCloseTo(expectedY, 5);
  });
});

describe('SSR fallback', () => {
  it('returns default viewport dimensions when no explicit values are provided', () => {
    const viewport = getViewport({});
    expect(viewport).toEqual({ vw: 1440, vh: 900 });
  });
});
