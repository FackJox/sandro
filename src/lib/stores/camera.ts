import { writable } from 'svelte/store';
import type { CameraState } from '$lib/config/geometry';

export type Focus =
  | { kind: 'grid' }
  | { kind: 'row'; rowSlug: string; tileIndex?: number }
  | { kind: 'tile'; rowSlug: string; tileSlug: string };

export const camera = writable<CameraState>({ x: 0, y: 0, scale: 1 });
export const focus = writable<Focus>({ kind: 'row', rowSlug: 'hero' });

// Placeholder APIs; implement GSAP-powered transitions later.
export const api = {
  zoomOutToGrid: () => {
    focus.set({ kind: 'grid' });
  },
  focusRow: (rowSlug: string, tileIndex?: number) => {
    focus.set({ kind: 'row', rowSlug, tileIndex });
  },
  focusTile: (rowSlug: string, tileSlug: string) => {
    focus.set({ kind: 'tile', rowSlug, tileSlug });
  }
};

