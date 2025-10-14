import { writable } from 'svelte/store';
import { rows } from '$lib/content';
import {
  createCameraController,
  type CameraCommand,
  type ControllerState,
  type FocusState
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

const controller = createCameraController(
  {
    rows,
    grid: GRID_DIMENSIONS
  },
  { focus: initialFocus }
);

const initialState = controller.getState();

export const camera = writable<CameraState>(initialState.camera);
export const focus = writable<FocusState>(initialState.focus);

const applyState = (state: ControllerState) => {
  camera.set({ ...state.camera });
  focus.set({ ...state.focus });
};

const run = async (command: CameraCommand) => {
  const { transition, state } = controller.issue(command);
  applyState(state);
  return transition;
};

export const api = {
  /**
   * Camera commands resolve once the controller reaches the requested focus.
   */
  zoomOutToGrid: () => run({ type: 'zoomOutToGrid' }),
  focusRow: (rowSlug: string, tileIndex?: number) =>
    run({ type: 'focusRow', rowSlug, tileIndex }),
  focusTile: (rowSlug: string, tileSlug: string, tileIndex?: number) =>
    run({ type: 'focusTile', rowSlug, tileSlug, tileIndex })
};

export type { FocusState } from './camera-controller';
