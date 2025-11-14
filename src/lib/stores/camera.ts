import { get, writable } from 'svelte/store';
import { gsap } from 'gsap';
import { rows } from '$lib/content';
import { motion } from '$lib/animation/motion';
import {
  commandFromFocus,
  createCameraController,
  type FocusState,
  cameraFromCommand
} from './camera-controller';
import type { CameraState } from '$lib/config/geometry';

// Expand grid width to allow horizontal panning to media bands in grid view
const GRID_COLUMNS = 4;
const GRID_DIMENSIONS = {
  columns: GRID_COLUMNS,
  rows: Math.max(1, Math.ceil(rows.length / GRID_COLUMNS))
};

const defaultRowSlug = rows.find((row) => row.type === 'hero')?.slug ?? rows[0]?.slug ?? 'hero';

const initialFocus: FocusState = rows.length
  ? { kind: 'row', rowSlug: defaultRowSlug }
  : { kind: 'grid' };

const initialCamera: CameraState = cameraFromCommand(
  commandFromFocus(initialFocus),
  {
    rows,
    grid: GRID_DIMENSIONS
  }
);

export const camera = writable<CameraState>({ ...initialCamera });
export const focus = writable<FocusState>({ ...initialFocus });

const isVitest = typeof import.meta !== 'undefined' && (import.meta as any).vitest;
const shouldUseImmediate = typeof window === 'undefined' && !isVitest;

const controller = createCameraController(
  {
    rows,
    grid: GRID_DIMENSIONS
  },
  {
    gsap,
    motion: get(motion),
    immediate: shouldUseImmediate,
    onUpdate: (cameraState, focusState) => {
      // Reduce noisy dev logs to avoid performance issues in browsers
      if (typeof window !== 'undefined' && (window as any).__DEBUG_CAMERA) {
        console.log('[camera] onUpdate -> focus', focusState);
      }
      camera.set({ ...cameraState });
      focus.set({ ...focusState });
    }
  },
  { focus: initialFocus, camera: initialCamera }
);

export const api = {
  zoomOutToGrid: () => {
    console.log('[camera] api.zoomOutToGrid called');
    return controller.issue({ type: 'zoomOutToGrid' });
  },
  focusRow: (rowSlug: string, tileIndex?: number) => {
    console.log('[camera] api.focusRow called', { rowSlug, tileIndex });
    return controller.issue({ type: 'focusRow', rowSlug, tileIndex });
  },
  focusTile: (rowSlug: string, tileSlug: string, tileIndex?: number) => {
    console.log('[camera] api.focusTile called', { rowSlug, tileSlug, tileIndex });
    return controller.issue({ type: 'focusTile', rowSlug, tileSlug, tileIndex });
  }
};

export type { FocusState } from './camera-controller';
