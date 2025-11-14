import type { MasonryResult, Viewport } from './masonry';

export type GalleryMode = 'photo' | 'film';

export type TileStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type TileState = {
  slug: string;
  status: TileStatus;
  aspect?: number;
  src?: string;
  title?: string;
};

export type GalleryView = {
  translation: { x: number; y: number };
  scale: number;
  minScale: number;
  maxScale: number;
};

export type GalleryState = {
  mode: GalleryMode;
  viewport: Viewport;
  layout: MasonryResult | null;
  view: GalleryView;
  tiles: Record<string, TileState>;
  isInteractive: boolean;
  exitRequested: boolean;
  activeTile: string | null;
};

export const DEFAULT_MAX_ZOOM = 2.5;

export const createGalleryState = (options: { mode: GalleryMode; tiles?: TileState[] }) => {
  const { mode, tiles = [] } = options;
  return {
    mode,
    viewport: { vw: 0, vh: 0 },
    layout: null,
    view: {
      translation: { x: 0, y: 0 },
      scale: 1,
      minScale: 1,
      maxScale: mode === 'photo' ? DEFAULT_MAX_ZOOM : 1
    },
    tiles: tiles.reduce<Record<string, TileState>>((accum, tile) => {
      accum[tile.slug] = tile;
      return accum;
    }, {}),
    isInteractive: false,
    exitRequested: false,
    activeTile: null
  } satisfies GalleryState;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clampTranslation = ({ state, next }: { state: GalleryState; next: { x: number; y: number } }) => {
  if (!state.layout) {
    return next;
  }

  const viewport = state.viewport;
  const scale = state.view.scale;
  const width = state.layout.width * scale;
  const height = state.layout.height * scale;

  const xOverflow = Math.max(0, width - viewport.vw);
  const yOverflow = Math.max(0, height - viewport.vh);

  return {
    x: clamp(next.x, -xOverflow, 0),
    y: clamp(next.y, -yOverflow, 0)
  };
};

export const actions = {
  viewportChanged: (payload: { viewport: Viewport; layout: MasonryResult }) =>
    ({ type: 'viewportChanged', payload } as const),
  pan: (payload: { dx: number; dy: number }) => ({ type: 'pan', payload } as const),
  pinch: (payload: { scale: number; focal: { x: number; y: number } }) =>
    ({ type: 'pinch', payload } as const),
  preload: (payload: { slug: string; status: TileStatus }) =>
    ({ type: 'preload', payload } as const),
  requestExit: () => ({ type: 'exit' } as const),
  resetExit: () => ({ type: 'reset-exit' } as const),
  activate: (payload: { slug: string | null }) => ({ type: 'activate', payload } as const)
};

export type GalleryAction =
  | ReturnType<typeof actions.viewportChanged>
  | ReturnType<typeof actions.pan>
  | ReturnType<typeof actions.pinch>
  | ReturnType<typeof actions.preload>
  | ReturnType<typeof actions.requestExit>
  | ReturnType<typeof actions.resetExit>
  | ReturnType<typeof actions.activate>;

export function reducer(state: GalleryState, action: GalleryAction): GalleryState {
  switch (action.type) {
    case 'viewportChanged': {
      const { viewport, layout } = action.payload;
      const maxScale = state.mode === 'photo' ? state.view.maxScale : 1;
      const scale = state.mode === 'film' ? 1 : state.view.scale;
      const translation = clampTranslation({
        state: { ...state, layout, viewport, view: { ...state.view, scale } },
        next: state.view.translation
      });
      return {
        ...state,
        viewport,
        layout,
        view: {
          ...state.view,
          maxScale,
          scale,
          translation
        }
      };
    }
    case 'pan': {
      const nextTranslation = {
        x: state.view.translation.x + action.payload.dx,
        y: state.view.translation.y + action.payload.dy
      };
      const translation = clampTranslation({ state, next: nextTranslation });
      return {
        ...state,
        view: {
          ...state.view,
          translation
        },
        exitRequested: false
      };
    }
    case 'pinch': {
      if (state.mode === 'film') {
        return { ...state, exitRequested: false };
      }
      const rawScale = state.view.scale * action.payload.scale;
      const scale = clamp(rawScale, state.view.minScale, state.view.maxScale);
      const translation = clampTranslation({
        state: { ...state, view: { ...state.view, scale } },
        next: state.view.translation
      });
      return {
        ...state,
        view: {
          ...state.view,
          scale,
          translation
        },
        exitRequested: scale <= state.view.minScale
      };
    }
    case 'preload': {
      const { slug, status } = action.payload;
      if (!state.tiles[slug]) {
        return state;
      }
      return {
        ...state,
        tiles: {
          ...state.tiles,
          [slug]: {
            ...state.tiles[slug],
            status
          }
        }
      };
    }
    case 'exit': {
      return {
        ...state,
        exitRequested: true,
        view: {
          ...state.view,
          scale: state.mode === 'film' ? 1 : state.view.minScale,
          translation: clampTranslation({
            state: {
              ...state,
              view: { ...state.view, scale: state.view.minScale }
            },
            next: { x: 0, y: 0 }
          })
        }
      };
    }
    case 'reset-exit': {
      return { ...state, exitRequested: false };
    }
    case 'activate': {
      return { ...state, activeTile: action.payload.slug };
    }
    default:
      return state;
  }
}
