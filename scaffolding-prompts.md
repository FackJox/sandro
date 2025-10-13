# Sandro Portfolio — Implementation Scaffolding & Prompt Plan

## Current Snapshot
- package.json:7 exposes only dev/build/preview/check scripts; there is no testing or linting pipeline yet.
- src/lib/stores/camera.ts:9 keeps the camera/focus stores static with placeholder api commands and no animation or viewport math.
- src/routes/+layout.svelte:12 subscribes to page data and calls the placeholder camera api without awaiting transitions or managing browser history.
- src/lib/controls/pointer.ts:18 wires basic pointerdown/move/up handlers but does not produce gesture intents or support multi-pointer gestures.
- src/lib/controls/shortcuts.ts:5 handles only Escape/Backspace, leaving arrow/enter flows and reduced-motion logic unimplemented.
- src/lib/components/Grid.svelte:52 renders rows in a fixed 100vh stack and depends on the static camera store, so transforms never change.
- src/lib/galleries/PhotoCanvas.svelte:1 and src/lib/galleries/FilmCanvas.svelte:1 mount empty Threlte scenes without masonry layout, preloading, or interaction hand-off.
- src/lib/galleries/masonry.ts:5 contains a placeholder algorithm with fixed aspect ratios and no viewport awareness.
- src/lib/rows/HeroRow.svelte:1 and related row components rely on the generic Tile placeholder, leaving bespoke copy, media, and CTA behavior undone.
- src/lib/animation/motion.ts:1 and src/lib/gestures/config.ts:6 define configuration stores that are not yet consumed by runtime logic.

## Blueprint — Detailed Step-by-Step
1. **Establish automated testing & QA guardrails.** Add Vitest and Playwright configs, scripts, and baseline smoke tests so regressions surface before feature work, touching package.json, tsconfig.json, and new test suites.
2. **Harden content data contracts.** Parse `src/lib/content/content.json` through a schema, export narrow helpers in src/lib/content/index.ts:1, and cover loaders in src/routes/[row]/+page.ts:1, src/routes/photo/[slug]/+page.ts:1, and src/routes/film/[slug]/+page.ts:1 with tests.
3. **Finalize responsive geometry & tokens.** Expand src/lib/config/geometry.ts:1 and src/lib/utils/coords.ts:1 to compute clamps, gutters, and tile transforms from the viewport, aligning with Utopia tokens and adding unit coverage.
4. **Author the camera state machine.** Replace the placeholder api in src/lib/stores/camera.ts:9 with deterministic focus transitions, queuing, and derived viewport targets that can be animated, covered by pure unit tests.
5. **Animate camera & sync visual layers.** Use GSAP timelines (backed by src/lib/animation/motion.ts:1) to drive DOM transforms in src/lib/components/Grid.svelte:52 and align the Threlte cameras in PhotoCanvas/FilmCanvas, adding integration tests.
6. **Implement routing/history orchestrator & CTA behavior.** Update src/routes/+layout.svelte:12 to await animations, manage pushState/back flows, and expose a store for the Contact CTA so grid-only affordances stay in sync with navigation tests.
7. **Build pointer tracking foundation.** Extend src/lib/controls/pointer.ts:18 to track multiple contacts, velocity, and deltas, emitting structured events for gesture detection with comprehensive unit tests.
8. **Construct gesture classification.** Create a classifier (using src/lib/gestures/config.ts:6 thresholds) that yields tap/swipe/pinch intents and exposes subscriptions for layout use, covered by deterministic tests.
9. **Wire gestures & keyboard inputs to navigation.** Connect the classifier to camera commands, coordinate with keyboard shortcuts in src/lib/controls/shortcuts.ts:5, and ensure focus hand-off respects reduced-motion preferences via integration tests.
10. **Flesh out row experiences & CTA toggles.** Implement bespoke layouts for About, Showreel, Services, and Contact rows in src/lib/rows/*.svelte, ensuring the CTA visibility store maps to grid vs. focus state with component tests.
11. **Ship the photo gallery engine.** Implement responsive masonry in src/lib/galleries/masonry.ts:5, add pan/zoom/pinch in PhotoCanvas.svelte, preload assets, and provide unit plus Playwright coverage for pinch flows.
12. **Ship the film gallery engine.** Reuse shared utilities for poster layouts in FilmCanvas.svelte, add pan-only navigation and external link handling, and test pointer routing plus new-tab fallbacks.
13. **Add persistence, prefetching, and performance polish.** Cache focus state, prefetch assets, support reduced-motion/orientation changes, instrument transitions with performance marks, and document manual QA.

## Iteration 1 — Chunked Roadmap
- **Foundation & Data Integrity:** Steps 1-2 ensure tooling, schema validation, and loader safety are in place.
- **Geometry & Camera Core:** Steps 3-5 deliver accurate viewport math, a deterministic camera brain, and animated transforms.
- **Navigation & Input Surface:** Steps 6-9 wire routing, CTA state, pointer tracking, gestures, and keyboard parity.
- **Row Experiences:** Step 10 realizes the bespoke DOM rows before bringing galleries online.
- **Photo Gallery Delivery:** Step 11 focuses on the photo-specific 2D experience.
- **Film & Polish:** Steps 12-13 land the film gallery and wrap with persistence, performance, and QA documentation.

## Iteration 2 — Right-Sized Task Queue
1. Install and configure Vitest/Playwright, add scripts, and create baseline tests that exercise `content.json` validity plus route loader smoke cases; run `yarn test:unit` and `yarn test:e2e` to confirm the harness.
2. Introduce a schema (e.g., zod) for `content.json`, update `src/lib/content/index.ts` to parse with runtime validation, expose typed helpers, and expand tests to cover valid/invalid lookups.
3. Extend `src/lib/config/geometry.ts` and `src/lib/utils/coords.ts` with viewport-derived clamps, gutter math, and helper functions, then add Vitest specs covering edge viewports and SSR fallbacks.
4. Build a pure camera state module that emits target transforms and focus data, refactoring `src/lib/stores/camera.ts` to use it and adding deterministic unit tests for grid → row → tile flows and queuing.
5. Integrate GSAP timelines that drive the camera store and DOM transform binding, sync the Threlte orthographic cameras, and add integration tests that spy on animation completion.
6. Update `src/routes/+layout.svelte` to await camera commands, coordinate pushState/back, and expose a CTA visibility store; author Playwright specs for navigating `/`, `/contact`, `/photo/<slug>`, and history.
7. Enhance `src/lib/controls/pointer.ts` to manage multi-pointer sessions, velocity, and axis lock hints, exposing subscriptions and writing thorough unit tests for edge gestures.
8. Create a gesture classifier module that consumes pointer events, emits tap/swipe/pinch intents using config thresholds, and cover it with deterministic Vitest specs.
9. Subscribe to gesture intents inside the layout interaction layer, map them to camera/navigation commands, and add integration tests simulating swipe and pinch sequences.
10. Expand `src/lib/controls/shortcuts.ts` to cover arrow, enter, and escape behavior with reduced-motion handling, ensuring focus hand-off stores integrate with gestures; test via unit specs.
11. Replace placeholder row content with bespoke implementations (About scroller, Showreel preview, Services copy, Contact CTA/social), wire CTA visibility into components, and add component tests.
12. Implement the photo gallery: finalize masonry utilities, build pan/zoom/pinch interaction in PhotoCanvas, preload assets, and add unit plus Playwright coverage for pinch and keyboard fallbacks.
13. Implement the film gallery: reuse masonry utilities for posters, enforce pan-only navigation, handle external links/new-tab fallbacks, and expand tests for pointer routing and link handling.
14. Add persistence (e.g., sessionStorage) for last focus/tile, implement asset prefetch hooks, support reduced-motion/orientation changes, instrument performance marks, and document manual QA in `docs/qa-checklist.md`; update README and ensure all tests pass.

## Step Size Review
- Each step produces a testable increment that either introduces infrastructure or completes a user-facing capability, avoiding gaps between tooling, interaction layers, and gallery delivery.
- The queue moves from foundational safety nets toward high-complexity features, ensuring no step depends on unimplemented prerequisites and keeping risk isolated.

## Code-Generation Prompt Suite

### Prompt 1 — Testing Harness & Baseline Checks V
```text
Goal: Stand up Vitest and Playwright before shipping features.

1. Add dev dependencies for Vitest, Playwright, and Testing Library in package.json; create scripts `lint`, `test:unit`, `test:e2e`, and `test:ci`.
2. Author `vitest.config.ts` with the Svelte plugin and jsdom environment plus `src/test/setup.ts` registering @testing-library matchers.
3. Add `playwright.config.ts` with mobile/desktop projects and a smoke spec directory (e.g., `tests/e2e`).
4. Create baseline unit tests validating `src/lib/content/content.json` structure and coverage of the existing route load functions.
5. Run `yarn test:unit --runInBand` and `yarn test:e2e --reporter=list` to confirm the harness.
```

### Prompt 2 — Content Schema & Helpers V
```text
Goal: Validate and type content before it reaches the UI.

1. Install `zod` (or similar) and define schemas in `src/lib/content/schema.ts`.
2. Update `src/lib/content/index.ts` to parse `content.json` through the schema, export strongly typed helpers, and surface descriptive errors for missing slugs.
3. Extend unit tests to cover successful lookups and failure cases for rows, photo items, and film items.
4. Update route load tests to assert that invalid slugs still throw 404 errors.
5. Re-run `yarn test:unit`.
```

### Prompt 3 — Geometry Utilities
```text
Goal: Finalize viewport-derived geometry helpers.

1. Expand `src/lib/config/geometry.ts` with responsive clamps, gutter calculations, and helper functions to center grid/row/tile targets; ensure SSR fallbacks.
2. Update `src/lib/utils/coords.ts` to reuse the new helpers and expose any additional conversions needed by the camera.
3. Add Vitest specs covering small and large viewport scenarios plus SSR mode for the geometry utilities.
4. Document any new exports in comments and rerun `yarn test:unit`.
```

### Prompt 4 — Camera State Machine
```text
Goal: Replace the placeholder camera API with deterministic state management.

1. Create a pure module (e.g., `src/lib/stores/camera-controller.ts`) that accepts focus commands and returns target camera states/keyframes.
2. Refactor `src/lib/stores/camera.ts` to use the controller, exposing promises for `zoomOutToGrid`, `focusRow`, and `focusTile`.
3. Add unit tests covering grid → row, row → tile, and queued command flows, including safeguards against redundant transitions.
4. Ensure the controller is side-effect free so it can be tested in isolation; run `yarn test:unit`.
```

### Prompt 5 — GSAP Integration & Visual Sync
```text
Goal: Animate camera transitions across DOM and Threlte layers.

1. Integrate GSAP timelines in the camera controller, using `src/lib/animation/motion.ts` for timing/easing.
2. Update `src/lib/stores/camera.ts` to drive the writable `camera` store and resolve promises when animations complete.
3. Adjust `src/lib/components/Grid.svelte` to consume the animated camera values and ensure transforms stay in sync with the Threlte camera instances.
4. Add integration tests (with GSAP mocked) verifying that focus commands emit the correct sequence and resolve after completion.
5. Run `yarn test:unit`.
```

### Prompt 6 — Routing Orchestrator & CTA
```text
Goal: Coordinate route changes, history, and CTA visibility.

1. Update `src/routes/+layout.svelte` to await camera commands, manage grid pushState/back behavior, and expose a CTA visibility store.
2. Implement the Contact CTA behavior so it is visible only in grid mode and navigates to `/contact` after the zoom animation.
3. Add Playwright specs covering navigation to `/`, `/contact`, `/photo/<slug>`, `/film/<slug>`, and browser back/forward flows.
4. Ensure CTA state resets appropriately when returning to the grid; run `yarn test:e2e`.
```

### Prompt 7 — Pointer Manager Upgrade
```text
Goal: Capture rich pointer data for gesture detection.

1. Extend `src/lib/controls/pointer.ts` to track multiple active pointers, compute deltas/velocities, and emit structured updates.
2. Provide subscription helpers so gesture modules can listen for pointer batches.
3. Write Vitest specs simulating touch/mouse sequences to validate state transitions and cleanup.
4. Re-run `yarn test:unit`.
```

### Prompt 8 — Gesture Classification
```text
Goal: Translate pointer streams into high-level intents.

1. Create a gesture module (e.g., `src/lib/gestures/intent.ts`) that consumes pointer updates, applies thresholds from `src/lib/gestures/config.ts`, and emits tap, swipe (with axis locking), and pinch intents.
2. Support configurable thresholds via the existing gestures store and expose a testing API to override them.
3. Add comprehensive Vitest coverage for taps, horizontal/vertical swipes, pinch-in/out, and noise rejection.
4. Run `yarn test:unit`.
```

### Prompt 9 — Gesture → Camera Wiring
```text
Goal: Drive navigation from gesture intents.

1. In the layout interaction layer, subscribe to gesture intents and call the camera API for zoom-in/out, row navigation, and tile focus.
2. Respect row hand-off rules (e.g., vertical swipe returns to grid, horizontal swipe moves between tiles) and guard against conflicting commands.
3. Add integration tests using Testing Library + PointerEvent simulation to verify swipe and pinch sequences trigger the expected camera calls.
4. Re-run `yarn test:unit`.
```

### Prompt 10 — Keyboard Parity & Focus
```text
Goal: Mirror gesture behavior for keyboard users.

1. Expand `src/lib/controls/shortcuts.ts` to handle arrow navigation, Enter-to-zoom, and Escape/back-out, respecting reduced-motion preferences.
2. Coordinate with the focus store so keyboard navigation keeps CTA visibility and gesture handlers in sync.
3. Write unit tests covering focus transitions, reduced-motion branches, and duplicate-command prevention.
4. Run `yarn test:unit`.
```

### Prompt 11 — Row Experiences & CTA Toggles
```text
Goal: Replace placeholder row content with production-ready experiences.

1. Implement bespoke layouts for About, Showreel (with Ken Burns preview), Services, and Contact rows using data from `content.json`.
2. Wire the CTA visibility store into the grid and rows so the Contact CTA appears only when expected.
3. Add component tests verifying Ken Burns timing, CTA toggles, and Contact link targets.
4. Run `yarn test:unit`.
```

### Prompt 12 — Photo Gallery Engine
```text
Goal: Deliver the interactive photo experience.

1. Upgrade `src/lib/galleries/masonry.ts` to compute responsive columns and cache layout metrics.
2. Implement pan/zoom/pinch logic in `src/lib/galleries/PhotoCanvas.svelte`, including preload states and exit rules back to the grid.
3. Add Vitest tests for layout math and a Playwright spec that exercises pinch (with keyboard fallback) to verify zoom limits and exit behavior.
4. Run `yarn test:unit` and `yarn test:e2e`.
```

### Prompt 13 — Film Gallery Engine
```text
Goal: Deliver the film gallery with external navigation.

1. Reuse masonry utilities for poster layout in `src/lib/galleries/FilmCanvas.svelte`, enforcing pan-only interaction.
2. Implement tap/click handling that opens `externalUrl` in a new tab with a same-tab fallback when popups are blocked.
3. Add unit tests for layout reuse and pointer gating plus Playwright coverage that asserts external navigation behavior.
4. Run all tests.
```

### Prompt 14 — Persistence, Prefetching & Performance
```text
Goal: Wrap the experience with polish and QA documentation.

1. Persist last-focused row/tile via a store backed by sessionStorage and restore it on load while honoring reduced-motion settings.
2. Prefetch gallery assets based on focus intent and handle orientation changes and reduced-motion by pausing animations.
3. Instrument key transitions with `performance.mark/measure` and log summaries in dev mode.
4. Document a manual QA matrix in `docs/qa-checklist.md`, reference it from the README, and ensure `yarn test:unit` plus `yarn test:e2e` pass.
```
