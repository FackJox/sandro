# About Tiles & Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four biography tiles to About section with horizontal scroll and establish centralized design system using Svelte stores.

**Architecture:** Extend Utopia fluid tokens with full typography scale, wrap in reactive Svelte store for runtime theme switching, update About row schema to support text content and hyperlinks, create AboutPanel component for rendering tiles in horizontal scroll container.

**Tech Stack:** SvelteKit, TypeScript, Zod validation, Utopia fluid design tokens

---

## Task 1: Extend Utopia Typography Tokens

**Files:**
- Modify: `src/lib/utopia/tokens.ts:10-25`

**Step 1: Add typography scale to tokens.ts**

Add after existing `type.base`:

```typescript
export const type = {
  // Body text
  bodySmall: clamp(13, viewport.min, viewport.max, 15),
  body: clamp(15, viewport.min, viewport.max, 18),
  bodyLarge: clamp(17, viewport.min, viewport.max, 21),

  // Headings (1.25 modular scale)
  h3: clamp(20, viewport.min, viewport.max, 28),
  h2: clamp(25, viewport.min, viewport.max, 36),
  h1: clamp(32, viewport.min, viewport.max, 48),

  // Display/Hero
  display: clamp(40, viewport.min, viewport.max, 72)
};

export const lineHeights = {
  tight: 1.2,    // For headings
  normal: 1.5,   // For body text
  loose: 1.8     // For long-form reading
};

export const weights = {
  light: 200,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};
```

**Step 2: Verify tokens compile**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/utopia/tokens.ts
git commit -m "feat: extend Utopia tokens with typography scale

Add fluid typography scale (body, headings, display)
Add line heights and font weights
Follows 1.25 modular scale for hierarchy"
```

---

## Task 2: Create Design System Store

**Files:**
- Create: `src/lib/stores/designSystem.ts`

**Step 1: Create design system store**

Create file with:

```typescript
import { writable } from 'svelte/store';
import { spacing, type as utopiaType, lineHeights, weights } from '$lib/utopia/tokens';

export interface DesignTheme {
  type: {
    bodySmall: string;
    body: string;
    bodyLarge: string;
    h3: string;
    h2: string;
    h1: string;
    display: string;
  };
  colors: {
    textPrimary: string;
    textSecondary: string;
    textLink: string;
    textLinkHover: string;
    bgPrimary: string;
    bgSecondary: string;
    bgAccent: string;
    interactive: string;
    interactiveHover: string;
  };
  spacing: typeof spacing;
  weights: typeof weights;
  lineHeights: typeof lineHeights;
}

export const theme = writable<DesignTheme>({
  type: utopiaType,
  colors: {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textLink: '#ffffff',
    textLinkHover: 'rgba(255, 255, 255, 0.8)',
    bgPrimary: '#708090',
    bgSecondary: '#5a6a7a',
    bgAccent: '#8a9aa8',
    interactive: '#ffffff',
    interactiveHover: '#e5e5e5'
  },
  spacing,
  weights,
  lineHeights
});
```

**Step 2: Verify store compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/stores/designSystem.ts
git commit -m "feat: create centralized design system store

Add reactive Svelte store for design tokens
Enables runtime theme switching
Includes typography, colors, spacing, weights"
```

---

## Task 3: Update Content Schema for About Row

**Files:**
- Modify: `src/lib/content/schema.ts:54-57`

**Step 1: Add content and links to aboutRowSchema**

Replace:

```typescript
const aboutRowSchema = baseRow.extend({
  type: z.literal('about'),
  panels: z.array(aboutPanelSchema).min(1)
});
```

With:

```typescript
const aboutRowSchema = baseRow.extend({
  type: z.literal('about'),
  panels: z.array(aboutPanelSchema).min(1),
  content: z.record(z.string(), nonEmptyString).optional(),
  links: z
    .record(
      z.string(),
      z.object({
        text: nonEmptyString,
        url: urlSchema
      })
    )
    .optional()
});
```

**Step 2: Verify schema compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/content/schema.ts
git commit -m "feat: extend about row schema with content and links

Add optional content map (id -> text)
Add optional links map (id -> {text, url})
Supports hyperlinks in about tiles"
```

---

## Task 4: Update Content JSON with About Tiles

**Files:**
- Modify: `src/lib/content/content.json:15-24`

**Step 1: Update about row in content.json**

Replace existing about row object with:

```json
{
  "type": "about",
  "slug": "about",
  "panels": [
    { "kind": "text", "id": "tile-1" },
    { "kind": "text", "id": "tile-2" },
    { "kind": "text", "id": "tile-3" },
    { "kind": "text", "id": "tile-4" }
  ],
  "content": {
    "tile-1": "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan, Mt Noshaq as the first Afghan woman summited and the highest peak in Pakistan, K2 as the first Pakistani woman summited. I filmed Nirmal Purja as he set a blazing speed record on the 14 8,000ers and filmed Kristin Harila as she smashed it.",
    "tile-2": "A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings. Wanting to see more of the world I joined the British army reserve and soon the commando training combined with my passion for story telling provided opportunities to do just that. I filmed army expeds to Dhaulagiri in 2016 and Everest in 2017, began building a basecamp network and haven't really stopped carrying cameras up mountains since.",
    "tile-3": "With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners. I believe deeply in representation and hope the projects I've worked on show people what's possible when you look up and believe.",
    "tile-4": "Stories from the mountains and the people in between are slowly being collected on my Youtube channel."
  },
  "links": {
    "tile-4": {
      "text": "Youtube channel.",
      "url": "http://www.youtube.com/@SandroGH5"
    }
  }
}
```

**Step 2: Verify JSON validates against schema**

Run: `npm run check`
Expected: No errors, content validates successfully

**Step 3: Commit**

```bash
git add src/lib/content/content.json
git commit -m "feat: add four about tile contents

Add biography text for tiles 1-4
Add YouTube link for tile 4
Replace placeholder panels with real content"
```

---

## Task 5: Create AboutPanel Component

**Files:**
- Create: `src/lib/components/AboutPanel.svelte`

**Step 1: Create AboutPanel component**

```svelte
<script lang="ts">
  import { theme } from '$lib/stores/designSystem';

  export let panel: { kind: string; id: string };
  export let content: string = '';
  export let link: { text: string; url: string } | undefined = undefined;
  export let position: { current: number; total: number };

  // Parse content and replace link text with anchor tag
  function renderContent(text: string, linkConfig?: { text: string; url: string }): string {
    if (!linkConfig) return text;
    const linkHtml = `<a href="${linkConfig.url}" target="_blank" rel="noopener noreferrer" class="link">${linkConfig.text}</a>`;
    return text.replace(linkConfig.text, linkHtml);
  }

  $: processedContent = renderContent(content, link);
  $: ariaLabel = `About section, panel ${position.current} of ${position.total}`;
</script>

<style>
  .panel {
    width: 100vw;
    height: 100vh;
    flex-shrink: 0;
    scroll-snap-align: start;
    display: grid;
    place-items: center;
  }

  .content-wrapper {
    max-width: 800px;
    padding: var(--spacing-s6);
  }

  .text {
    font-size: var(--type-body);
    line-height: var(--line-height-normal);
    font-weight: var(--weight-regular);
    color: var(--color-text-primary);
  }

  :global(.text a.link) {
    color: var(--color-text-link);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  :global(.text a.link:hover) {
    color: var(--color-text-link-hover);
    text-decoration: underline;
  }

  :global(.text a.link:focus-visible) {
    outline: 2px solid var(--color-interactive);
    outline-offset: 4px;
    border-radius: 2px;
  }
</style>

<article
  class="panel"
  role="region"
  aria-label={ariaLabel}
  style="
    --spacing-s6: {$theme.spacing.s6};
    --type-body: {$theme.type.body};
    --line-height-normal: {$theme.lineHeights.normal};
    --weight-regular: {$theme.weights.regular};
    --color-text-primary: {$theme.colors.textPrimary};
    --color-text-link: {$theme.colors.textLink};
    --color-text-link-hover: {$theme.colors.textLinkHover};
    --color-interactive: {$theme.colors.interactive};
    background: {$theme.colors.bgPrimary};
  "
>
  <div class="content-wrapper">
    <div class="text">
      {@html processedContent}
    </div>
  </div>
</article>
```

**Step 2: Verify component compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/components/AboutPanel.svelte
git commit -m "feat: create AboutPanel component

Renders individual about tile with content
Handles hyperlink parsing and rendering
Uses design system store for theming
Accessible with ARIA labels and focus states"
```

---

## Task 6: Update AboutRow Component

**Files:**
- Modify: `src/lib/rows/AboutRow.svelte:1-7`

**Step 1: Replace AboutRow implementation**

Replace entire file content with:

```svelte
<script lang="ts">
  import AboutPanel from '$lib/components/AboutPanel.svelte';

  export let row: any;
</script>

<style>
  .scroll-container {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    width: 100vw;
    height: 100vh;
  }

  /* Hide scrollbar but keep functionality */
  .scroll-container::-webkit-scrollbar {
    display: none;
  }
  .scroll-container {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>

<div class="scroll-container">
  {#each row.panels as panel, index}
    <AboutPanel
      {panel}
      content={row.content?.[panel.id] || ''}
      link={row.links?.[panel.id]}
      position={{ current: index + 1, total: row.panels.length }}
    />
  {/each}
</div>
```

**Step 2: Verify component compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Test in browser**

Run: `npm run dev`
Navigate to about section
Expected: See 4 tiles in horizontal scroll, swipe/scroll between them

**Step 4: Commit**

```bash
git add src/lib/rows/AboutRow.svelte
git commit -m "feat: implement AboutRow with horizontal scroll

Replace placeholder with functional component
Horizontal scroll container with snap points
Maps panels to AboutPanel components
Passes content and link data from content.json"
```

---

## Task 7: Refactor Tile Component to Use Design System

**Files:**
- Modify: `src/lib/components/Tile.svelte:1-37`

**Step 1: Update Tile to use design system store**

Replace style block and add script import:

```svelte
<script lang="ts">
  import { theme } from '$lib/stores/designSystem';

  export let title: string = '';
  export let subtitle: string = '';
</script>

<style>
  .tile {
    width: 100vw;
    height: 100vh;
    display: grid;
    place-items: center;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  .title {
    font-size: var(--type-h1);
    letter-spacing: 0.05em;
    font-weight: var(--weight-regular);
  }
  .subtitle {
    color: var(--text-secondary);
    margin-top: var(--spacing-s2);
    font-size: var(--type-body);
  }
  :global(.contact-cta) {
    position: fixed;
    top: var(--spacing-s3);
    right: var(--spacing-s3);
    z-index: 20;
  }
  @media (min-width: 768px) {
    :global(.contact-cta) {
      top: var(--spacing-s4);
      right: var(--spacing-s4);
    }
  }
  button.cta {
    background: var(--interactive);
    color: #111;
    border: 0;
    padding: var(--spacing-s1) var(--spacing-s2);
    cursor: pointer;
    font-weight: var(--weight-medium);
  }
  button.cta:hover {
    background: var(--interactive-hover);
  }
  button.cta:focus-visible {
    outline: 2px solid var(--text-secondary);
    outline-offset: 2px;
  }
</style>

<div
  class="tile"
  role="region"
  aria-label={title}
  style="
    --bg-primary: {$theme.colors.bgPrimary};
    --text-primary: {$theme.colors.textPrimary};
    --text-secondary: {$theme.colors.textSecondary};
    --type-h1: {$theme.type.h1};
    --type-body: {$theme.type.body};
    --weight-regular: {$theme.weights.regular};
    --weight-medium: {$theme.weights.medium};
    --spacing-s1: {$theme.spacing.s1};
    --spacing-s2: {$theme.spacing.s2};
    --spacing-s3: {$theme.spacing.s3};
    --spacing-s4: {$theme.spacing.s4};
    --interactive: {$theme.colors.interactive};
    --interactive-hover: {$theme.colors.interactiveHover};
  "
>
  <div>
    {#if title}<div class="title">{title}</div>{/if}
    {#if subtitle}<div class="subtitle">{subtitle}</div>{/if}
  </div>
</div>
```

**Step 2: Verify component compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Test in browser**

Run: `npm run dev`
Navigate through all sections
Expected: All tiles use design system, no visual regressions

**Step 4: Commit**

```bash
git add src/lib/components/Tile.svelte
git commit -m "refactor: migrate Tile to design system store

Replace hardcoded values with theme tokens
Uses reactive Svelte store for styling
Maintains visual consistency"
```

---

## Task 8: Verify Complete Implementation

**Files:**
- All modified files

**Step 1: Run type checking**

Run: `npm run check`
Expected: No TypeScript or Svelte errors

**Step 2: Build production bundle**

Run: `npm run build`
Expected: Successful build with no errors

**Step 3: Test all functionality in browser**

Run: `npm run preview`

Test checklist:
- [ ] About section shows 4 tiles
- [ ] Horizontal scroll works (swipe/scroll)
- [ ] Tiles snap to viewport
- [ ] Content displays correctly on all 4 tiles
- [ ] YouTube link in tile 4 works and opens in new tab
- [ ] Link has hover state and focus visible
- [ ] All other sections still render correctly
- [ ] Typography scales fluidly on resize
- [ ] No visual regressions

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete About tiles and design system

- Four biography tiles with horizontal scroll
- Centralized design system with Svelte stores
- Extended Utopia typography scale
- Refactored components to use design tokens
- Hyperlink support in tile content

All tests passing, production build successful"
```

---

## Notes

- **DRY:** Design tokens centralized in single store
- **YAGNI:** No navigation dots or keyboard shortcuts (can add later if needed)
- **Accessibility:** ARIA labels, focus states, semantic HTML
- **Performance:** CSS scroll-snap native, no JS animations
- **Future:** Theme store enables dark mode, brand variations

## Testing Strategy

- Type safety via TypeScript and Zod schemas
- Visual testing in browser (manual for now)
- Build verification ensures no runtime errors
- Accessibility: keyboard nav, screen reader support

## Design System Benefits

**Before:** Hardcoded values scattered across components
**After:** Single source of truth in reactive store

Change font globally:
```typescript
$theme.type.body = 'new value';  // All components update
```

Add dark mode:
```typescript
$theme.colors.bgPrimary = '#1a1a1a';  // Instant theme switch
```
