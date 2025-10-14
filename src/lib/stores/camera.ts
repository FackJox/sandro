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

const GRID_COLUMNS = 3;
const GRID_DIMENSIONS = {
  columns: GRID_COLUMNS,
  rows: Math.max(1, Math.ceil(rows.length / GRID_COLUMNS))
};

const defaultRowSlug = rows.find((row) => row.type === 'hero')?.slug ?? rows[0]?.slug ?? 'hero';

const initialFocus: FocusState = rows.length
  ? { kind: 'row', rowSlug: defaultRowSlug, tileIndex: 0 }
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
      camera.set({ ...cameraState });
      focus.set({ ...focusState });
    }
  },
  { focus: initialFocus, camera: initialCamera }
);

export const api = {
  zoomOutToGrid: () => controller.issue({ type: 'zoomOutToGrid' as const }),
  focusRow: (rowSlug: string, tileIndex?: number) =>
    controller.issue({ type: 'focusRow', rowSlug, tileIndex }),
  focusTile: (rowSlug: string, tileSlug: string, tileIndex?: number) =>
    controller.issue({ type: 'focusTile', rowSlug, tileSlug, tileIndex })
};

export type { FocusState } from './camera-controller';
