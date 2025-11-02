import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { defaultMotion } from '$lib/animation/motion';

type TimelineMockInstance = {
  to: Mock<[Record<string, number>, Record<string, any>], TimelineMockInstance>;
  eventCallback: Mock<['onComplete' | 'onInterrupt', () => void], TimelineMockInstance>;
  play: Mock<[], TimelineMockInstance>;
  kill: Mock<[], void>;
};

const createTimelineMock = () => {
  const calls: Array<{ vars: Record<string, any> }> = [];
  let onUpdate: (() => void) | undefined;
  let onComplete: (() => void) | undefined;

  const instance: TimelineMockInstance = {
    to: vi.fn((_target, vars) => {
      calls.push({ vars });
      const maybeOnUpdate = vars.onUpdate;
      onUpdate = typeof maybeOnUpdate === 'function' ? maybeOnUpdate : undefined;
      return instance;
    }),
    eventCallback: vi.fn((event, cb) => {
      if (event === 'onComplete') onComplete = cb;
      return instance;
    }),
    play: vi.fn(() => instance),
    kill: vi.fn()
  };

  return {
    instance,
    calls,
    triggerUpdate: () => onUpdate?.(),
    triggerComplete: () => onComplete?.()
  };
};

const timelines: ReturnType<typeof createTimelineMock>[] = [];

vi.mock('gsap', () => {
  return {
    gsap: {
      timeline: vi.fn(() => {
        const timeline = createTimelineMock();
        timelines.push(timeline);
        return timeline.instance;
      }),
      __timelines: timelines
    }
  };
});

const importCameraModule = async () => {
  return import('./camera');
};

const resetCameraModule = async () => {
  timelines.length = 0;
  vi.resetModules();
  vi.clearAllMocks();
};

describe('camera store integration', () => {
  beforeEach(async () => {
    await resetCameraModule();
  });

  it('animates zoom out and resolves when complete', async () => {
    const { api, camera, focus } = await importCameraModule();
    const { get } = await import('svelte/store');
    const { gsap } = await import('gsap');

    expect((gsap as any).timeline).toHaveBeenCalledTimes(0);

    const zoomPromise = api.zoomOutToGrid();
    expect((gsap as any).timeline).toHaveBeenCalledTimes(1);

    const firstTimeline = timelines[0];
    expect(firstTimeline.calls[0].vars.duration).toBeCloseTo(defaultMotion.zoomOut.duration, 5);

    firstTimeline.triggerUpdate();
    firstTimeline.triggerComplete();
    await zoomPromise;

    expect(get(focus).kind).toBe('grid');

    const rowPromise = api.focusRow('photo');
    expect((gsap as any).timeline).toHaveBeenCalledTimes(2);
    const secondTimeline = timelines[1];
    secondTimeline.triggerComplete();
    await rowPromise;

    expect(get(focus)).toEqual({ kind: 'row', rowSlug: 'photo', tileIndex: undefined });

    const tilePromise = api.focusTile('photo', 'desert');
    expect((gsap as any).timeline).toHaveBeenCalledTimes(3);
    const thirdTimeline = timelines[2];
    expect(thirdTimeline.calls[0].vars.duration).toBeCloseTo(
      defaultMotion.horizontalChange.duration,
      5
    );
    thirdTimeline.triggerComplete();
    await tilePromise;

    const cameraState = get(camera);
    expect(cameraState.scale).toBeGreaterThan(0);
  });
});
