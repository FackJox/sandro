import { describe, expect, it, vi } from 'vitest';
import {
  commandFromFocus,
  createCameraController,
  cameraFromCommand,
  type ControllerDeps
} from './camera-controller';
import type { FocusState } from './camera-controller';
import type { Row } from '$lib/content';
import { defaultMotion } from '$lib/animation/motion';
import { centerRow, centerTile, getViewport, gridScale, gridSize } from '$lib/config/geometry';

const heroRow: Row = { type: 'hero', slug: 'hero' };
const photoRow: Row = {
  type: 'photoGallery',
  slug: 'photo',
  title: 'Photo',
  items: [{ slug: 'desert', title: 'Desert', image: '/photo/desert.jpg' }]
};
const filmRow: Row = {
  type: 'filmGallery',
  slug: 'film',
  title: 'Film',
  items: [
    {
      slug: 'teaser',
      title: 'Teaser',
      poster: '/film/teaser.jpg',
      externalUrl: 'https://example.com'
    },
    {
      slug: 'documentary',
      title: 'Documentary',
      poster: '/film/documentary.jpg',
      externalUrl: 'https://example.com/documentary'
    }
  ]
};
const contactRow: Row = { type: 'contact', slug: 'contact' };

const controllerConfig = {
  rows: [heroRow, photoRow, filmRow],
  grid: { columns: 3, rows: 2 }
} as const;

const createTimelineMock = () => {
  const calls: Array<{ target: Record<string, number>; vars: Record<string, any> }> = [];
  let onUpdate: (() => void) | undefined;
  let onComplete: (() => void) | undefined;
  let onInterrupt: (() => void) | undefined;

  const instance = {
    to: vi.fn((target: Record<string, number>, vars: Record<string, any>) => {
      calls.push({ target, vars });
      onUpdate = typeof vars.onUpdate === 'function' ? vars.onUpdate : undefined;
      return instance;
    }),
    eventCallback: vi.fn((event: 'onUpdate' | 'onComplete' | 'onInterrupt', cb: () => void) => {
      if (event === 'onComplete') onComplete = cb;
      if (event === 'onInterrupt') onInterrupt = cb;
      return instance;
    }),
    play: vi.fn(() => instance),
    kill: vi.fn()
  };

  return {
    instance,
    calls,
    triggerUpdate: () => onUpdate?.(),
    triggerComplete: () => onComplete?.(),
    triggerInterrupt: () => onInterrupt?.()
  };
};

const createDeps = (overrides?: Partial<ControllerDeps>) => {
  const timelines: ReturnType<typeof createTimelineMock>[] = [];
  const gsap = {
    timeline: vi.fn(() => {
      const timeline = createTimelineMock();
      timelines.push(timeline);
      return timeline.instance;
    })
  };

  const deps: ControllerDeps = {
    gsap,
    motion: defaultMotion,
    immediate: false,
    onUpdate: () => {
      // no-op in tests; controller invokes this hook on each tick
    },
    ...overrides
  };

  return { deps, timelines };
};

describe('camera controller timelines', () => {
  it('animates grid to row with zoomIn easing', async () => {
    const { deps, timelines } = createDeps();
    const controller = createCameraController(controllerConfig, deps, { focus: { kind: 'grid' } });

    const promise = controller.issue({ type: 'focusRow', rowSlug: 'hero' });
    expect(deps.gsap.timeline).toHaveBeenCalledTimes(1);

    const timeline = timelines[0];
    const [{ vars }] = timeline.calls;
    expect(vars.duration).toBeCloseTo(defaultMotion.zoomIn.duration, 5);
    expect(vars.ease).toBe(defaultMotion.zoomIn.ease);

    timeline.triggerUpdate();
    timeline.triggerComplete();

    const transition = await promise;
    expect(transition?.to.focus).toEqual({ kind: 'row', rowSlug: 'hero', tileIndex: undefined });
  });

  it('animates row to tile with horizontal change timing', async () => {
    const { deps, timelines } = createDeps();
    const controller = createCameraController(controllerConfig, deps, {
      focus: { kind: 'row', rowSlug: 'photo' }
    });

    const promise = controller.issue({
      type: 'focusTile',
      rowSlug: 'photo',
      tileSlug: 'desert'
    });
    expect(deps.gsap.timeline).toHaveBeenCalledTimes(1);

    const [{ vars }] = timelines[0].calls;
    expect(vars.duration).toBeCloseTo(defaultMotion.horizontalChange.duration, 5);
    expect(vars.ease).toBe(defaultMotion.horizontalChange.ease);

    timelines[0].triggerComplete();
    const transition = await promise;
    expect(transition?.to.focus).toEqual({
      kind: 'tile',
      rowSlug: 'photo',
      tileSlug: 'desert',
      tileIndex: 0
    });
  });

  it('queues commands and runs them sequentially', async () => {
    const { deps, timelines } = createDeps();
    const controller = createCameraController(controllerConfig, deps, { focus: { kind: 'grid' } });

    const first = controller.issue({ type: 'focusRow', rowSlug: 'hero' });
    const second = controller.issue({ type: 'focusTile', rowSlug: 'photo', tileSlug: 'desert' });

    expect(deps.gsap.timeline).toHaveBeenCalledTimes(1);
    timelines[0].triggerComplete();
    await first;
    expect(deps.gsap.timeline).toHaveBeenCalledTimes(2);
    timelines[1].triggerComplete();
    await second;
  });

  it('resolves immediately when command matches current focus', async () => {
    const { deps } = createDeps();
    const controller = createCameraController(controllerConfig, deps, {
      focus: { kind: 'row', rowSlug: 'hero' }
    });

    const result = await controller.issue({ type: 'focusRow', rowSlug: 'hero' });
    expect(result).toBeNull();
    expect(deps.gsap.timeline).not.toHaveBeenCalled();
  });

  it('supports immediate mode without GSAP involvement', async () => {
    const { deps } = createDeps({ immediate: true });
    const controller = createCameraController(controllerConfig, deps, { focus: { kind: 'grid' } });

    const transition = await controller.issue({ type: 'focusRow', rowSlug: 'hero' });
    expect(transition?.to.focus.kind).toBe('row');
    expect(deps.gsap.timeline).not.toHaveBeenCalled();
  });
});

describe('zoom out anchoring', () => {
  const viewport = getViewport();
  const scale = gridScale(viewport);
  const halfWidth = viewport.vw / (scale * 2);
  const halfHeight = viewport.vh / (scale * 2);
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));
  const { width, height } = gridSize(controllerConfig.grid, viewport);
  const maxX = Math.max(0, width - viewport.vw / scale);
  const maxY = Math.max(0, height - viewport.vh / scale);

  it('centers the previously focused row when zooming out', async () => {
    const { deps } = createDeps({ immediate: true });
    const controller = createCameraController(controllerConfig, deps, {
      focus: { kind: 'row', rowSlug: 'photo' }
    });

    const transition = await controller.issue({ type: 'zoomOutToGrid' });
    expect(transition?.to.focus).toEqual({ kind: 'grid' });
    expect(transition?.to.camera).toBeDefined();
    const rowIndex = controllerConfig.rows.findIndex((row) => row.slug === 'photo');
    const focusCamera = centerRow(rowIndex, {}, viewport);
    const focusCenter = {
      x: focusCamera.x + viewport.vw / (focusCamera.scale * 2),
      y: focusCamera.y + viewport.vh / (focusCamera.scale * 2)
    };
    expect(transition!.to.camera.x).toBeCloseTo(
      clamp(focusCenter.x - halfWidth, 0, maxX),
      5
    );
    expect(transition!.to.camera.y).toBeCloseTo(
      clamp(focusCenter.y - halfHeight, 0, maxY),
      5
    );
  });

  it('uses tile slug to maintain focus when zooming out from a tile', async () => {
    const { deps } = createDeps({ immediate: true });
    const controller = createCameraController(controllerConfig, deps, {
      focus: {
        kind: 'tile',
        rowSlug: 'film',
        tileSlug: 'documentary',
        tileIndex: undefined
      }
    });

    const transition = await controller.issue({ type: 'zoomOutToGrid' });
    expect(transition?.to.focus).toEqual({ kind: 'grid' });
    expect(transition?.to.camera).toBeDefined();
    const rowIndex = controllerConfig.rows.findIndex((row) => row.slug === 'film');
    let tileIndex = filmRow.items.findIndex((item) => item.slug === 'documentary');
    if (tileIndex < 0) tileIndex = 0;
    const focusCamera = centerTile(tileIndex, rowIndex, viewport);
    const focusCenter = {
      x: focusCamera.x + viewport.vw / (focusCamera.scale * 2),
      y: focusCamera.y + viewport.vh / (focusCamera.scale * 2)
    };
    expect(transition!.to.camera.x).toBeCloseTo(
      clamp(focusCenter.x - halfWidth, 0, maxX),
      5
    );
    expect(transition!.to.camera.y).toBeCloseTo(
      clamp(focusCenter.y - halfHeight, 0, maxY),
      5
    );
  });

  it('centers rows that live in later grid rows', async () => {
    const expandedConfig = {
      rows: [...controllerConfig.rows, contactRow],
      grid: { columns: 2, rows: 2 }
    } as const;
    const { deps } = createDeps({ immediate: true });
    const controller = createCameraController(expandedConfig, deps, {
      focus: { kind: 'row', rowSlug: 'contact' }
    });

    const transition = await controller.issue({ type: 'zoomOutToGrid' });
    expect(transition?.to.focus).toEqual({ kind: 'grid' });
    expect(transition?.to.camera).toBeDefined();
    const rowIndex = expandedConfig.rows.findIndex((row) => row.slug === 'contact');
    const focusCamera = centerRow(rowIndex, {}, viewport);
    const focusCenter = {
      x: focusCamera.x + viewport.vw / (focusCamera.scale * 2),
      y: focusCamera.y + viewport.vh / (focusCamera.scale * 2)
    };
    const { width: expandedWidth, height: expandedHeight } = gridSize(
      expandedConfig.grid,
      viewport
    );
    const expandedMaxX = Math.max(0, expandedWidth - viewport.vw / scale);
    const expandedMaxY = Math.max(0, expandedHeight - viewport.vh / scale);
    expect(transition!.to.camera.x).toBeCloseTo(
      clamp(focusCenter.x - halfWidth, 0, expandedMaxX),
      5
    );
    expect(transition!.to.camera.y).toBeCloseTo(
      clamp(focusCenter.y - halfHeight, 0, expandedMaxY),
      5
    );
  });
});
describe('command helpers', () => {
  it('computes camera state from focus', () => {
    const focus: FocusState = { kind: 'row', rowSlug: 'hero' };
    const command = commandFromFocus(focus);
    const camera = cameraFromCommand(command, controllerConfig);
    expect(camera.scale).toBe(1);
  });
});
