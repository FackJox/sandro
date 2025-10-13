import { api } from '$lib/stores/camera';

export function initShortcuts() {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      api.zoomOutToGrid();
    }
    // Left/Right/Up/Down behavior to be wired with camera + content index.
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

