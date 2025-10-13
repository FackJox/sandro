// Pointer manager skeleton. Wire up in +layout.svelte interaction layer.

type Listener = (e: PointerEvent) => void;

const state = {
  active: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  startT: 0
};

let onDown: Listener | null = null;
let onMove: Listener | null = null;
let onUp: Listener | null = null;

export function initPointer(el: HTMLElement) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const down = (e: PointerEvent) => {
    state.active = true;
    state.startX = state.lastX = e.clientX;
    state.startY = state.lastY = e.clientY;
    state.startT = performance.now();
    onDown?.(e);
  };
  const move = (e: PointerEvent) => {
    if (!state.active) return;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    onMove?.(e);
  };
  const up = (e: PointerEvent) => {
    if (!state.active) return;
    state.active = false;
    onUp?.(e);
  };
  el.addEventListener('pointerdown', down, { passive: false });
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', up, { passive: false });
  return () => {
    el.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
}

export function setHandlers(handlers: { down?: Listener; move?: Listener; up?: Listener }) {
  onDown = handlers.down ?? null;
  onMove = handlers.move ?? null;
  onUp = handlers.up ?? null;
}
