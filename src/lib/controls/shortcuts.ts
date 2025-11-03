import { get } from 'svelte/store';
import { api, focus } from '$lib/stores/camera';
import { rows, type Row } from '$lib/content';
import {
  commandFromFocus,
  commandsEqual,
  type CameraCommand,
  type FocusState
} from '$lib/stores/camera-controller';

const GRID_COLUMNS = 1;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type GalleryRow = Extract<Row, { type: 'photoGallery' | 'filmGallery' | 'about' }>;

const galleryTypes = new Set<GalleryRow['type']>(['photoGallery', 'filmGallery', 'about']);

const getRowIndex = (slug: string) => rows.findIndex((row) => row.slug === slug);
const getRowByIndex = (index: number) => rows[index] ?? null;

const getDefaultRowIndex = () => {
  const heroIndex = rows.findIndex((row) => row.type === 'hero');
  return heroIndex >= 0 ? heroIndex : rows.length > 0 ? 0 : -1;
};

const getGalleryItems = (row: Row): { slug: string }[] => {
  if (galleryTypes.has(row.type as GalleryRow['type'])) {
    const gallery = row as GalleryRow;
    return gallery.items ?? [];
  }
  return [];
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.getAttribute('role') === 'textbox'
  );
};

const clampIndex = (index: number, min: number, max: number) =>
  Math.max(min, Math.min(max, index));

const computeRowCommand = (current: FocusState, delta: number, fallbackIndex: number) => {
  const baseSlug =
    current.kind === 'row' || current.kind === 'tile'
      ? current.rowSlug
      : rows[fallbackIndex]?.slug;
  if (!baseSlug) return null;

  const currentIndex = getRowIndex(baseSlug);
  if (currentIndex === -1) return null;

  const nextIndex = clampIndex(currentIndex + delta, 0, rows.length - 1);
  if (nextIndex === currentIndex) return null;

  const nextRow = getRowByIndex(nextIndex);
  if (!nextRow) return null;

  return {
    command: { type: 'focusRow', rowSlug: nextRow.slug } satisfies CameraCommand,
    nextIndex
  };
};

const computeTileCommand = (
  focusState: Extract<FocusState, { kind: 'tile' | 'row' }>,
  direction: -1 | 1
):
  | { command: CameraCommand; nextIndex?: number; nextTileIndex?: number }
  | null => {
  const rowIndex = getRowIndex(focusState.rowSlug);
  if (rowIndex === -1) return null;
  const row = rows[rowIndex];
  const tiles = getGalleryItems(row);
  if (tiles.length === 0) return null;

  const currentTileIndex = focusState.tileIndex ?? 0;
  const nextTileIndex = currentTileIndex + direction;

  if (nextTileIndex < 0) {
    return {
      command: {
        type: 'focusRow',
        rowSlug: focusState.rowSlug,
        tileIndex: clampIndex(currentTileIndex, 0, tiles.length - 1)
      },
      nextIndex: rowIndex
    };
  }

  if (nextTileIndex >= tiles.length) {
    return null;
  }

  const tileSlug = tiles[nextTileIndex]?.slug;
  if (!tileSlug) {
    return null;
  }

  return {
    command: {
      type: 'focusTile',
      rowSlug: focusState.rowSlug,
      tileSlug,
      tileIndex: nextTileIndex
    },
    nextIndex: rowIndex,
    nextTileIndex
  };
};

const handleEnter = (
  current: FocusState,
  fallbackIndex: number
): { command: CameraCommand; nextIndex?: number } | null => {
  if (current.kind === 'grid') {
    const row = rows[fallbackIndex] ?? rows[0];
    if (!row) return null;
    return {
      command: { type: 'focusRow', rowSlug: row.slug },
      nextIndex: getRowIndex(row.slug)
    };
  }

  if (current.kind === 'row') {
    const rowIndex = getRowIndex(current.rowSlug);
    if (rowIndex === -1) return null;
    const row = rows[rowIndex];
    const tiles = getGalleryItems(row);
    if (tiles.length === 0) return null;
    const tileIndex = clampIndex(current.tileIndex ?? 0, 0, tiles.length - 1);
    const tileSlug = tiles[tileIndex]?.slug ?? tiles[0]?.slug;
    if (!tileSlug) return null;
    return {
      command: {
        type: 'focusTile',
        rowSlug: current.rowSlug,
        tileSlug,
        tileIndex
      },
      nextIndex: rowIndex
    };
  }

  return null;
};

const handleEscape = (current: FocusState): { command: CameraCommand } | null => {
  if (current.kind === 'tile') {
    return {
      command: {
        type: 'focusRow',
        rowSlug: current.rowSlug,
        tileIndex: current.tileIndex
      }
    };
  }
  if (current.kind === 'row') {
    return { command: { type: 'zoomOutToGrid' } };
  }

  return null;
};

const shouldSkipEvent = (event: KeyboardEvent) => {
  if (event.defaultPrevented) return true;
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  if (isEditableTarget(event.target)) return true;
  return false;
};

export function initShortcuts() {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  let currentFocus = get(focus);
  let lastRowIndex =
    currentFocus.kind === 'row' || currentFocus.kind === 'tile'
      ? getRowIndex(currentFocus.rowSlug)
      : getDefaultRowIndex();
  if (lastRowIndex < 0) lastRowIndex = 0;

  let lastIssued: CameraCommand | null = null;

  let prefersReducedMotion = false;
  let detachMotion: (() => void) | null = null;

  if (typeof window.matchMedia === 'function') {
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    prefersReducedMotion = motionQuery.matches;
    const onMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
    };
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', onMotionChange);
      detachMotion = () => motionQuery.removeEventListener('change', onMotionChange);
    } else if (typeof motionQuery.addListener === 'function') {
      motionQuery.addListener(onMotionChange);
      detachMotion = () => motionQuery.removeListener(onMotionChange);
    }
  }

  const updateFromFocus = (next: FocusState) => {
    currentFocus = next;
    if (next.kind === 'row' || next.kind === 'tile') {
      const idx = getRowIndex(next.rowSlug);
      if (idx !== -1) {
        lastRowIndex = idx;
      }
    }
    if (lastIssued) {
      const nextCommand = commandFromFocus(next);
      if (commandsEqual(nextCommand, lastIssued)) {
        lastIssued = null;
      }
    }
  };

  const unsubscribeFocus = focus.subscribe(updateFromFocus);

  const issueCommand = (command: CameraCommand, reduce: boolean) => {
    switch (command.type) {
      case 'zoomOutToGrid':
        void api.zoomOutToGrid();
        break;
      case 'focusRow':
        void api.focusRow(command.rowSlug, command.tileIndex);
        break;
      case 'focusTile':
        void api.focusTile(command.rowSlug, command.tileSlug, command.tileIndex);
        break;
    }
    if (reduce) {
      lastIssued = null;
    }
  };

  const onKey = (event: KeyboardEvent) => {
    if (shouldSkipEvent(event)) return;

    const key = event.key;
    let result: { command: CameraCommand; nextIndex?: number; nextTileIndex?: number } | null =
      null;

    switch (key) {
      case 'Escape':
      case 'Backspace':
        result = handleEscape(currentFocus);
        break;
      case 'Enter':
        result = handleEnter(currentFocus, lastRowIndex);
        break;
      case 'ArrowDown':
        result = computeRowCommand(currentFocus, GRID_COLUMNS, lastRowIndex);
        break;
      case 'ArrowUp':
        result = computeRowCommand(currentFocus, -GRID_COLUMNS, lastRowIndex);
        break;
      case 'ArrowLeft':
        if (currentFocus.kind === 'tile' || currentFocus.kind === 'row') {
          result = computeTileCommand(
            currentFocus as Extract<FocusState, { kind: 'tile' | 'row' }>,
            -1
          );
        }
        if (!result) {
          result = computeRowCommand(currentFocus, -1, lastRowIndex);
        }
        break;
      case 'ArrowRight':
        if (currentFocus.kind === 'tile' || currentFocus.kind === 'row') {
          result = computeTileCommand(
            currentFocus as Extract<FocusState, { kind: 'tile' | 'row' }>,
            1
          );
        }
        if (!result) {
          result = computeRowCommand(currentFocus, 1, lastRowIndex);
        }
        break;
      default:
        return;
    }

    if (!result) return;

    const { command, nextIndex } = result;
    const reduce = prefersReducedMotion;

    const currentCommand = commandFromFocus(currentFocus);
    if (commandsEqual(currentCommand, command)) {
      return;
    }
    if (!reduce && lastIssued && commandsEqual(lastIssued, command)) {
      return;
    }

    if (typeof nextIndex === 'number' && nextIndex >= 0) {
      lastRowIndex = nextIndex;
    } else if (command.type === 'focusTile') {
      const idx = getRowIndex(command.rowSlug);
      if (idx !== -1) {
        lastRowIndex = idx;
      }
    }

    lastIssued = command;
    event.preventDefault();
    issueCommand(command, reduce);
  };

  window.addEventListener('keydown', onKey);

  return () => {
    window.removeEventListener('keydown', onKey);
    unsubscribeFocus();
    detachMotion?.();
  };
}
