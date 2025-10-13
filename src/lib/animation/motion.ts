import { writable } from 'svelte/store';

export type MotionConfig = {
  zoomIn: { duration: number; ease: string };
  zoomOut: { duration: number; ease: string };
  verticalChange: {
    zoomOut: number;
    pan: number;
    zoomIn: number;
    overlap: number;
    ease: string;
  };
  horizontalChange: { duration: number; ease: string };
  backExit: { duration: number; ease: string };
};

export const defaultMotion: MotionConfig = {
  zoomIn: { duration: 0.42, ease: 'power2.inOut' },
  zoomOut: { duration: 0.32, ease: 'power2.inOut' },
  verticalChange: {
    zoomOut: 0.26,
    pan: 0.36,
    zoomIn: 0.26,
    overlap: 0.06,
    ease: 'power2.inOut'
  },
  horizontalChange: { duration: 0.38, ease: 'power2.out' },
  backExit: { duration: 0.28, ease: 'power3.out' }
};

export const motion = writable<MotionConfig>(defaultMotion);

