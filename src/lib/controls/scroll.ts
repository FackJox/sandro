import type { ZoomToggleController } from './zoom-toggle';

const DESKTOP_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

const isDesktopPointer = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }

  try {
    const query = window.matchMedia(DESKTOP_POINTER_QUERY);
    return query.matches;
  } catch (error) {
    console.warn('SWIPEDEBUG failed to evaluate pointer media query', error);
    return true;
  }
};

const hasScrollableAncestor = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;

  for (let el: Element | null = target; el; el = el.parentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const overflow = style.overflow;
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll') &&
      el.scrollHeight > el.clientHeight;
    if (canScroll) return true;
  }

  return false;
};

export function initScroll(el: HTMLElement, toggle: ZoomToggleController) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  let desktopPointer = isDesktopPointer();

  let disposeMediaQuery: (() => void) | null = null;
  if (typeof window.matchMedia === 'function') {
    const pointerQuery = window.matchMedia(DESKTOP_POINTER_QUERY);
    const onPointerChange = (event: MediaQueryListEvent) => {
      desktopPointer = event.matches;
    };
    pointerQuery.addEventListener('change', onPointerChange);
    disposeMediaQuery = () => {
      pointerQuery.removeEventListener('change', onPointerChange);
    };
  }

  const handleWheel = (event: WheelEvent) => {
    const state = toggle.getState();
    const { deltaX, deltaY } = event;
    console.log('SWIPEDEBUG wheel event', {
      deltaX,
      deltaY,
      focusKind: state.currentFocus.kind,
      transitionPending: state.transitionPending,
      zoomOutPending: state.zoomOutPending
    });
    if (!desktopPointer) {
      console.log('SWIPEDEBUG ignored: pointer is not fine/hover');
      return;
    }
    if (event.defaultPrevented) {
      console.log('SWIPEDEBUG ignored: event already prevented');
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      console.log('SWIPEDEBUG ignored: ctrl/meta modifier detected');
      return;
    }
    if (Math.abs(deltaY) < Math.abs(deltaX)) {
      console.log('SWIPEDEBUG ignored: horizontal movement dominant');
      return;
    }
    if (Math.abs(deltaY) < 4) {
      console.log('SWIPEDEBUG ignored: delta too small');
      return;
    }
    if (hasScrollableAncestor(event.target)) {
      console.log('SWIPEDEBUG ignored: scrollable ancestor detected');
      return;
    }

    const direction = deltaY < 0 ? 'up' : 'down';

    if (direction === 'up') {
      if (state.currentFocus.kind === 'grid') {
        console.log('SWIPEDEBUG ignored: already in grid while scrolling up');
        return;
      }
      console.log('SWIPEDEBUG scroll request -> zoomOut');
      toggle.zoomOut();
    } else {
      if (state.currentFocus.kind !== 'grid') {
        console.log('SWIPEDEBUG ignored: not in grid while scrolling down');
        return;
      }
      console.log('SWIPEDEBUG scroll request -> restore');
      toggle.restore();
    }
  };

  el.addEventListener('wheel', handleWheel, { passive: true });

  return () => {
    el.removeEventListener('wheel', handleWheel);
    disposeMediaQuery?.();
  };
}
