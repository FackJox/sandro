import { get } from 'svelte/store';

import { api, focus } from '$lib/stores/camera';
import type { FocusState } from '$lib/stores/camera';

type ToggleAction = 'zoomOut' | 'restore';

export type ZoomToggleState = {
  currentFocus: FocusState;
  lastNonGridFocus: FocusState | null;
  transitionPending: boolean;
  zoomOutPending: boolean;
};

export type ZoomToggleController = {
  toggle: () => void;
  zoomOut: () => void;
  restore: () => void;
  getState: () => ZoomToggleState;
  dispose: () => void;
};

const cloneFocus = (state: FocusState): FocusState => {
  if (state.kind === 'grid') {
    return { kind: 'grid' };
  }
  if (state.kind === 'row') {
    return {
      kind: 'row',
      rowSlug: state.rowSlug,
      tileIndex: state.tileIndex
    };
  }
  return {
    kind: 'tile',
    rowSlug: state.rowSlug,
    tileSlug: state.tileSlug,
    tileIndex: state.tileIndex
  };
};

const focusFromBookmark = (target: FocusState) => {
  switch (target.kind) {
    case 'row':
      return api.focusRow(target.rowSlug, target.tileIndex);
    case 'tile':
      return api.focusTile(target.rowSlug, target.tileSlug, target.tileIndex);
    default:
      return Promise.resolve();
  }
};

export const createZoomToggle = (): ZoomToggleController => {
  let currentFocus = get(focus);
  let lastNonGridFocus: FocusState | null =
    currentFocus.kind === 'grid' ? null : cloneFocus(currentFocus);
  let transitionPending = false;
  let zoomOutPending = false;
  let cooldownUntil = 0;
  const COOLDOWN_MS = 250;

  const focusUnsubscribe = focus.subscribe(($focus) => {
    currentFocus = $focus;
    if ($focus.kind !== 'grid') {
      lastNonGridFocus = cloneFocus($focus);
    }
  });

  const finish = (action: ToggleAction) => {
    transitionPending = false;
    if (action === 'zoomOut') {
      zoomOutPending = false;
    }
  };

  const run = (action: ToggleAction) => {
    if (action === 'zoomOut') {
      if (currentFocus.kind === 'grid') {
        console.log('SWIPEDEBUG zoomOut ignored: already grid');
        return;
      }
      const bookmark = cloneFocus(currentFocus);
      lastNonGridFocus = bookmark;
      transitionPending = true;
      zoomOutPending = true;
      console.log('SWIPEDEBUG zoomOut issued', bookmark);
      void api
        .zoomOutToGrid()
        .then(() => {
          console.log('SWIPEDEBUG zoomOut complete');
        })
        .catch((error) => {
          console.error('SWIPEDEBUG zoomOut error', error);
        })
        .finally(() => {
          const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
          cooldownUntil = now + COOLDOWN_MS;
          finish('zoomOut');
        });
      return;
    }

    if (!lastNonGridFocus || lastNonGridFocus.kind === 'grid') {
      console.log('SWIPEDEBUG restore ignored: no bookmark');
      return;
    }

    const target = cloneFocus(lastNonGridFocus);
    transitionPending = true;
    console.log('SWIPEDEBUG restore issued', target);
    void focusFromBookmark(target)
      .then(() => {
        console.log('SWIPEDEBUG restore complete', target);
      })
      .catch((error) => {
        console.error('SWIPEDEBUG restore error', error);
      })
      .finally(() => {
        finish('restore');
      });
  };

  const queueOrRunToggle = (action: ToggleAction) => {
    if (transitionPending) {
      console.log('SWIPEDEBUG toggle ignored: transition pending');
      return;
    }
    run(action);
  };

  const queueOrRunExplicit = (action: ToggleAction) => {
    if (transitionPending) {
      console.log('SWIPEDEBUG explicit action ignored: transition pending', action);
      return;
    }
    if (action === 'restore' && zoomOutPending) {
      console.log('SWIPEDEBUG restore ignored: awaiting zoomOut completion');
      return;
    }
    if (action === 'restore') {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now < cooldownUntil) {
        console.log('SWIPEDEBUG restore ignored: cooldown active');
        return;
      }
    }
    run(action);
  };

  const toggle = () => {
    const action: ToggleAction = currentFocus.kind === 'grid' ? 'restore' : 'zoomOut';
    console.log('SWIPEDEBUG toggle requested', {
      action,
      focusKind: currentFocus.kind,
      transitionPending,
      hasBookmark: !!lastNonGridFocus,
      zoomOutPending
    });
    if (action === 'zoomOut') {
      queueOrRunToggle(action);
    } else {
      queueOrRunExplicit(action);
    }
  };

  const zoomOut = () => queueOrRunExplicit('zoomOut');
  const restore = () => queueOrRunExplicit('restore');

  const dispose = () => {
    focusUnsubscribe();
  };

  const getState = (): ZoomToggleState => ({
    currentFocus,
    lastNonGridFocus: lastNonGridFocus ? cloneFocus(lastNonGridFocus) : null,
    transitionPending,
    zoomOutPending
  });

  return {
    toggle,
    zoomOut,
    restore,
    getState,
    dispose
  };
};
