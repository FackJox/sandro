// Global pointer manager that fans out pointer batches to gesture handlers.

export type PointerPhase = 'down' | 'move' | 'up' | 'cancel';

export interface PointerSnapshot {
  id: number;
  pointerType: PointerEvent['pointerType'];
  buttons: number;
  clientX: number;
  clientY: number;
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  offsetX: number;
  offsetY: number;
  pressure: number;
  tangentialPressure: number;
  twist: number;
  width: number;
  height: number;
  isPrimary: boolean;
  time: number;
  downTime: number;
  phase: PointerPhase;
  active: boolean;
}

export interface PointerBatch {
  phase: PointerPhase;
  changed: PointerSnapshot;
  active: PointerSnapshot[];
  event: PointerEvent;
}

type PointerSubscriber = (batch: PointerBatch) => void;

interface InternalPointer {
  id: number;
  pointerType: PointerEvent['pointerType'];
  buttons: number;
  isPrimary: boolean;
  pressure: number;
  tangentialPressure: number;
  twist: number;
  width: number;
  height: number;
  downX: number;
  downY: number;
  downTime: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  phase: PointerPhase;
}

const activePointers = new Map<number, InternalPointer>();
const subscribers = new Set<PointerSubscriber>();

const MIN_DT_MS = 1;

const toSnapshot = (pointer: InternalPointer): PointerSnapshot => ({
  id: pointer.id,
  pointerType: pointer.pointerType,
  buttons: pointer.buttons,
  clientX: pointer.lastX,
  clientY: pointer.lastY,
  deltaX: pointer.deltaX,
  deltaY: pointer.deltaY,
  velocityX: pointer.velocityX,
  velocityY: pointer.velocityY,
  offsetX: pointer.lastX - pointer.downX,
  offsetY: pointer.lastY - pointer.downY,
  pressure: pointer.pressure,
  tangentialPressure: pointer.tangentialPressure,
  twist: pointer.twist,
  width: pointer.width,
  height: pointer.height,
  isPrimary: pointer.isPrimary,
  time: pointer.lastTime,
  downTime: pointer.downTime,
  phase: pointer.phase,
  active: pointer.phase !== 'up' && pointer.phase !== 'cancel'
});

const emitBatch = (phase: PointerPhase, changed: PointerSnapshot, event: PointerEvent) => {
  const snapshot = {
    phase,
    changed,
    active: Array.from(activePointers.values()).map((pointer) => toSnapshot(pointer)),
    event
  } satisfies PointerBatch;
  subscribers.forEach((subscriber) => subscriber(snapshot));
};

const updateFromEvent = (
  pointer: InternalPointer,
  event: PointerEvent,
  now: number,
  phase: PointerPhase
): PointerSnapshot => {
  const deltaX = event.clientX - pointer.lastX;
  const deltaY = event.clientY - pointer.lastY;
  const dt = Math.max(MIN_DT_MS, now - pointer.lastTime);
  const dtSeconds = dt / 1000;
  const velocityX = phase === 'down' ? 0 : deltaX / dtSeconds;
  const velocityY = phase === 'down' ? 0 : deltaY / dtSeconds;

  pointer.pointerType = event.pointerType;
  pointer.buttons = event.buttons;
  pointer.isPrimary = event.isPrimary;
  pointer.pressure = event.pressure ?? pointer.pressure;
  pointer.tangentialPressure = event.tangentialPressure ?? pointer.tangentialPressure;
  pointer.twist = event.twist ?? pointer.twist;
  pointer.width = event.width ?? pointer.width;
  pointer.height = event.height ?? pointer.height;
  pointer.lastX = event.clientX;
  pointer.lastY = event.clientY;
  pointer.lastTime = now;
  pointer.deltaX = phase === 'down' ? 0 : deltaX;
  pointer.deltaY = phase === 'down' ? 0 : deltaY;
  pointer.velocityX = phase === 'down' ? 0 : velocityX;
  pointer.velocityY = phase === 'down' ? 0 : velocityY;
  pointer.phase = phase;
  return toSnapshot(pointer);
};

const registerPointer = (event: PointerEvent, now: number): InternalPointer => {
  const pointer: InternalPointer = {
    id: event.pointerId,
    pointerType: event.pointerType,
    buttons: event.buttons,
    isPrimary: event.isPrimary,
    pressure: event.pressure ?? 0,
    tangentialPressure: event.tangentialPressure ?? 0,
    twist: event.twist ?? 0,
    width: event.width ?? 0,
    height: event.height ?? 0,
    downX: event.clientX,
    downY: event.clientY,
    downTime: now,
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: now,
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0,
    phase: 'down'
  };
  activePointers.set(pointer.id, pointer);
  return pointer;
};

const handlePointerDown = (event: PointerEvent) => {
  const now = performance.now();
  activePointers.delete(event.pointerId);
  const pointer = registerPointer(event, now);
  const snapshot = updateFromEvent(pointer, event, now, 'down');
  emitBatch('down', snapshot, event);
};

const updatePointer = (event: PointerEvent, phase: PointerPhase) => {
  const pointer = activePointers.get(event.pointerId);
  if (!pointer) return;
  const now = performance.now();
  const snapshot = updateFromEvent(pointer, event, now, phase);
  if (phase === 'up' || phase === 'cancel') {
    activePointers.delete(pointer.id);
  }
  emitBatch(phase, snapshot, event);
};

const handlePointerMove = (event: PointerEvent) => updatePointer(event, 'move');
const handlePointerUp = (event: PointerEvent) => updatePointer(event, 'up');
const handlePointerCancel = (event: PointerEvent) => updatePointer(event, 'cancel');

export function initPointer(el: HTMLElement) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const down = (event: PointerEvent) => handlePointerDown(event);
  const move = (event: PointerEvent) => handlePointerMove(event);
  const up = (event: PointerEvent) => handlePointerUp(event);
  const cancel = (event: PointerEvent) => handlePointerCancel(event);

  el.addEventListener('pointerdown', down, { passive: false });
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', up, { passive: false });
  window.addEventListener('pointercancel', cancel, { passive: false });

  return () => {
    el.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    activePointers.clear();
  };
}

export function subscribePointers(subscriber: PointerSubscriber) {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function getActivePointers(): PointerSnapshot[] {
  return Array.from(activePointers.values()).map((pointer) => toSnapshot(pointer));
}
