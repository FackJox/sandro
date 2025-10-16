import {
  startGestureIntent,
  subscribeIntents,
  type GestureIntent,
  type SwipeIntent
} from '$lib/gestures/intent';
import type { ZoomToggleController } from './zoom-toggle';

const isSwipeUpIntent = (intent: SwipeIntent) => {
  if (intent.axis !== 'y' || intent.direction !== 'up') return false;
  return intent.pointerType === 'touch' || intent.pointerType === 'pen';
};

export function initGestures(_root: HTMLElement | null, toggle: ZoomToggleController) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const stopGestures = startGestureIntent();

  const handleSwipe = (intent: SwipeIntent) => {
    if (!isSwipeUpIntent(intent)) return;
    const state = toggle.getState();
    console.log('SWIPEDEBUG swipe intent received', {
      focusKind: state.currentFocus.kind,
      transitionPending: state.transitionPending,
      hasBookmark: !!state.lastNonGridFocus,
      zoomOutPending: state.zoomOutPending
    });
    toggle.toggle();
  };

  const handleIntent = (intent: GestureIntent) => {
    if (intent.type === 'swipe') {
      handleSwipe(intent);
    }
  };

  const unsubscribeIntents = subscribeIntents(handleIntent);

  return () => {
    unsubscribeIntents?.();
    stopGestures?.();
  };
}
