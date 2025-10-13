import { writable } from 'svelte/store';

export type GestureConfig = {
  tap: { maxMovePx: number; maxMs: number };
  swipe: { minTravelPx: number; minVelocityPxMs: number; axisLockPx: number; dominance: number };
  pinch: { commitDelta: number };
  photo: { exitMinDelta: number };
};

export const defaultGestures: GestureConfig = {
  tap: { maxMovePx: 8, maxMs: 220 },
  swipe: { minTravelPx: 48, minVelocityPxMs: 0.2, axisLockPx: 12, dominance: 1.5 },
  pinch: { commitDelta: 0.08 },
  photo: { exitMinDelta: 0.06 }
};

export const gestures = writable<GestureConfig>(defaultGestures);

