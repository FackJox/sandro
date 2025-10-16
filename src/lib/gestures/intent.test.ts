import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PointerBatch, PointerSnapshot } from '$lib/controls/pointer';
import {
  ingestPointerBatchForTests,
  resetGestureStateForTests,
  setGestureConfigForTests,
  subscribeIntents,
  type GestureIntent,
  type TapIntent,
  type SwipeIntent,
  type PinchIntent
} from './intent';
import type { GestureConfig } from './config';

type Phase = PointerBatch['phase'];

type PointerState = {
  originX: number;
  originY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  snapshot: PointerSnapshot;
};

const defaultSnapshot = (id: number): PointerSnapshot => ({
  id,
  pointerType: 'touch',
  buttons: 1,
  clientX: 0,
  clientY: 0,
  deltaX: 0,
  deltaY: 0,
  velocityX: 0,
  velocityY: 0,
  offsetX: 0,
  offsetY: 0,
  pressure: 0,
  tangentialPressure: 0,
  twist: 0,
  width: 0,
  height: 0,
  isPrimary: id === 1,
  time: 0,
  downTime: 0,
  phase: 'down',
  active: true
});

const cloneSnapshot = (snapshot: PointerSnapshot): PointerSnapshot => ({
  ...snapshot
});

const eventStub = {} as PointerEvent;

const emitPointer = (
  pointerStates: Map<number, PointerState>,
  phase: Phase,
  id: number,
  overrides: Partial<PointerSnapshot> & { time: number; clientX?: number; clientY?: number }
) => {
  if (phase === 'down') {
    const base = defaultSnapshot(id);
    base.phase = 'down';
    base.time = overrides.time;
    base.downTime = overrides.time;
    base.clientX = overrides.clientX ?? 0;
    base.clientY = overrides.clientY ?? 0;
    base.buttons = overrides.buttons ?? base.buttons;
    base.offsetX = 0;
    base.offsetY = 0;
    base.deltaX = 0;
    base.deltaY = 0;
    base.velocityX = 0;
    base.velocityY = 0;
    pointerStates.set(id, {
      originX: base.clientX,
      originY: base.clientY,
      lastX: base.clientX,
      lastY: base.clientY,
      lastTime: overrides.time,
      snapshot: base
    });
    const active = Array.from(pointerStates.values()).map((state) => cloneSnapshot(state.snapshot));
    ingestPointerBatchForTests({
      phase,
      changed: cloneSnapshot(base),
      active,
      event: eventStub
    });
    return;
  }

  const state = pointerStates.get(id);
  if (!state) {
    throw new Error(`Pointer ${id} does not exist`);
  }

  const time = overrides.time;
  const clientX = overrides.clientX ?? state.lastX;
  const clientY = overrides.clientY ?? state.lastY;
  const deltaX = clientX - state.lastX;
  const deltaY = clientY - state.lastY;
  const dt = Math.max(1, time - state.lastTime);
  const velocityScale = 1000 / dt;
  const snapshot: PointerSnapshot = {
    ...state.snapshot,
    phase,
    time,
    clientX,
    clientY,
    deltaX,
    deltaY,
    velocityX: deltaX * velocityScale,
    velocityY: deltaY * velocityScale,
    offsetX: clientX - state.originX,
    offsetY: clientY - state.originY,
    buttons: overrides.buttons ?? state.snapshot.buttons,
    active: phase !== 'up' && phase !== 'cancel'
  };

  if (phase === 'up' || phase === 'cancel') {
    pointerStates.delete(id);
  } else {
    state.lastX = clientX;
    state.lastY = clientY;
    state.lastTime = time;
    state.snapshot = snapshot;
  }

  const active = Array.from(pointerStates.values()).map((entry) => cloneSnapshot(entry.snapshot));
  ingestPointerBatchForTests({
    phase,
    changed: cloneSnapshot(snapshot),
    active,
    event: eventStub
  });
};

const baseConfig: GestureConfig = {
  tap: { maxMovePx: 8, maxMs: 250 },
  swipe: { minTravelPx: 40, minVelocityPxMs: 0.1, axisLockPx: 6, dominance: 1.2 },
  pinch: { commitDelta: 0.15 },
  photo: { exitMinDelta: 0.06 }
};

describe('gesture intent translator', () => {
  let restoreConfig: () => void;
  let pointerStates: Map<number, PointerState>;
  let intents: GestureIntent[];
  let unsubscribe: () => void;

  beforeEach(() => {
    restoreConfig = setGestureConfigForTests(baseConfig);
    resetGestureStateForTests();
    pointerStates = new Map();
    intents = [];
    unsubscribe = subscribeIntents((intent) => intents.push(intent));
  });

  afterEach(() => {
    unsubscribe();
    restoreConfig();
  });

  it('emits tap intent when movement and duration stay below thresholds', () => {
    emitPointer(pointerStates, 'down', 1, { time: 0, clientX: 100, clientY: 200 });
    emitPointer(pointerStates, 'move', 1, { time: 50, clientX: 103, clientY: 202 });
    emitPointer(pointerStates, 'up', 1, { time: 120, clientX: 103, clientY: 202 });

    expect(intents).toHaveLength(1);
    const intent = intents[0] as TapIntent;
    expect(intent.type).toBe('tap');
    expect(intent.position).toEqual({ x: 103, y: 202 });
    expect(intent.durationMs).toBe(120);
  });

  it('rejects tap when movement exceeds threshold', () => {
    emitPointer(pointerStates, 'down', 1, { time: 0, clientX: 0, clientY: 0 });
    emitPointer(pointerStates, 'move', 1, { time: 20, clientX: 30, clientY: 30 });
    emitPointer(pointerStates, 'up', 1, { time: 100, clientX: 30, clientY: 30 });

    expect(intents).toHaveLength(0);
  });

  it('emits horizontal swipe intent with axis locking', () => {
    emitPointer(pointerStates, 'down', 1, { time: 0, clientX: 0, clientY: 0 });
    emitPointer(pointerStates, 'move', 1, { time: 60, clientX: 120, clientY: 5 });
    emitPointer(pointerStates, 'up', 1, { time: 90, clientX: 130, clientY: 6 });

    expect(intents[0]).toMatchObject({
      type: 'swipe',
      axis: 'x',
      direction: 'right'
    } satisfies Partial<SwipeIntent>);
    const swipe = intents[0] as SwipeIntent;
    expect(swipe.travelPx).toBeGreaterThanOrEqual(120);
    expect(swipe.velocityPxMs).toBeGreaterThanOrEqual(baseConfig.swipe.minVelocityPxMs);
  });

  it('emits vertical swipe intent and ignores horizontal noise', () => {
    emitPointer(pointerStates, 'down', 1, { time: 0, clientX: 0, clientY: 0 });
    emitPointer(pointerStates, 'move', 1, { time: 80, clientX: 12, clientY: 120 });
    emitPointer(pointerStates, 'up', 1, { time: 110, clientX: 14, clientY: 150 });

    const swipe = intents[0] as SwipeIntent;
    expect(swipe.axis).toBe('y');
    expect(swipe.direction).toBe('down');
    expect(swipe.travelPx).toBeGreaterThan(100);
  });

  it('emits pinch out intent when distance increases beyond threshold', () => {
    emitPointer(pointerStates, 'down', 1, { time: 0, clientX: -50, clientY: 0 });
    emitPointer(pointerStates, 'down', 2, { time: 0, clientX: 50, clientY: 0 });

    emitPointer(pointerStates, 'move', 1, { time: 40, clientX: -90, clientY: 0 });
    emitPointer(pointerStates, 'move', 2, { time: 60, clientX: 90, clientY: 0 });

    const pinch = intents.find((intent): intent is PinchIntent => intent.type === 'pinch');
    expect(pinch).toBeTruthy();
    expect(pinch?.direction).toBe('out');
    expect(pinch?.scale).toBeGreaterThan(1);
  });

  it('emits pinch in intent when distance decreases beyond threshold', () => {
    emitPointer(pointerStates, 'down', 1, { time: 0, clientX: -120, clientY: 0 });
    emitPointer(pointerStates, 'down', 2, { time: 0, clientX: 120, clientY: 0 });

    emitPointer(pointerStates, 'move', 1, { time: 40, clientX: -60, clientY: 0 });
    emitPointer(pointerStates, 'move', 2, { time: 60, clientX: 60, clientY: 0 });

    const pinch = intents.find((intent): intent is PinchIntent => intent.type === 'pinch' && intent.direction === 'in');
    expect(pinch).toBeTruthy();
    expect(pinch?.scale).toBeLessThan(1);
  });

  it('ignores noise that fails to meet swipe thresholds', () => {
    emitPointer(pointerStates, 'down', 1, { time: 0, clientX: 0, clientY: 0 });
    emitPointer(pointerStates, 'move', 1, { time: 40, clientX: 10, clientY: 8 });
    emitPointer(pointerStates, 'up', 1, { time: 70, clientX: 12, clientY: 8 });

    expect(intents).toHaveLength(0);
  });
});
