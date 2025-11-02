# About Tiles with Individual Routes - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four biography tiles to About section with individual routes, horizontal navigation, and centralized design system.

**Architecture:** Follow unified items pattern from film/photo galleries. Extend Utopia tokens, create reactive design system store, update schema to use items array, create AboutTile component, add 'about' to gallery types for navigation integration.

**Tech Stack:** SvelteKit, TypeScript, Zod validation, Svelte stores, Utopia fluid design tokens

---

## Task 1: Extend Utopia Typography Tokens

**Files:**
- Modify: `src/lib/utopia/tokens.ts`

**Step 1: Add typography scale to tokens.ts**

After the existing exports in the file, add:

```typescript
export const type = {
  bodySmall: clamp(13, viewport.min, viewport.max, 15),
  body: clamp(15, viewport.min, viewport.max, 18),
  bodyLarge: clamp(17, viewport.min, viewport.max, 21),
  h3: clamp(20, viewport.min, viewport.max, 28),
  h2: clamp(25, viewport.min, viewport.max, 36),
  h1: clamp(32, viewport.min, viewport.max, 48),
  display: clamp(40, viewport.min, viewport.max, 72)
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  loose: 1.8
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

Create new file with:

```typescript
import { writable } from 'svelte/store';
import { spacing, type, lineHeights, weights } from '$lib/utopia/tokens';

export interface DesignTheme {
  type: typeof type;
  colors: {
    textPrimary: string;
    textSecondary: string;
    textLink: string;
    textLinkHover: string;
    bgPrimary: string;
    bgSecondary: string;
    interactive: string;
    interactiveHover: string;
  };
  spacing: typeof spacing;
  weights: typeof weights;
  lineHeights: typeof lineHeights;
}

export const theme = writable<DesignTheme>({
  type,
  colors: {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textLink: '#ffffff',
    textLinkHover: 'rgba(255, 255, 255, 0.8)',
    bgPrimary: '#708090',
    bgSecondary: '#5a6a7a',
    interactive: '#ffffff',
    interactiveHover: '#e5e5e5'
  },
  spacing,
  lineHeights,
  weights
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
- Modify: `src/lib/content/schema.ts`

**Step 1: Add aboutItemSchema before aboutRowSchema**

Add this schema before the existing `aboutRowSchema` (around line 40):

```typescript
const aboutItemSchema = z.object({
  slug: nonEmptyString,
  content: nonEmptyString,
  link: z
    .object({
      text: nonEmptyString,
      url: urlSchema
    })
    .optional()
});
```

**Step 2: Replace aboutRowSchema**

Find the existing `aboutRowSchema` and replace it with:

```typescript
const aboutRowSchema = baseRow.extend({
  type: z.literal('about'),
  items: z.array(aboutItemSchema).min(1)
});
```

**Step 3: Verify schema compiles**

Run: `npm run check`
Expected: No TypeScript errors (content.json will fail validation until we update it)

**Step 4: Commit**

```bash
git add src/lib/content/schema.ts
git commit -m "feat: update about row schema to use items array

Replace panels with items array matching gallery pattern
Add aboutItemSchema with slug, content, optional link
Enables individual routes for about tiles"
```

---

## Task 4: Update Content JSON with About Tiles

**Files:**
- Modify: `src/lib/content/content.json`

**Step 1: Update about row in content.json**

Find the about row object (around line 16) and replace it with:

```json
{
  "type": "about",
  "slug": "about",
  "items": [
    {
      "slug": "tile-1",
      "content": "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan, Mt Noshaq as the first Afghan woman summited and the highest peak in Pakistan, K2 as the first Pakistani woman summited. I filmed Nirmal Purja as he set a blazing speed record on the 14 8,000ers and filmed Kristin Harila as she smashed it."
    },
    {
      "slug": "tile-2",
      "content": "A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings. Wanting to see more of the world I joined the British army reserve and soon the commando training combined with my passion for story telling provided opportunities to do just that. I filmed army expeds to Dhaulagiri in 2016 and Everest in 2017, began building a basecamp network and haven't really stopped carrying cameras up mountains since."
    },
    {
      "slug": "tile-3",
      "content": "With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners. I believe deeply in representation and hope the projects I've worked on show people what's possible when you look up and believe."
    },
    {
      "slug": "tile-4",
      "content": "Stories from the mountains and the people in between are slowly being collected on my Youtube channel.",
      "link": {
        "text": "Youtube channel.",
        "url": "http://www.youtube.com/@SandroGH5"
      }
    }
  ]
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
Replace panels with items array"
```

---

## Task 5: Create AboutTile Component

**Files:**
- Create: `src/lib/components/AboutTile.svelte`

**Step 1: Create AboutTile component**

Create new file with:

```svelte
<script lang="ts">
  import { theme } from '$lib/stores/designSystem';

  export let slug: string;
  export let content: string;
  export let link: { text: string; url: string } | undefined = undefined;
  export let position: { current: number; total: number };

  // Parse content and replace link text with anchor tag
  function renderContent(text: string, linkConfig?: { text: string; url: string }): string {
    if (!linkConfig) return text;
    const linkHtml = `<a href="${linkConfig.url}" target="_blank" rel="noopener noreferrer" class="link">${linkConfig.text}</a>`;
    return text.replace(linkConfig.text, linkHtml);
  }

  $: processedContent = renderContent(content, link);
  $: ariaLabel = `About, ${position.current} of ${position.total}`;
</script>

<style>
  .tile {
    width: 100vw;
    height: 100vh;
    display: grid;
    place-items: center;
  }

  .content-wrapper {
    max-width: 800px;
    padding: var(--spacing-s6);
  }

  .content {
    font-size: var(--type-body);
    line-height: var(--line-height-normal);
    font-weight: var(--weight-regular);
    color: var(--text-primary);
  }

  :global(.content a.link) {
    color: var(--text-link);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  :global(.content a.link:hover) {
    color: var(--text-link-hover);
    text-decoration: underline;
  }

  :global(.content a.link:focus-visible) {
    outline: 2px solid var(--interactive);
    outline-offset: 4px;
    border-radius: 2px;
  }
</style>

<article
  class="tile"
  role="region"
  aria-label={ariaLabel}
  style="
    --spacing-s6: {$theme.spacing.s6};
    --type-body: {$theme.type.body};
    --line-height-normal: {$theme.lineHeights.normal};
    --weight-regular: {$theme.weights.regular};
    --text-primary: {$theme.colors.textPrimary};
    --text-link: {$theme.colors.textLink};
    --text-link-hover: {$theme.colors.textLinkHover};
    --interactive: {$theme.colors.interactive};
    background: {$theme.colors.bgPrimary};
  "
>
  <div class="content-wrapper">
    <div class="content">
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
git add src/lib/components/AboutTile.svelte
git commit -m "feat: create AboutTile component

Renders individual about tile with content
Handles hyperlink parsing and rendering
Uses design system store for theming
Accessible with ARIA labels and focus states"
```

---

## Task 6: Update Navigation to Include About Row

**Files:**
- Modify: `src/lib/controls/shortcuts.ts:14-16`

**Step 1: Update GalleryRow type**

Find line 14 and replace:

```typescript
type GalleryRow = Extract<Row, { type: 'photoGallery' | 'filmGallery' }>;
```

With:

```typescript
type GalleryRow = Extract<Row, { type: 'photoGallery' | 'filmGallery' | 'about' }>;
```

**Step 2: Update galleryTypes set**

Find line 16 and replace:

```typescript
const galleryTypes = new Set<GalleryRow['type']>(['photoGallery', 'filmGallery']);
```

With:

```typescript
const galleryTypes = new Set<GalleryRow['type']>(['photoGallery', 'filmGallery', 'about']);
```

**Step 3: Verify navigation compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/lib/controls/shortcuts.ts
git commit -m "feat: add about row to navigation gallery types

Enable horizontal navigation for about tiles
Left/right arrows now work in about row
Follows same pattern as film/photo galleries"
```

---

## Task 7: Create About Route with Redirect

**Files:**
- Create: `src/routes/about/+page.ts`

**Step 1: Create redirect page**

Create new file with:

```typescript
import { redirect } from '@sveltejs/kit';
import { rows } from '$lib/content';

export function load() {
  const aboutRow = rows.find((row) => row.type === 'about');
  const firstSlug = aboutRow?.items?.[0]?.slug ?? 'tile-1';
  throw redirect(307, `/about/${firstSlug}`);
}
```

**Step 2: Verify route compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/routes/about/+page.ts
git commit -m "feat: add /about redirect to first tile

Redirect /about to /about/tile-1
Matches film/photo gallery pattern"
```

---

## Task 8: Create About Tile Dynamic Route

**Files:**
- Create: `src/routes/about/[slug]/+page.ts`
- Create: `src/routes/about/[slug]/+page.svelte`

**Step 1: Create page loader**

Create `src/routes/about/[slug]/+page.ts` with:

```typescript
import { rows } from '$lib/content';
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const aboutRow = rows.find((row) => row.type === 'about');
  if (!aboutRow) {
    throw error(404, 'About section not found');
  }

  const item = aboutRow.items.find((i) => i.slug === params.slug);
  if (!item) {
    throw error(404, 'About tile not found');
  }

  return {
    item,
    row: aboutRow
  };
}
```

**Step 2: Create page component**

Create `src/routes/about/[slug]/+page.svelte` with:

```svelte
<script lang="ts">
  import AboutTile from '$lib/components/AboutTile.svelte';

  export let data;

  const { item, row } = data;
  const currentIndex = row.items.findIndex((i) => i.slug === item.slug);
  const position = {
    current: currentIndex + 1,
    total: row.items.length
  };
</script>

<AboutTile slug={item.slug} content={item.content} link={item.link} {position} />
```

**Step 3: Verify routes compile**

Run: `npm run check`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/routes/about/[slug]/+page.ts src/routes/about/[slug]/+page.svelte
git commit -m "feat: create about tile dynamic routes

Add /about/[slug] route for individual tiles
Load tile data from content.json
Render AboutTile component with position info"
```

---

## Task 9: Remove Old AboutRow Component

**Files:**
- Delete: `src/lib/rows/AboutRow.svelte`

**Step 1: Delete old component**

Run: `rm src/lib/rows/AboutRow.svelte`
Expected: File removed

**Step 2: Verify build still works**

Run: `npm run check`
Expected: No errors (AboutRow was a placeholder, not referenced)

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove old AboutRow placeholder

Remove placeholder component
About tiles now use individual routes instead"
```

---

## Task 10: Verify Complete Implementation

**Files:**
- All modified files

**Step 1: Run type checking**

Run: `npm run check`
Expected: No TypeScript or Svelte errors

**Step 2: Start dev server**

Run: `npm run dev`
Expected: Server starts on http://localhost:5173

**Step 3: Test navigation manually**

Open browser to http://localhost:5173

Test checklist:
- [ ] Navigate to /about (redirects to /about/tile-1)
- [ ] See first tile content displayed
- [ ] Press right arrow → navigates to /about/tile-2
- [ ] Continue right → tile-3, tile-4
- [ ] Press left arrow → navigate back through tiles
- [ ] Tile 4 shows YouTube link
- [ ] Click link → opens in new tab
- [ ] Link has hover state (underline appears)
- [ ] Tab to link → visible focus ring
- [ ] Press up/down arrows → navigate to other rows
- [ ] Return to about row → maintains tile position
- [ ] All tiles use consistent typography
- [ ] No console errors

**Step 4: Test responsive behavior**

Resize browser window:
- [ ] Typography scales smoothly
- [ ] Content max-width maintains readability
- [ ] Tiles remain full viewport

**Step 5: Build production bundle**

Run: `npm run build`
Expected: Successful build with no errors

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete about tiles implementation

- Four biography tiles with individual routes
- Horizontal navigation with arrow keys
- Synchronized tile positioning
- Centralized design system with Utopia tokens
- Hyperlink support in tile content

All manual tests passing, production build successful"
```

---

## Notes

**DRY Principles:**
- Design tokens centralized in single store
- Navigation logic reuses existing gallery pattern
- Schema follows film/photo structure

**YAGNI:**
- No navigation dots (can add later if needed)
- No custom animations (native positioning works)
- No tile preloading (all render simultaneously)

**Testing Strategy:**
- Type safety via TypeScript and Zod schemas
- Manual testing in browser (keyboard, links, responsive)
- Build verification ensures no runtime errors
- Accessibility testing with keyboard-only navigation

**Accessibility:**
- ARIA labels on tiles
- Focus visible on links
- Semantic HTML (article, a tags)
- Keyboard navigation support

---

## Execution Notes

After completing all tasks:
1. Test all navigation flows thoroughly
2. Verify no visual regressions on other rows
3. Check browser console for errors
4. Test on mobile if possible (swipe gestures)
5. Verify theme tokens work correctly

**Design system benefits:**
- Change font globally: `$theme.type.body = 'new value'`
- Add dark mode: `$theme.colors.bgPrimary = '#1a1a1a'`
- Single source of truth for all styling
