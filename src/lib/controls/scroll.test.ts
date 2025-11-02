import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { writable, type Writable } from 'svelte/store';

type MockFocusState =
  | { kind: 'grid' }
  | { kind: 'row'; rowSlug: string; tileIndex?: number }
  | { kind: 'tile'; rowSlug: string; tileSlug: string; tileIndex?: number };

const focusStore: Writable<MockFocusState> = writable({ kind: 'row', rowSlug: 'hero' });
const zoomOutMock: Mock<[], Promise<void>> = vi.fn<[], Promise<void>>(async () => {});
const focusRowMock: Mock<[string, number?], Promise<void>> = vi.fn<
  [string, number?],
  Promise<void>
>(async (_rowSlug: string, _tileIndex?: number) => {});
const focusTileMock: Mock<[string, string, number?], Promise<void>> = vi.fn<
  [string, string, number?],
  Promise<void>
>(async (_rowSlug: string, _tileSlug: string, _tileIndex?: number) => {});

vi.mock('$lib/stores/camera', () => {
  return {
    api: {
      zoomOutToGrid: zoomOutMock,
      focusRow: focusRowMock,
      focusTile: focusTileMock
    },
    focus: focusStore
  };
});

let pointerMatches = true;

const createMediaQueryList = () => ({
  media: '(hover: hover) and (pointer: fine)',
  get matches() {
    return pointerMatches;
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
});

const originalMatchMedia = window.matchMedia;

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: vi.fn(() => createMediaQueryList())
});

const { initScroll } = await import('./scroll');
const { createZoomToggle } = await import('./zoom-toggle');

describe('initScroll', () => {
  let root: HTMLDivElement;
  let dispose: (() => void) | undefined;
  let toggle: ReturnType<typeof createZoomToggle> | null;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    zoomOutMock.mockClear();
    focusRowMock.mockClear();
    focusTileMock.mockClear();
    pointerMatches = true;
    focusStore.set({ kind: 'row', rowSlug: 'hero' });
    toggle = createZoomToggle();
    dispose = initScroll(root, toggle);
  });

  afterEach(() => {
    dispose?.();
    toggle?.dispose();
    toggle = null;
    root.remove();
  });

  afterAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia
    });
  });

  it('triggers zoom out once during a scroll gesture when focused on a row', async () => {
    const event = new WheelEvent('wheel', { deltaY: -120 });
    root.dispatchEvent(event);
    root.dispatchEvent(new WheelEvent('wheel', { deltaY: -80 }));
    await Promise.resolve();
    expect(zoomOutMock).toHaveBeenCalledTimes(1);
    expect(focusRowMock).not.toHaveBeenCalled();
  });

  it('restores the last focus when already in grid view', async () => {
    focusStore.set({ kind: 'grid' });
    root.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));
    await Promise.resolve();
    expect(zoomOutMock).not.toHaveBeenCalled();
    expect(focusRowMock).toHaveBeenCalled();
  });

  it('skips triggering on non-desktop pointer contexts', async () => {
    dispose?.();
    pointerMatches = false;
    toggle = createZoomToggle();
    dispose = initScroll(root, toggle);

    root.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
    await Promise.resolve();
    expect(zoomOutMock).not.toHaveBeenCalled();
    expect(focusRowMock).not.toHaveBeenCalled();
  });
});
