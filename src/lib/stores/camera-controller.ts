import { centerGrid, centerRow, centerTile, type CameraState } from '$lib/config/geometry';
import type { Row } from '$lib/content';

// Pure command-driven camera controller; state is mutated deterministically and
// callers can read the resulting camera/keyframe targets without side effects.

export type FocusState =
  | { kind: 'grid' }
  | { kind: 'row'; rowSlug: string; tileIndex?: number }
  | { kind: 'tile'; rowSlug: string; tileSlug: string; tileIndex?: number };

export type CameraCommand =
  | { type: 'zoomOutToGrid' }
  | { type: 'focusRow'; rowSlug: string; tileIndex?: number }
  | { type: 'focusTile'; rowSlug: string; tileSlug: string; tileIndex?: number };

export type ControllerConfig = {
  rows: Row[];
  grid: { columns: number; rows: number };
  viewport?: { vw: number; vh: number };
};

export type ControllerState = {
  focus: FocusState;
  camera: CameraState;
  queue: CameraCommand[];
};

export type Transition = {
  from: ControllerState;
  to: ControllerState;
  command: CameraCommand;
};

const DEFAULT_CAMERA: CameraState = { x: 0, y: 0, scale: 1 };
const DEFAULT_FOCUS: FocusState = { kind: 'grid' };

const cloneCommand = (command: CameraCommand): CameraCommand => ({ ...command });
const cloneFocus = (focus: FocusState): FocusState => ({ ...focus });
const cloneState = (state: ControllerState): ControllerState => ({
  focus: cloneFocus(state.focus),
  camera: { ...state.camera },
  queue: state.queue.map(cloneCommand)
});

const findRowIndex = (rows: Row[], slug: string) => rows.findIndex((row) => row.slug === slug);

const resolveTileIndex = (row: Row, command: Extract<CameraCommand, { type: 'focusTile' }>): number => {
  if (command.tileIndex != null) return command.tileIndex;
  if (row.type === 'photoGallery' || row.type === 'filmGallery') {
    const items = row.items ?? [];
    const index = items.findIndex((item) => item.slug === command.tileSlug);
    return index >= 0 ? index : 0;
  }
  return 0;
};

export const commandFromFocus = (focus: FocusState): CameraCommand => {
  switch (focus.kind) {
    case 'grid':
      return { type: 'zoomOutToGrid' };
    case 'row':
      return { type: 'focusRow', rowSlug: focus.rowSlug, tileIndex: focus.tileIndex };
    case 'tile':
      return {
        type: 'focusTile',
        rowSlug: focus.rowSlug,
        tileSlug: focus.tileSlug,
        tileIndex: focus.tileIndex
      };
  }
};

export const commandsEqual = (a: CameraCommand, b: CameraCommand) => {
  if (a.type !== b.type) return false;
  if (a.type === 'zoomOutToGrid') return true;
  if (a.type === 'focusRow' && b.type === 'focusRow') {
    const aIndex = a.tileIndex ?? 0;
    const bIndex = b.tileIndex ?? 0;
    return a.rowSlug === b.rowSlug && aIndex === bIndex;
  }
  if (a.type === 'focusTile' && b.type === 'focusTile') {
    return (
      a.rowSlug === b.rowSlug &&
      a.tileSlug === b.tileSlug &&
      (a.tileIndex ?? 0) === (b.tileIndex ?? 0)
    );
  }
  return false;
};

const resolveCommand = (
  command: CameraCommand,
  config: ControllerConfig
): { focus: FocusState; camera: CameraState } => {
  switch (command.type) {
    case 'zoomOutToGrid':
      return {
        focus: { kind: 'grid' },
        camera: centerGrid(config.grid, config.viewport)
      };
    case 'focusRow': {
      const rowIndex = findRowIndex(config.rows, command.rowSlug);
      const focus: FocusState = {
        kind: 'row',
        rowSlug: command.rowSlug,
        tileIndex: command.tileIndex
      };
      if (rowIndex === -1) {
        return { focus, camera: DEFAULT_CAMERA };
      }
      return {
        focus,
        camera: centerRow(rowIndex, { tileIndex: command.tileIndex }, config.viewport)
      };
    }
    case 'focusTile': {
      const rowIndex = findRowIndex(config.rows, command.rowSlug);
      const focus: FocusState = {
        kind: 'tile',
        rowSlug: command.rowSlug,
        tileSlug: command.tileSlug,
        tileIndex: undefined
      };
      if (rowIndex === -1) {
        return { focus, camera: DEFAULT_CAMERA };
      }
      const row = config.rows[rowIndex];
      const index = resolveTileIndex(row, command);
      focus.tileIndex = index;
      return {
        focus,
        camera: centerTile(index, rowIndex, config.viewport)
      };
    }
  }
};

export const cameraFromCommand = (command: CameraCommand, config: ControllerConfig) =>
  resolveCommand(command, config).camera;

export const focusFromCommand = (command: CameraCommand, config: ControllerConfig) =>
  resolveCommand(command, config).focus;

const tailCommand = (queue: CameraCommand[], fallback: CameraCommand) =>
  queue.length > 0 ? queue[queue.length - 1] : fallback;

export const createCameraController = (config: ControllerConfig, initial?: Partial<ControllerState>) => {
  const initialFocus = initial?.focus ?? DEFAULT_FOCUS;
  const initialCommand = commandFromFocus(initialFocus);
  const resolvedInitial = resolveCommand(initialCommand, config);
  const initialCamera = initial?.camera ?? resolvedInitial.camera;
  let state: ControllerState = {
    focus: cloneFocus(resolvedInitial.focus),
    camera: { ...initialCamera },
    queue: initial?.queue ? initial.queue.map(cloneCommand) : []
  };

  const setState = (next: ControllerState) => {
    state = cloneState(next);
    return state;
  };

  const enqueue = (command: CameraCommand) => {
    const lastCommand = tailCommand(state.queue, commandFromFocus(state.focus));
    if (commandsEqual(lastCommand, command)) {
      return { enqueued: false, state: cloneState(state) };
    }
    const nextState: ControllerState = {
      focus: cloneFocus(state.focus),
      camera: { ...state.camera },
      queue: [...state.queue.map(cloneCommand), cloneCommand(command)]
    };
    setState(nextState);
    return { enqueued: true, state: cloneState(state) };
  };

  const step = (): Transition | null => {
    if (state.queue.length === 0) return null;
    const [command, ...rest] = state.queue;
    const resolved = resolveCommand(command, config);

    const from = cloneState(state);
    const to: ControllerState = {
      focus: resolved.focus,
      camera: resolved.camera,
      queue: rest.map(cloneCommand)
    };
    setState(to);
    return { from, to: cloneState(state), command: cloneCommand(command) };
  };

  const issue = (command: CameraCommand) => {
    const { enqueued } = enqueue(command);
    if (!enqueued) {
      return { transition: null, state: cloneState(state) };
    }
    const transition = step();
    return { transition, state: cloneState(state) };
  };

  return {
    getState: () => cloneState(state),
    enqueue,
    step,
    issue,
    reset: (next?: Partial<ControllerState>) => {
      const focus = next?.focus ?? DEFAULT_FOCUS;
      const command = commandFromFocus(focus);
      const resolved = resolveCommand(command, config);
      const camera = next?.camera ?? resolved.camera;
      setState({
        focus: resolved.focus,
        camera,
        queue: next?.queue ? next.queue.map(cloneCommand) : []
      });
      return cloneState(state);
    }
  };
};
