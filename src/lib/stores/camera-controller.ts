import { centerGrid, centerRow, centerTile, type CameraState } from '$lib/config/geometry';
import type { Row } from '$lib/content';
import type { MotionConfig } from '$lib/animation/motion';

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

type TimelineInstance = {
  to(target: Record<string, number>, vars: Record<string, unknown>): TimelineInstance;
  eventCallback(event: 'onUpdate' | 'onComplete' | 'onInterrupt', callback: () => void): TimelineInstance;
  play(): TimelineInstance;
  kill(): void;
};

export type ControllerDeps = {
  gsap: { timeline: (vars?: Record<string, unknown>) => TimelineInstance };
  motion: MotionConfig;
  immediate?: boolean;
  onUpdate?: (camera: CameraState, focus: FocusState) => void;
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

type PendingCommand = {
  command: CameraCommand;
  resolve: (value: Transition | null) => void;
  reject: (reason?: unknown) => void;
};

const DEFAULT_CAMERA: CameraState = { x: 0, y: 0, scale: 1 };
const DEFAULT_FOCUS: FocusState = { kind: 'grid' };

const cloneFocus = (focus: FocusState): FocusState => ({ ...focus });
const cloneCommand = (command: CameraCommand): CameraCommand => ({ ...command });
const cloneState = (state: ControllerState): ControllerState => ({
  focus: cloneFocus(state.focus),
  camera: { ...state.camera },
  queue: state.queue.map(cloneCommand)
});

const findRowIndex = (rows: Row[], slug: string) => rows.findIndex((row) => row.slug === slug);

const resolveTileIndex = (row: Row, command: { tileSlug: string; tileIndex?: number }) => {
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
    return a.rowSlug === b.rowSlug && (a.tileIndex ?? 0) === (b.tileIndex ?? 0);
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
      const index = resolveTileIndex(row, {
        tileSlug: command.tileSlug,
        tileIndex: command.tileIndex
      });
      focus.tileIndex = index;
      return {
        focus,
        camera: centerTile(index, rowIndex, config.viewport)
      };
    }
  }
};

const tweenFor = (command: CameraCommand, from: FocusState, motion: MotionConfig) => {
  if (command.type === 'zoomOutToGrid') {
    return motion.zoomOut;
  }
  if (command.type === 'focusRow') {
    if (from.kind === 'grid') {
      return motion.zoomIn;
    }
    return { duration: motion.verticalChange.pan, ease: motion.verticalChange.ease };
  }
  if (command.type === 'focusTile') {
    if (from.kind === 'row') {
      return motion.horizontalChange;
    }
    return motion.zoomIn;
  }
  return motion.zoomIn;
};

export const cameraFromCommand = (command: CameraCommand, config: ControllerConfig) =>
  resolveCommand(command, config).camera;

export const focusFromCommand = (command: CameraCommand, config: ControllerConfig) =>
  resolveCommand(command, config).focus;

export const createCameraController = (
  config: ControllerConfig,
  deps: ControllerDeps,
  initial?: Partial<ControllerState>
) => {
  const immediate = deps.immediate ?? false;
  const notify = (camera: CameraState, focus: FocusState) => {
    deps.onUpdate?.({ ...camera }, { ...focus });
  };

  const initialFocus = initial?.focus ?? DEFAULT_FOCUS;
  const resolvedInitial = resolveCommand(commandFromFocus(initialFocus), config);

  let state: ControllerState = {
    focus: cloneFocus(resolvedInitial.focus),
    camera: initial?.camera ? { ...initial.camera } : { ...resolvedInitial.camera },
    queue: initial?.queue ? initial.queue.map(cloneCommand) : []
  };

  notify(state.camera, state.focus);

  let activeTimeline: TimelineInstance | null = null;
  let activeCommand: CameraCommand | null = null;
  const pending: PendingCommand[] = [];

  const startNext = () => {
    if (activeTimeline || pending.length === 0) {
      return;
    }

    const { command, resolve, reject } = pending.shift()!;
    state.queue = state.queue.slice(1);
    activeCommand = command;

    const fromState = cloneState(state);
    const resolved = resolveCommand(command, config);
    const toState: ControllerState = {
      focus: resolved.focus,
      camera: resolved.camera,
      queue: state.queue.map(cloneCommand)
    };

    if (immediate) {
      state.focus = cloneFocus(resolved.focus);
      state.camera = { ...resolved.camera };
      notify(state.camera, state.focus);
      activeCommand = null;
      resolve({ from: fromState, to: cloneState(state), command });
      startNext();
      return;
    }

    const targets = { ...state.camera };
    const tween = tweenFor(command, fromState.focus, deps.motion);
    const timeline = deps.gsap.timeline({ paused: true });
    activeTimeline = timeline;

    timeline.to(targets, {
      x: resolved.camera.x,
      y: resolved.camera.y,
      scale: resolved.camera.scale,
      duration: tween.duration,
      ease: tween.ease,
      onUpdate: () => {
        state.camera = { ...targets };
        notify(state.camera, resolved.focus);
      }
    });

    timeline
      .eventCallback('onComplete', () => {
        timeline.kill();
        activeTimeline = null;
        activeCommand = null;
        state.focus = cloneFocus(resolved.focus);
        state.camera = { ...resolved.camera };
        notify(state.camera, state.focus);
        resolve({ from: fromState, to: cloneState(state), command });
        startNext();
      })
      .eventCallback('onInterrupt', () => {
        timeline.kill();
        activeTimeline = null;
        activeCommand = null;
        reject(new Error('Camera animation interrupted'));
        startNext();
      });

    timeline.play();
  };

  const enqueue = (command: CameraCommand) => {
    console.log('[camera-controller] enqueue', command);
    const lastQueued = pending.length > 0 ? pending[pending.length - 1].command : null;
    const comparisonTarget = lastQueued ?? activeCommand ?? commandFromFocus(state.focus);
    if (commandsEqual(comparisonTarget, command)) {
      console.log('[camera-controller] enqueue skipped duplicate');
      return false;
    }
    return true;
  };

  const issue = (command: CameraCommand) =>
    new Promise<Transition | null>((resolve, reject) => {
      console.log('[camera-controller] issue', command);
      if (!enqueue(command)) {
        resolve(null);
        return;
      }
      pending.push({ command: cloneCommand(command), resolve, reject });
      state.queue = [...state.queue, cloneCommand(command)];
      console.log('[camera-controller] queue length', state.queue.length);
      startNext();
    });

  const reset = (next?: Partial<ControllerState>) => {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    while (pending.length) {
      pending.shift()?.resolve(null);
    }
    activeCommand = null;

    const focus = next?.focus ?? DEFAULT_FOCUS;
    const resolved = resolveCommand(commandFromFocus(focus), config);
    const camera = next?.camera ? { ...next.camera } : { ...resolved.camera };
    state = {
      focus: cloneFocus(resolved.focus),
      camera,
      queue: next?.queue ? next.queue.map(cloneCommand) : []
    };
    notify(state.camera, state.focus);
    return cloneState(state);
  };

  const getState = () => cloneState(state);

  return {
    issue,
    reset,
    getState
  };
};
