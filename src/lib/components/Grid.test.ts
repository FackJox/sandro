import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writable, type Writable } from 'svelte/store';

import type { FocusState } from '$lib/stores/camera';

type GridComponent = typeof import('./Grid.svelte').default;

describe('Grid component interactions', () => {
  let focusStore: Writable<FocusState>;
  let cameraStore: Writable<{ x: number; y: number; scale: number }>;
  let focusRowMock: ReturnType<typeof vi.fn>;
  let Grid: GridComponent;

  beforeEach(() => {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(async () => {
    vi.resetModules();
    focusStore = writable<FocusState>({ kind: 'grid' });
    cameraStore = writable({ x: 0, y: 0, scale: 1 });
    focusRowMock = vi.fn(() => Promise.resolve());

    vi.doMock('$lib/stores/camera', () => ({
      camera: cameraStore,
      focus: focusStore,
      api: {
        focusRow: focusRowMock,
        focusTile: vi.fn(),
        zoomOutToGrid: vi.fn()
      }
    }));

    const module = await import('./Grid.svelte');
    Grid = module.default;
  });

  it('focuses a row when clicked from the grid view', async () => {
    const { getByText } = render(Grid);
    await fireEvent.click(getByText('HERO'));
    expect(focusRowMock).toHaveBeenCalledWith('hero', undefined);
  });

  it('ignores clicks when not in grid focus', async () => {
    focusStore.set({ kind: 'row', rowSlug: 'hero' });
    const { getByText } = render(Grid);
    await fireEvent.click(getByText('HERO'));
    expect(focusRowMock).not.toHaveBeenCalled();
  });
});
