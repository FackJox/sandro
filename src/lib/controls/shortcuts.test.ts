import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { writable, type Writable } from 'svelte/store';
import type { FocusState } from '$lib/stores/camera-controller';

const createFocusStore = (initial: FocusState) => writable<FocusState>(initial);

const mockApi = {
  zoomOutToGrid: vi.fn<[], Promise<void>>(() => Promise.resolve()),
  focusRow: vi.fn<[string, number | undefined], Promise<void>>(() => Promise.resolve()),
  focusTile: vi.fn<[string, string, number | undefined], Promise<void>>(() => Promise.resolve())
};

let focusStore: Writable<FocusState>;

vi.mock('$lib/stores/camera', () => {
  focusStore = createFocusStore({ kind: 'row', rowSlug: 'hero' });
  return {
    api: mockApi,
    focus: focusStore
  };
});

let cameraModule: typeof import('$lib/stores/camera');
let initShortcuts: typeof import('./shortcuts').initShortcuts;

beforeAll(async () => {
  ({ initShortcuts } = await import('./shortcuts'));
  cameraModule = await import('$lib/stores/camera');
});

const dispatchKey = (key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe('keyboard shortcuts', () => {
  let dispose: (() => void) | undefined;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    focusStore.set({ kind: 'row', rowSlug: 'hero' });
    mockApi.zoomOutToGrid.mockClear();
    mockApi.focusRow.mockClear();
    mockApi.focusTile.mockClear();
    originalMatchMedia = window.matchMedia;
    dispose = initShortcuts();
  });

  afterEach(() => {
    dispose?.();
    window.matchMedia = originalMatchMedia;
  });

  it('navigates between rows with arrow keys and backs out with escape', () => {
    const arrowEvent = dispatchKey('ArrowDown');
    expect(cameraModule.api.focusRow).toHaveBeenCalledWith('contact', undefined);
    expect(arrowEvent.defaultPrevented).toBe(true);

    focusStore.set({ kind: 'row', rowSlug: 'services' });

    const escapeEvent = dispatchKey('Escape');
    expect(cameraModule.api.zoomOutToGrid).toHaveBeenCalledTimes(1);
    expect(escapeEvent.defaultPrevented).toBe(true);
  });

  it('returns from tile to row on escape/backspace', () => {
    focusStore.set({
      kind: 'tile',
      rowSlug: 'photo',
      tileSlug: 'desert-dawn',
      tileIndex: 0
    });

    const esc = dispatchKey('Escape');
    expect(cameraModule.api.focusRow).toHaveBeenCalledWith('photo', 0);
    expect(esc.defaultPrevented).toBe(true);

    focusStore.set({ kind: 'row', rowSlug: 'photo', tileIndex: 0 });
    mockApi.focusRow.mockClear();
    focusStore.set({
      kind: 'tile',
      rowSlug: 'photo',
      tileSlug: 'desert-dawn',
      tileIndex: 0
    });
    const back = dispatchKey('Backspace');
    expect(cameraModule.api.focusRow).toHaveBeenCalledWith('photo', 0);
    expect(back.defaultPrevented).toBe(true);
  });

  it('allows repeated enter activation when reduced motion is preferred', () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      },
      removeEventListener: vi.fn(),
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    });

    dispose?.();
    dispose = initShortcuts();

    focusStore.set({ kind: 'row', rowSlug: 'photo' });

    dispatchKey('Enter');
    dispatchKey('Enter');
    expect(cameraModule.api.focusTile).toHaveBeenCalledTimes(2);
    expect(cameraModule.api.focusTile).toHaveBeenLastCalledWith('photo', 'desert-dawn', 0);
  });

  it('suppresses duplicate commands when focus does not change', () => {
    dispatchKey('ArrowDown');
    expect(cameraModule.api.focusRow).toHaveBeenCalledTimes(1);

    dispatchKey('ArrowDown');
    expect(cameraModule.api.focusRow).toHaveBeenCalledTimes(1);

    focusStore.set({ kind: 'row', rowSlug: 'services' });
    dispatchKey('ArrowDown');
    expect(cameraModule.api.focusRow).toHaveBeenCalledTimes(2);
  });
});
