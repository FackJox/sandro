# Gallery Engines Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver responsive photo and film gallery experiences with shared masonry layout, gesture-aware interactions, and complete automated test coverage.

**Architecture:** Shared TypeScript utilities power viewport-aware layouts and gallery reducers; Svelte canvases subscribe to gesture intents and camera stores, rendering DOM overlays styled with Utopia tokens. Photo gallery enables pinch zoom with exit-to-grid detection, while film gallery reuses layout but enforces tap-to-open external URLs and pan-only navigation.

**Tech Stack:** SvelteKit, Threlte, TypeScript, Vitest, Playwright, Utopia fluid design tokens, existing pointer/gesture stores.

---

### Task 1: Masonry Layout Utility

**Files:**
- Modify: `src/lib/galleries/masonry.ts`
- Create: `src/lib/galleries/masonry.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/galleries/masonry.test.ts
import { describe, expect, it } from 'vitest';
import { masonry } from './masonry';

describe('masonry', () => {
  it('uses single column for narrow viewports', () => {
    const rects = masonry({
      items: [{ slug: 'a', aspect: 4 / 3 }, { slug: 'b', aspect: 3 / 4 }],
      viewport: { vw: 360, vh: 800 },
      gap: 16,
      minColumnWidth: 320,
      maxColumns: 4
    });
    expect(rects.columns).toBe(1);
    expect(rects.tiles[0]).toMatchObject({ x: 0, y: 0 });
    expect(rects.tiles[1].y).toBeGreaterThan(rects.tiles[0].h);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/galleries/masonry.test.ts`
Expected: FAIL (module missing / incorrect output)

**Step 3: Write minimal implementation**

```ts
// src/lib/galleries/masonry.ts
export type MasonryInput = { items: { slug: string; aspect: number }[]; viewport: { vw: number; vh: number }; gap: number; minColumnWidth: number; maxColumns: number };
export type MasonryResult = { columns: number; width: number; height: number; tiles: Rect[] };

export function masonry(config: MasonryInput): MasonryResult {
  // compute columns by clamping viewport width / minColumnWidth between 1 and maxColumns
  // use gutter gap for spacing, scale tile height via tileWidth / aspect
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/galleries/masonry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/galleries/masonry.ts src/lib/galleries/masonry.test.ts
git commit -m "feat: add responsive masonry layout utility"
```

---

### Task 2: Gallery Reducer & Preload State

**Files:**
- Create: `src/lib/galleries/galleryState.ts`
- Create: `src/lib/galleries/galleryState.test.ts`
- Create: `src/lib/galleries/preload.ts`

**Step 1: Write the failing test**

```ts
// src/lib/galleries/galleryState.test.ts
import { describe, expect, it } from 'vitest';
import { createGalleryState, reducer, actions } from './galleryState';

describe('gallery reducer', () => {
  it('clamps pan within layout bounds', () => {
    const state = createGalleryState({ mode: 'photo' });
    const layout = { width: 1200, height: 2400, columns: 2 };
    const next = reducer(state, actions.viewportChanged({ viewport: { vw: 1024, vh: 768 }, layout }));
    const clamped = reducer(next, actions.pan({ dx: -9999, dy: -9999 }));
    expect(clamped.view.translation.x).toBeGreaterThanOrEqual(layout.width * -1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/galleries/galleryState.test.ts`
Expected: FAIL (module missing / logic incomplete)

**Step 3: Write minimal implementation**

```ts
// src/lib/galleries/galleryState.ts
export type GalleryMode = 'photo' | 'film';
export const createGalleryState = (options: { mode: GalleryMode }) => ({ ... });
export const actions = {
  viewportChanged: (payload: { viewport: { vw: number; vh: number }; layout: MasonryResult }) => ({ type: 'viewportChanged', payload }),
  pan: (payload: { dx: number; dy: number }) => ({ type: 'pan', payload }),
  pinch: (payload: { scale: number; focal: { x: number; y: number } }) => ({ type: 'pinch', payload }),
  preload: (payload: { slug: string; status: 'start' | 'success' | 'error' }) => ({ type: 'preload', payload }),
  requestExit: () => ({ type: 'exit' })
} as const;

export function reducer(state: GalleryState, action: GalleryAction): GalleryState {
  // ensure pan clamps to layout dimensions and photo mode handles zoom/exit flags; film mode enforces scale=1.
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/galleries/galleryState.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/galleries/galleryState.ts src/lib/galleries/galleryState.test.ts src/lib/galleries/preload.ts
git commit -m "feat: add gallery reducer with preload support"
```

---

### Task 3: Photo Canvas Integration

**Files:**
- Modify: `src/lib/galleries/PhotoCanvas.svelte`
- Create: `src/lib/galleries/PhotoCanvas.test.ts`
- Modify: `src/lib/galleries/masonry.test.ts` (add photo-specific cases if needed)

**Step 1: Write the failing test**

```ts
// src/lib/galleries/PhotoCanvas.test.ts
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PhotoCanvas from './PhotoCanvas.svelte';

describe('PhotoCanvas', () => {
  it('shows shimmer until image loads and exits on Escape', async () => {
    const row = { /* minimal photo row stub */ };
    const zoomOut = vi.fn();
    render(PhotoCanvas, { row, zoomToggle: { zoomOut, restore: vi.fn(), toggle: vi.fn(), getState: vi.fn() } });
    expect(screen.getAllByTestId('gallery-tile-skeleton').length).toBeGreaterThan(0);
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(zoomOut).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/galleries/PhotoCanvas.test.ts`
Expected: FAIL (component incomplete)

**Step 3: Write minimal implementation**

```svelte
<!-- src/lib/galleries/PhotoCanvas.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Canvas, T } from '@threlte/core';
  import { createGalleryState, actions, reducer } from './galleryState';
  // subscribe to pointer + intent stores, compute masonry, preload images, render shimmer placeholders until loaded
</script>

<div class="gallery" on:keydown={handleKeyDown}>
  <Canvas>...</Canvas>
  <div class="tiles" style={tileTransform}>
    {#each state.tiles as tile}
      <div data-testid={tile.loaded ? 'gallery-tile' : 'gallery-tile-skeleton'} style={tile.style}>
        {#if tile.loaded}<img src={tile.src} alt={tile.title} />{/if}
      </div>
    {/each}
  </div>
</div>
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/galleries/PhotoCanvas.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/galleries/PhotoCanvas.svelte src/lib/galleries/PhotoCanvas.test.ts
git commit -m "feat: integrate photo gallery canvas with state + shimmer"
```

---

### Task 4: Film Canvas Integration

**Files:**
- Modify: `src/lib/galleries/FilmCanvas.svelte`
- Create: `src/lib/galleries/FilmCanvas.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/galleries/FilmCanvas.test.ts
import { fireEvent, render } from '@testing-library/svelte';
import FilmCanvas from './FilmCanvas.svelte';
import { vi } from 'vitest';

it('opens external url on tap and blocks pinch zoom', async () => {
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  const row = { /* minimal film row */ };
  render(FilmCanvas, { row, zoomToggle: { zoomOut: vi.fn(), restore: vi.fn(), toggle: vi.fn(), getState: vi.fn() } });
  await fireEvent.click(document.querySelector('[data-tile="brand-film-x"]')!);
  expect(open).toHaveBeenCalledWith(expect.stringContaining('vimeo'), '_blank', 'noopener');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/galleries/FilmCanvas.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```svelte
<!-- src/lib/galleries/FilmCanvas.svelte -->
<script lang="ts">
  import { createGalleryState, actions } from './galleryState';
  const handleTileClick = (item) => {
    const popup = window.open(item.externalUrl, '_blank', 'noopener');
    if (!popup) window.location.assign(item.externalUrl);
  };
  // swallow pinch intents, reuse masonry renderer, vertical swipe triggers zoomToggle.zoomOut()
</script>
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/galleries/FilmCanvas.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/galleries/FilmCanvas.svelte src/lib/galleries/FilmCanvas.test.ts
git commit -m "feat: implement film gallery canvas with external links"
```

---

### Task 5: Playwright Coverage

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`
- Modify/Create: `tests/e2e/gallery-photo.spec.ts`, `tests/e2e/gallery-film.spec.ts`

**Step 1: Write the failing test**

```ts
// tests/e2e/gallery-photo.spec.ts
import { expect, test } from '@playwright/test';

test('photo gallery pinch exits back to grid', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /photo/i }).click();
  await page.waitForSelector('[data-gallery="photo"]');
  await page.dispatchEvent('[data-gallery="photo"]', 'pointerdown', { /* multi-touch helper */ });
  // pinch out then pinch in helper; fallback to Escape
  await expect(page.locator('[data-focus="grid"]')).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm playwright test tests/e2e/gallery-photo.spec.ts`
Expected: FAIL (file missing / assertions fail)

**Step 3: Write minimal implementation**

```ts
// tests/e2e/utils/gestures.ts (if needed) - helper for pinch
// tests/e2e/gallery-film.spec.ts - open poster and assert new context or navigation
```

**Step 4: Run full suites**

Run unit: `pnpm vitest run`
Run e2e: `pnpm playwright test`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/e2e/*.spec.ts src/lib/galleries/*
git commit -m "test: cover gallery pinch and external navigation"
```

---

### Task 6: Cleanup & Docs

**Files:**
- Modify: `docs/plans/2025-11-04-gallery-engines-design.md` (append implementation notes if needed)
- Update: any new READMEs or changelog entries if project expects it

**Step 1: Review design doc alignment**
- Ensure implementation matches design decisions; note deviations.

**Step 2: Final verification**

Run: `pnpm lint` (if available), `pnpm vitest run`, `pnpm playwright test`
Expected: PASS

**Step 3: Commit**

```bash
git add docs/plans/2025-11-04-gallery-engines-design.md
git commit -m "docs: align gallery design with implementation details"
```

---

Plan complete and saved to `docs/plans/2025-11-04-gallery-engines-plan.md`. Two execution options:

1. Subagent-Driven (this session) — I dispatch a fresh subagent per task with reviews between steps for rapid feedback.
2. Parallel Session (separate) — Open a new session in this worktree, run superpowers:executing-plans, and execute tasks in batches with checkpoints.

Which approach would you like to use?

