import { get } from 'svelte/store';
import { gestures, type GestureConfig } from './config';
import { subscribePointers, type PointerBatch, type PointerSnapshot } from '$lib/controls/pointer';

export type TapIntent = {
  type: 'tap';
  pointerType: PointerSnapshot['pointerType'];
  position: { x: number; y: number };
  time: number;
  durationMs: number;
};

export type SwipeAxis = 'x' | 'y';
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type SwipeIntent = {
  type: 'swipe';
  pointerType: PointerSnapshot['pointerType'];
  axis: SwipeAxis;
  direction: SwipeDirection;
  travelPx: number;
  velocityPxMs: number;
  durationMs: number;
};

export type PinchDirection = 'in' | 'out';

export type PinchIntent = {
  type: 'pinch';
  pointerType: PointerSnapshot['pointerType'] | 'mixed';
  direction: PinchDirection;
  delta: number;
  scale: number;
  midpoint: { x: number; y: number };
  pointers: [number, number];
};

export type GestureIntent = TapIntent | SwipeIntent | PinchIntent;

type IntentSubscriber = (intent: GestureIntent) => void;

interface PointerTrack {
  id: number;
  pointerType: PointerSnapshot['pointerType'];
  startTime: number;
  startX: number;
  startY: number;
  axis: SwipeAxis | null;
  tapEligible: boolean;
  swipeEmitted: boolean;
  pinchParticipant: boolean;
}

interface PinchSession {
  ids: [number, number];
  startDistance: number;
  committed: boolean;
  pointerType: PinchIntent['pointerType'];
}

const pointerTracks = new Map<number, PointerTrack>();
const intentSubscribers = new Set<IntentSubscriber>();

let pointerStop: (() => void) | null = null;
let pinchSession: PinchSession | null = null;

let currentConfig: GestureConfig = get(gestures);
let storedConfig: GestureConfig = currentConfig;
let overrideConfig: GestureConfig | null = null;

gestures.subscribe((value) => {
  storedConfig = value;
  if (!overrideConfig) {
    currentConfig = value;
  }
});

const getConfig = (): GestureConfig => overrideConfig ?? currentConfig;

const clearState = () => {
  pointerTracks.clear();
  pinchSession = null;
};

const emitIntent = (intent: GestureIntent) => {
  intentSubscribers.forEach((subscriber) => subscriber(intent));
};

const distanceBetween = (a: PointerSnapshot, b: PointerSnapshot) => {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
};

const midpointBetween = (a: PointerSnapshot, b: PointerSnapshot) => ({
  x: (a.clientX + b.clientX) / 2,
  y: (a.clientY + b.clientY) / 2
});

const ensurePinchMarkers = (ids: [number, number]) => {
  ids.forEach((id) => {
    const track = pointerTracks.get(id);
    if (track) {
      track.tapEligible = false;
      track.pinchParticipant = true;
    }
  });
};

const resetPinchMarkers = () => {
  pointerTracks.forEach((track) => {
    track.pinchParticipant = false;
  });
};

const updatePinch = (active: PointerSnapshot[], config: GestureConfig) => {
  if (active.length !== 2) {
    pinchSession = null;
    resetPinchMarkers();
    return;
  }

  const ids = active.map((snapshot) => snapshot.id).sort((a, b) => a - b) as [number, number];
  const [firstId, secondId] = ids;
  const first = active.find((snapshot) => snapshot.id === firstId);
  const second = active.find((snapshot) => snapshot.id === secondId);
  if (!first || !second) {
    pinchSession = null;
    resetPinchMarkers();
    return;
  }

  if (!pinchSession || pinchSession.ids[0] !== ids[0] || pinchSession.ids[1] !== ids[1]) {
    const pointerType = first.pointerType === second.pointerType ? first.pointerType : 'mixed';
    let distance = distanceBetween(first, second);
    if (!Number.isFinite(distance) || distance < 0) {
      distance = 0;
    }
    pinchSession = {
      ids,
      startDistance: distance,
      committed: false,
      pointerType
    };
    ensurePinchMarkers(ids);
    return;
  }

  ensurePinchMarkers(ids);

  if (pinchSession.committed) {
    return;
  }

  const distance = distanceBetween(first, second);
  if (pinchSession.startDistance <= 0) {
    pinchSession.startDistance = distance;
    return;
  }

  const scale = distance / pinchSession.startDistance;
  const delta = scale - 1;
  const commitDelta = config.pinch.commitDelta;

  if (delta >= commitDelta) {
    emitIntent({
      type: 'pinch',
      direction: 'out',
      delta,
      scale,
      midpoint: midpointBetween(first, second),
      pointerType: pinchSession.pointerType,
      pointers: [...pinchSession.ids]
    });
    pinchSession.committed = true;
    ensurePinchMarkers(ids);
  } else if (delta <= -commitDelta) {
    emitIntent({
      type: 'pinch',
      direction: 'in',
      delta,
      scale,
      midpoint: midpointBetween(first, second),
      pointerType: pinchSession.pointerType,
      pointers: [...pinchSession.ids]
    });
    pinchSession.committed = true;
    ensurePinchMarkers(ids);
  }
};

const lockAxisIfNeeded = (track: PointerTrack, snapshot: PointerSnapshot, config: GestureConfig) => {
  if (track.axis) return;
  const absX = Math.abs(snapshot.offsetX);
  const absY = Math.abs(snapshot.offsetY);
  const { axisLockPx, dominance } = config.swipe;

  if (absX < axisLockPx && absY < axisLockPx) {
    return;
  }
  if (absX >= absY * dominance) {
    track.axis = 'x';
  } else if (absY >= absX * dominance) {
    track.axis = 'y';
  }
  if (track.axis) {
    track.tapEligible = false;
  }
};

const handleDown = (snapshot: PointerSnapshot) => {
  pointerTracks.set(snapshot.id, {
    id: snapshot.id,
    pointerType: snapshot.pointerType,
    startTime: snapshot.time,
    startX: snapshot.clientX,
    startY: snapshot.clientY,
    axis: null,
    tapEligible: true,
    swipeEmitted: false,
    pinchParticipant: false
  });
};

const handleMove = (snapshot: PointerSnapshot, active: PointerSnapshot[], config: GestureConfig) => {
  const track = pointerTracks.get(snapshot.id);
  if (!track) return;

  if (active.length > 1) {
    track.tapEligible = false;
  }

  if (track.pinchParticipant) {
    return;
  }

  const travel = Math.hypot(snapshot.offsetX, snapshot.offsetY);
  if (travel > config.tap.maxMovePx) {
    track.tapEligible = false;
  }

  lockAxisIfNeeded(track, snapshot, config);
  if (!track.axis || track.swipeEmitted) return;

  const axis = track.axis;
  const offset = axis === 'x' ? snapshot.offsetX : snapshot.offsetY;
  const velocityPxSecond = axis === 'x' ? snapshot.velocityX : snapshot.velocityY;
  const velocityPxMs = Math.abs(velocityPxSecond) / 1000;
  const travelPx = Math.abs(offset);

  if (travelPx >= config.swipe.minTravelPx && velocityPxMs >= config.swipe.minVelocityPxMs) {
    const direction: SwipeDirection =
      axis === 'x'
        ? offset > 0
          ? 'right'
          : 'left'
        : offset > 0
          ? 'down'
          : 'up';

    emitIntent({
      type: 'swipe',
      pointerType: track.pointerType,
      axis,
      direction,
      travelPx,
      velocityPxMs,
      durationMs: snapshot.time - track.startTime
    });
    track.swipeEmitted = true;
    track.tapEligible = false;
  }
};

const handleUp = (snapshot: PointerSnapshot, config: GestureConfig) => {
  const track = pointerTracks.get(snapshot.id);
  pointerTracks.delete(snapshot.id);
  if (!track) return;

  if (track.pinchParticipant) {
    return;
  }
  if (track.swipeEmitted) {
    return;
  }
  if (!track.tapEligible) {
    return;
  }

  const duration = snapshot.time - track.startTime;
  const distance = Math.hypot(snapshot.clientX - track.startX, snapshot.clientY - track.startY);
  if (duration <= config.tap.maxMs && distance <= config.tap.maxMovePx) {
    emitIntent({
      type: 'tap',
      pointerType: track.pointerType,
      position: { x: snapshot.clientX, y: snapshot.clientY },
      time: snapshot.time,
      durationMs: duration
    });
  }
};

const handleCancel = (snapshot: PointerSnapshot) => {
  pointerTracks.delete(snapshot.id);
};

const ingestBatch = (batch: PointerBatch) => {
  const config = getConfig();

  switch (batch.phase) {
    case 'down':
      handleDown(batch.changed);
      updatePinch(batch.active, config);
      break;
    case 'move':
      handleMove(batch.changed, batch.active, config);
      updatePinch(batch.active, config);
      break;
    case 'up':
      handleUp(batch.changed, config);
      updatePinch(batch.active, config);
      break;
    case 'cancel':
      handleCancel(batch.changed);
      updatePinch(batch.active, config);
      break;
  }
};

export function subscribeIntents(subscriber: IntentSubscriber) {
  intentSubscribers.add(subscriber);
  return () => {
    intentSubscribers.delete(subscriber);
  };
}

export function startGestureIntent() {
  if (!pointerStop) {
    pointerStop = subscribePointers(ingestBatch);
  }
  return () => {
    pointerStop?.();
    pointerStop = null;
    clearState();
  };
}

export function setGestureConfigForTests(config: GestureConfig) {
  overrideConfig = config;
  currentConfig = config;
  return () => {
    overrideConfig = null;
    currentConfig = storedConfig;
  };
}

export function ingestPointerBatchForTests(batch: PointerBatch) {
  ingestBatch(batch);
}

export function resetGestureStateForTests() {
  clearState();
}
