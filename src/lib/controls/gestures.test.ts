import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writable, type Writable } from 'svelte/store';

import type { FocusState } from '$lib/stores/camera';
import type { GestureIntent, SwipeIntent } from '$lib/gestures/intent';

type InitGesturesModule = typeof import('./gestures');
type ZoomToggleModule = typeof import('./zoom-toggle');

const createSwipe = (overrides: Partial<SwipeIntent> = {}): SwipeIntent => ({
  type: 'swipe',
  pointerType: 'touch',
  axis: 'y',
  direction: 'up',
  travelPx: 80,
  velocityPxMs: 0.6,
  durationMs: 180,
  ...overrides
});

describe('initGestures', () => {
  let focusStore: Writable<FocusState>;
  let zoomOutMock: ReturnType<typeof vi.fn>;
  let focusRowMock: ReturnType<typeof vi.fn>;
  let focusTileMock: ReturnType<typeof vi.fn>;
  let unsubscribeIntentsMock: ReturnType<typeof vi.fn>;
  let stopGesturesMock: ReturnType<typeof vi.fn>;
  let intentHandler: ((intent: GestureIntent) => void) | null;
  let initGestures: InitGesturesModule['initGestures'];
  let createZoomToggle: ZoomToggleModule['createZoomToggle'];
  let toggle: ReturnType<ZoomToggleModule['createZoomToggle']> | null;
  let now = 0;
  let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

  const loadModules = async () => {
    ({ initGestures } = await import('./gestures'));
    ({ createZoomToggle } = await import('./zoom-toggle'));
  };

  beforeEach(async () => {
    vi.resetModules();
    intentHandler = null;
    focusStore = writable<FocusState>({ kind: 'row', rowSlug: 'hero' });
    zoomOutMock = vi.fn(() => Promise.resolve());
    focusRowMock = vi.fn(() => Promise.resolve());
    focusTileMock = vi.fn(() => Promise.resolve());
    unsubscribeIntentsMock = vi.fn();
    stopGesturesMock = vi.fn();
    now = 0;
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      nowSpy?.mockRestore?.();
      nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now);
    }

    vi.doMock('$lib/stores/camera', () => ({
      focus: focusStore,
      api: {
        zoomOutToGrid: zoomOutMock,
        focusRow: focusRowMock,
        focusTile: focusTileMock
      }
    }));

    vi.doMock('$lib/gestures/intent', () => ({
      startGestureIntent: vi.fn(() => stopGesturesMock),
      subscribeIntents: vi.fn((handler: (intent: GestureIntent) => void) => {
        intentHandler = handler;
        return unsubscribeIntentsMock;
      })
    }));

    await loadModules();
    toggle = createZoomToggle();
  });

  afterEach(() => {
    toggle?.dispose();
    toggle = null;
    nowSpy?.mockRestore?.();
    nowSpy = null;
  });

  it('zooms out to grid when swiping up from a row focus', async () => {
    initGestures(document.createElement('div'), toggle!);
    expect(intentHandler).toBeTruthy();
    intentHandler?.(createSwipe());
    await Promise.resolve();
    await Promise.resolve();
    expect(zoomOutMock).toHaveBeenCalledTimes(1);
  });

  it('returns to last non-grid focus when swiping up from grid', async () => {
    initGestures(document.createElement('div'), toggle!);
    intentHandler?.(createSwipe());
    await vi.waitFor(() => {
      expect(zoomOutMock).toHaveBeenCalledTimes(1);
      expect(toggle!.getState().transitionPending).toBe(false);
    });
    now += 500;
    focusStore.set({ kind: 'grid' });
    await Promise.resolve();
    intentHandler?.(createSwipe());
    await Promise.resolve();
    await Promise.resolve();
    expect(focusRowMock).toHaveBeenCalledTimes(1);
    expect(focusRowMock).toHaveBeenCalledWith('hero', undefined);
  });

  it('returns to last tile focus when available', async () => {
    focusStore.set({
      kind: 'tile',
      rowSlug: 'photo',
      tileSlug: 'desert-dawn',
      tileIndex: 2
    });
    initGestures(document.createElement('div'), toggle!);
    intentHandler?.(createSwipe());
    await vi.waitFor(() => {
      expect(zoomOutMock).toHaveBeenCalledTimes(1);
      expect(toggle!.getState().transitionPending).toBe(false);
    });
    now += 500;
    focusStore.set({ kind: 'grid' });
    await Promise.resolve();
    intentHandler?.(createSwipe());
    await Promise.resolve();
    await Promise.resolve();
    expect(focusTileMock).toHaveBeenCalledTimes(1);
    expect(focusTileMock).toHaveBeenCalledWith('photo', 'desert-dawn', 2);
  });

  it('ignores swipes while a transition is pending', async () => {
    zoomOutMock.mockImplementation(() => new Promise(() => {}));
    initGestures(document.createElement('div'), toggle!);
    intentHandler?.(createSwipe());
    intentHandler?.(createSwipe());
    expect(zoomOutMock).toHaveBeenCalledTimes(1);
  });

  it('cleans up subscriptions on dispose', async () => {
    const dispose = initGestures(document.createElement('div'), toggle!);
    dispose();
    expect(unsubscribeIntentsMock).toHaveBeenCalledTimes(1);
    expect(stopGesturesMock).toHaveBeenCalledTimes(1);
  });

  it('does not trigger a restore when a second swipe happens before zoom out completes', async () => {
    let resolveZoom: (() => void) | null = null;
    zoomOutMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveZoom = resolve;
        })
    );

    initGestures(document.createElement('div'), toggle!);
    intentHandler?.(createSwipe());
    await Promise.resolve();
    intentHandler?.(createSwipe());
    await Promise.resolve();
    expect(focusRowMock).not.toHaveBeenCalled();
    resolveZoom?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(focusRowMock).not.toHaveBeenCalled();
  });
});
