# Photo & Film Gallery Engines — Design

## Overview
- Replace the placeholder masonry helper with a viewport-driven generator that respects Utopia gutters and works for both photo and film tiles.
- Introduce a shared gallery reducer powering layout, preload lifecycle, and pan/zoom state (zoom enabled for photos, pan-only for films).
- Wire `PhotoCanvas.svelte` and `FilmCanvas.svelte` to the reducer, gesture intents, and camera zoom toggle so interactions exit cleanly back to the grid.
- Cover layout math and reducer transitions with Vitest, and exercise pinch/keyboard exit plus external link behavior with Playwright.

## Masonry Layout
- New API in `src/lib/galleries/masonry.ts` accepts tile descriptors (slug, aspect ratio) and a viewport override. It computes:
  - Column count via responsive clamps (1–4 columns) derived from `geometry.gutters` and min column width (≈320px) so camera tweaks stay compatible.
  - Column gaps using `geometry.gutters(viewport)` and vertical rhythm from the same helper to stay aligned with the fluid design system.
  - Absolute rects `{ x, y, w, h }` per tile plus total content height used for pan clamping.
- Pure functions → straightforward Vitest coverage at key breakpoints for both photo (landscape mix) and film (poster aspect) tiles.

## State Management
- Shared reducer module `src/lib/galleries/galleryState.ts` shaped around:
  - `layout`: masonry rects + dimensions (recomputed on resize).
  - `tiles`: per-item preload status and intrinsic size metadata.
  - `view`: translation `{ x, y }` and `scale`. Photo reducer allows `scale` in `[1, maxZoom]` with damping; film forces `scale = 1`.
  - Flags: `isInteractive`, `exitRequested`, `activeTile`.
- Actions include `viewportChanged`, `preloadStarted/Finished`, `pointerPan`, `pointerEnd`, `pinchChanged`, `pinchEnd`, `keyboardExit`, `openExternal`.
- Exit logic: when photo scale eases ≤ 1 after a pinch-in or keyboard command, reducer sets `exitRequested=true`; canvases consume it and call `zoomToggle.zoomOut()`.

## Photo Canvas Implementation
- On mount, preload all images via `src/lib/galleries/preload.ts` (simple `Image` objects + Promise). Dispatch progress to reducer; tiles show a shimmer block (`background: linear-gradient(...)` with Utopia spacing tokens for padding) until `loaded=true`.
- Subscribe to pointer batches using existing `pointer.ts` + gesture intents; translate pan deltas into reducer actions, clamp to layout height/width.
- Pinch gestures provide midpoint in screen space → converted to world coordinates for intuitive zoom targeting.
- Render tiles as absolutely positioned divs within a container that mirrors the masonry rects. Apply `transform: translate3d(view.x, view.y, 0) scale(view.scale)` for gallery motion.
- Keyboard fallback: `Escape` or `-` triggers exit action. Reducer ensures idempotency.

## Film Canvas Implementation
- Reuse masonry output (with poster aspect ratios). Same preload + shimmer path.
- Gestures limited to horizontal swipes (advance tile or wrap) and vertical swipe up to exit. Pinch intents ignored so zoom stays at 1.
- Taps invoke `window.open(externalUrl, '_blank', 'noopener')`. If blocked (null return), fall back to `location.assign(externalUrl)`.
- Reducer keeps `exitRequested` for swipe exit and exposes `requestedTile` for camera focus updates.

## Testing Strategy
- **Vitest**
  - `masonry.test.ts`: column selection & rect math across small/medium/large viewports, ensuring deterministic layout.
  - `galleryState.test.ts`: pan clamping, zoom thresholds, exit flagging, preload lifecycle, film no-zoom guard.
- **Playwright**
  - Photo scenario: focus photo row, simulate pinch-out then pinch-in (using two-pointer helper). Assert exit toggles grid focus; fallback run using keyboard sequence to ensure redundancy.
  - Film scenario: tap poster and wait for new page context; if popup blocked, confirm current page URL matches `externalUrl`.

## Integration Points
- `PhotoCanvas.svelte` and `FilmCanvas.svelte` receive `zoomToggle` from grid context to honor exit rules.
- Existing camera store remains source of truth for grid vs. row focus; reducer only handles gallery-local transforms.
- Preload helper hooks into Svelte lifecycle so SSR stays no-op (guards `window` access).

## Open Questions / Risks
- Need to confirm maximum desired zoom for photos; default to 2.5× with ease-out but keep config driven via exported constant.
- Playwright pinch fidelity depends on current gesture utilities; may require helper to dispatch `touchstart/move` events with two pointers.
- Ensure performance is acceptable on low-end devices; may add `requestAnimationFrame` throttling if pan gestures feel heavy.

