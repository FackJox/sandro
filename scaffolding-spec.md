# Sandro Gh. Website Redesign — Development Blueprint & Prompt Playbook

This document captures the finalized project scope, a multi-pass implementation blueprint, and a reusable set of prompts for a code-generation LLM to build the remaining functionality with iterative, test-driven discipline.

## 0) Context Snapshot
- **Experience model:** Single-page portfolio with two navigation states — zoomed-in (a single tile fills the viewport) and zoomed-out (virtual grid). Rows host About, Hero, Contact, Showreel, Services, plus Photo/Film galleries rendered via Threlte.
- **Tech stack:** SvelteKit (TypeScript), GSAP for the virtual camera, Threlte/three.js for 2D galleries, JSON-driven content, Vercel deployment. Gestures and keyboard parity required. Contact CTA (grid-only) jumps to `/contact`.
- **Core constraints:** Virtual camera (no native scroll), precise gesture routing, URL deep-links for rows and gallery tiles, pinch-to-zoom photos, external links for film/showreel, Utopia fluid design tokens, performance at 60fps, and progressive enhancement.

## 1) Development Blueprint (Step-by-Step)
1. **Testing & Tooling Foundation**
   - Configure Vitest (unit) and Playwright (E2E) with CI-ready scripts. Add smoke tests for `content.json` validity and route loaders.
2. **Viewport Geometry & Tokens**
   - Finalize responsive clamp helpers, gutter calculations, and ensure SSR-safe fallbacks. Add unit tests covering conversions and clamps.
3. **Camera State & GSAP Engine**
   - Replace stubbed camera store with a controller that accepts focus commands, produces deterministic keyframes, and syncs DOM transform + Threlte camera. Provide unit tests over pure computations; integration tests assert transform updates via component harness.
4. **Routing & History Sync**
   - Implement layout-level navigation orchestrator: translate route loads into camera transitions, pushState strategy for grid, URL updates on animation completion, and CTA wiring. Add Playwright specs for `/`, `/<row>`, `/photo/<slug>`, `/film/<slug>` flows.
5. **Gesture & Keyboard System**
   - Build pointer classifier (tap/swipe/pinch) with axis locking, integrate with camera API, and ensure Photo/Film canvases can claim focus. Mirror with keyboard shortcuts. Unit-test classifiers; integration-test gesture-to-action wiring with simulated PointerEvents.
6. **Row Component Behaviors**
   - Flesh out About panel scroller, Showreel Ken Burns preview with accessible play CTA, Services copy layout, Contact mailto/social block, and CTA visibility toggling in grid state. Add component-level tests for CTA, Ken Burns timer hooks (using fake timers).
7. **Photo Gallery Engine**
   - Implement masonry layout generator, image preloading, orthographic camera pan/zoom, pinch zoom limits, and navigation handoff rules. Provide Vitest tests for layout math and state transitions plus Playwright pinch simulation (where supported).
8. **Film Gallery Engine**
   - Mirror Photo gallery base (pan-only, no internal zoom), ensure poster hit-test opens external link in new tab, respect gesture thresholds. Test layout math, pointer routing, and Playwright check for external open fallback.
9. **State Persistence & Prefetching**
   - Cache last tile indices per row, warm image assets before transitions, and wire reduced-motion fallbacks. Test stores for persistence and ensure network prefetch hooks kick in based on navigation intent.
10. **Performance & QA Envelope**
    - Add visibility culling for off-screen canvases, `prefers-reduced-motion` adjustments, orientation change hooks, and instrumentation via `performance.mark`. Final Playwright suite covers regression matrix (mobile/desktop). Document manual QA checklist.

## 2) Iterative Breakdown

### 2.1 Pass 1 — High-Level Chunks
1. Establish automated testing & tooling.
2. Build the virtual camera core (geometry + state + GSAP).
3. Implement navigation surfaces (routing, gestures, keyboard, CTA).
4. Complete DOM-based rows (Hero/About/Showreel/Services/Contact).
5. Ship Photo gallery experience.
6. Ship Film gallery experience.
7. Polish: persistence, performance, QA documentation.

### 2.2 Pass 2 — Refined Workstreams
1. **Testing & Tooling**
   - Vitest/Playwright config, baseline tests, CI script, lint/format enforcement.
2. **Geometry & Camera**
   - Responsive clamps, viewport listeners, camera store transitions, GSAP timeline binder, Threlte camera sync.
3. **Navigation & Inputs**
   - Routing orchestration, history push, CTA wiring, pointer classifier, keyboard parity, gesture locks.
4. **Static Rows**
   - About scroller, Showreel preview, Services list + Shutterstock link, Contact mailto/social block.
5. **Photo Gallery**
   - Masonry layout + pan/zoom, pinch zoom guardrails, preload + asset management, exit logic.
6. **Film Gallery**
   - Masonry layout + pan-only, external link behavior, shared gallery utilities.
7. **Polish & QA**
   - State persistence, reduced-motion, orientation handling, performance instrumentation, manual QA docs.

### 2.3 Pass 3 — Right-Sized Steps (Final Execution Queue)
1. **Configure Vitest & Playwright**: add configs, scripts, sample unit test validating `content.json` schema, and basic Playwright smoke verifying `/` loads hero. Ensure CI command runs both suites.
2. **Geometry Utilities**: implement viewport/gutter helpers with SSR fallbacks; unit-test `gridScale`, `gutters`, `centerTile`, and clamp outputs.
3. **Camera Store Logic**: implement focus command queue, row/tile index tracking, preserving last tile per row; unit-test state transitions.
4. **GSAP Timeline Binder**: create animation controller hooking camera store to DOM transform + Threlte camera; provide integration test via Svelte component harness (assert transform updates).
5. **Routing Orchestrator**: finalize layout subscription translating route data to camera commands, implement grid pushState/back behavior, CTA click handler; Playwright regression for routes + back button.
6. **Pointer Classifier & Gesture Stores**: implement tap/swipe/pinch detection, axis locking, and emit high-level intents; unit-test classifier thresholds.
7. **Gesture → Camera Integration**: wire global pointer manager to camera actions, including zoom-in/out, horizontal/vertical navigation, pinch exit; integration-test using simulated PointerEvents.
8. **Keyboard Navigation**: map arrow keys, Enter, Esc to camera commands with focus guards; unit-test event handling.
9. **Row Enhancements**: implement About panel scroll logic, Showreel Ken Burns loop + accessible controls, Services content, Contact mailto/socials; component tests for CTA visibility + Ken Burns timing via fake timers.
10. **Photo Gallery Engine**: build masonry layout, pan/zoom interactions, pinch zoom guardrails, image preload; unit-test layout math and state machine, Playwright pinch/drag scenario.
11. **Film Gallery Engine**: reuse masonry util, ensure external open, pan-only behavior, pointer override rules; unit-test layout reuse and pointer gating, Playwright external open fallback.
12. **Persistence & Performance Polishing**: cache tile indices, prefetch assets, implement reduced-motion/orientation hooks, add performance instrumentation; tests for persistence store + manual QA checklist committed to docs.

Each step includes targeted tests to keep increments safe, and no step introduces unreferenced code.

## 3) Code-Generation Prompt Sequence
Use the following prompts sequentially. Each prompt instructs the LLM to write tests first, implement code, and ensure integration with existing modules. Replace `npm` with your package manager if needed. Do not move to the next prompt until the prior step’s tests pass.

### Prompt 1 — Configure Vitest & Playwright
```text
You are implementing Step 1: Configure Vitest & Playwright in the Sandro portfolio repo.

Goals:
1. Add Vitest configuration (including jsdom for component tests) and Playwright setup (Desktop Chrome + Mobile Safari profiles).
2. Update package.json scripts: "test:unit", "test:e2e", "test" (runs both sequentially).
3. Add a unit test validating src/lib/content/content.json against the expected schema.
4. Add a basic Playwright test that visits "/" and asserts the HERO tile renders.

Process:
- Write/modify tests first.
- Implement supporting code/config to satisfy tests.
- Run `npm run test:unit` and `npm run test:e2e` (or equivalent) and ensure both pass.
```

### Prompt 2 — Geometry Utilities
```text
Step 2: Implement viewport geometry helpers.

Goals:
1. Enhance src/lib/config/geometry.ts with SSR-safe viewport access, memoized gutters, and exported helpers for tile size, grid positions, and scale.
2. Add corresponding unit tests covering gutters, centerTile, and gridScale calculations for multiple viewport sizes.
3. Ensure existing imports continue working with the new helpers.

Process: write tests (Vitest) before code, then implement, then run `npm run test:unit`.
```

### Prompt 3 — Camera Store Logic
```text
Step 3: Replace the placeholder camera store with production-ready logic.

Goals:
1. In src/lib/stores/camera.ts implement a state machine that tracks:
   - current focus {kind,rowSlug,tileSlug?,tileIndex?},
   - lastFocusedTileIndex per row,
   - queued commands for animations.
2. Expose methods: focusRow, focusTile, zoomOutToGrid, nextTile, prevTile, nextRow, prevRow.
3. Add Vitest unit tests covering state transitions, last-tile persistence, and boundary conditions.

Write tests first, then code, run `npm run test:unit`.
```

### Prompt 4 — GSAP Timeline Binder
```text
Step 4: Implement the GSAP animation controller.

Goals:
1. Create src/lib/animation/controller.ts exporting a singleton that listens to camera state changes and drives GSAP timelines for translate/scale.
2. Update Grid.svelte to subscribe to the controller output (e.g., derived store) instead of directly reading camera store values.
3. Ensure Threlte canvases can receive synchronized camera updates (provide an exported readable store for orthographic cameras).
4. Add a Svelte component test (Vitest + @testing-library/svelte) verifying that focusRow triggers expected transform changes.

Write the test before implementing the controller. Run `npm run test:unit`.
```

### Prompt 5 — Routing Orchestrator & CTA
```text
Step 5: Finalize routing orchestration and CTA behavior.

Goals:
1. Update src/routes/+layout.svelte to translate load data into controller commands with awaitable animation completion.
2. Implement grid pushState/back flow: pushing history entries when zooming out, handling popstate to restore grid vs previous URL.
3. Implement the CONTACT CTA visibility toggle (visible only in grid) and clicking it should navigate to `/contact` after animation.
4. Add Playwright tests covering navigation to `/`, `/contact`, `/photo/<slug>`, back button, and CTA interaction.

Write Playwright specs first, implement code, then run `npm run test:e2e`.
```

### Prompt 6 — Pointer Classifier
```text
Step 6: Build the pointer classifier.

Goals:
1. Implement a dedicated module (src/lib/controls/gestures.ts) producing high-level events: tap, horizontalSwipe, verticalSwipe, pinchIn, pinchOut.
2. Integrate it into pointer.ts so consumers can subscribe to intent events.
3. Add Vitest unit tests to validate tap/swipe/pinch detection against gesture thresholds from config.

Write tests first, implement module, run `npm run test:unit`.
```

### Prompt 7 — Gesture → Camera Integration
```text
Step 7: Wire gestures to camera commands.

Goals:
1. Update layout initialization to subscribe to gesture intents and drive camera api calls (zoom-in/out, row/tile navigation).
2. Respect row handoff rules (vertical swipe triggers grid pass-through), pinch-out for zoom-in, pinch-in exit when allowed.
3. Add an integration test using @testing-library/user-event with PointerEvent simulation verifying swipe and pinch sequences trigger the right camera methods (can spy on api calls).

Write integration test first, then wire code, run `npm run test:unit`.
```

### Prompt 8 — Keyboard Navigation
```text
Step 8: Implement keyboard parity.

Goals:
1. Extend shortcuts.ts to map Arrow keys, Enter, and Escape to camera actions, respecting focus state (no double-trigger when grid already active).
2. Add unit tests covering key handling, including reduced-motion preference (if set, ensure animations still resolve state).

Write tests, implement, run `npm run test:unit`.
```

### Prompt 9 — Row Enhancements
```text
Step 9: Flesh out DOM row behaviors.

Goals:
1. Implement About row panel scroller (horizontal snapping), Showreel Ken Burns preview (looping GSAP timeline, accessible play button), Services list with Shutterstock link, and Contact mailto + social links.
2. Manage CTA visibility in Grid.svelte (exposed store from controller).
3. Add component tests verifying Ken Burns timeline starts/stops, CTA visibility toggles in grid vs focused states, and Contact mailto contains the correct subject.

Write tests first, implement, run `npm run test:unit`.
```

### Prompt 10 — Photo Gallery Engine
```text
Step 10: Implement the Photo gallery experience.

Goals:
1. Build masonry layout generator (responsive columns) and apply it inside PhotoCanvas.svelte.
2. Implement pointer pan/zoom logic with limits, pinch-to-zoom image behavior, and exit rules when returning to 1.0 scale.
3. Preload images and expose loading state to prevent blank tiles.
4. Add Vitest tests for layout math and state reducer, plus Playwright scenario simulating pinch (+ fallback keyboard) to ensure exit works.

Write tests first (unit + E2E), implement, run both test suites.
```

### Prompt 11 — Film Gallery Engine
```text
Step 11: Implement Film gallery mechanics.

Goals:
1. Reuse masonry utils for posters, but enforce pan-only (no zoom) and ensure taps open externalUrl (new tab, fallback same tab if blocked).
2. Integrate with gesture system so horizontal swipes navigate tiles, vertical swipes exit via grid.
3. Add tests for layout reuse, pointer gating (no zoom), and Playwright coverage verifying link opens in new page (detect via context). Include fallback assertion when popup blocked.

Write tests first, implement, run full test suite.
```

### Prompt 12 — Persistence & Performance Polish
```text
Step 12: Final persistence, performance, and QA instrumentation.

Goals:
1. Persist last tile index per row (e.g., Svelte store + sessionStorage) and restore on revisit.
2. Implement asset prefetch hooks when navigation intent detected (hover/focus/gesture).
3. Add reduced-motion and orientation-change handling, pausing Ken Burns + gallery inertia when needed.
4. Instrument key transitions with performance.mark/performance.measure and expose a console summary in dev mode.
5. Document manual QA matrix in docs/qa-checklist.md and ensure README references it.
6. Add tests covering persistence logic and reduced-motion branches; update Playwright suite for orientation/responsive checks where possible.

Write tests/docs first as applicable, implement features, run both test suites.
```

Follow these prompts sequentially to complete the project in safe, incremental, test-driven iterations.
