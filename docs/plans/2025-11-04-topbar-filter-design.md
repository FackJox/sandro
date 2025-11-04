Title: Top Bar Filter for Grid
Date: 2025-11-04

Summary
- Add a persistent top bar with a dropdown to filter the grid to: All, Video, Photo, Content.
- Filtering hides non-matching rows while preserving original row indices to keep camera transforms consistent.

Categories
- all: show every row
- video: show rows of type filmGallery and showreel
- photo: show rows of type photoGallery
- content: show rows of type about, services, contact

Design Decisions
- Do not reindex rows on filter. Instead, keep all rows in the DOM and toggle visibility with CSS (`display: none`) to avoid desynchronizing with the camera’s internal grid mapping.
- Place the top bar inside Grid.svelte but outside the transformed stack so it stays fixed in the viewport.
- Lower z-index (15) keeps contact CTA (z-index: 20) clickable above the bar.
- On filter change, zoom out to grid for an intuitive reset state.

Implementation
- Store: `filterCategory` added to `src/lib/stores/ui.ts` with union type: 'all' | 'video' | 'photo' | 'content'.
- UI: `src/lib/components/Grid.svelte` renders a `<select>` to control the store and applies visibility per-row based on the selected category.

Future Adjustments
- If needed, expand categories or change groupings by editing `shouldShowRow` in `Grid.svelte`.
- Consider query-param syncing for sharing filtered views.
