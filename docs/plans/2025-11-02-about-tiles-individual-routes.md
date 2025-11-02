# About Tiles with Individual Routes

**Date:** 2025-11-02
**Status:** Approved

## Overview

Add four biography tiles to the About section, each with its own route (`/about/tile-1`, etc.), following the unified items pattern from film/photo galleries. Tiles navigate horizontally with arrow keys while maintaining synchronized positions, and integrate with the existing centralized design system.

## Goals

1. Four about tiles with individual routes under `/about/[slug]`
2. Horizontal navigation with left/right arrow keys
3. Synchronized tile positioning (all tiles rendered, positioned via transforms)
4. Unified items pattern matching film/photo galleries
5. Centralized design system with Svelte stores and Utopia tokens
6. Hyperlink support in tile content

## Architecture Decision

**Approach:** Unified Items Array (same pattern as photoGallery/filmGallery)

**Why:**
- Perfect consistency with existing gallery patterns
- No special cases in navigation code
- Simple schema and content structure
- Existing camera controller handles positioning automatically
- About content is text-only, no need for panel kind distinction

## Schema & Content Structure

### Schema Changes

**Location:** `src/lib/content/schema.ts`

**New schema:**
```typescript
const aboutItemSchema = z.object({
  slug: nonEmptyString,
  content: nonEmptyString,
  link: z.object({
    text: nonEmptyString,
    url: urlSchema
  }).optional()
});

const aboutRowSchema = baseRow.extend({
  type: z.literal('about'),
  items: z.array(aboutItemSchema).min(1)
});
```

**Key changes:**
- Replace `panels` array with `items` array
- Each item has: `slug`, `content`, optional `link`
- Mirrors film/photo gallery structure exactly

### Content Data

**Location:** `src/lib/content/content.json`

**Structure:**
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

## Routing Architecture

### Route Structure

**Location:** `src/routes/about/[slug]/+page.svelte`

**Pattern:** Same as film/photo galleries
- `/about` redirects to `/about/tile-1` (first item)
- `/about/tile-1`, `/about/tile-2`, etc. are individual routes
- Each route loads the corresponding item data

### Page Loader

**Location:** `src/routes/about/[slug]/+page.ts` or `+page.server.ts`

```typescript
import { rows } from '$lib/content';
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const aboutRow = rows.find(row => row.type === 'about');
  if (!aboutRow) throw error(404, 'About section not found');

  const item = aboutRow.items.find(i => i.slug === params.slug);
  if (!item) throw error(404, 'About tile not found');

  return {
    item,
    row: aboutRow
  };
}
```

### Redirect Handler

**Location:** `src/routes/about/+page.ts`

```typescript
import { redirect } from '@sveltejs/kit';
import { rows } from '$lib/content';

export function load() {
  const aboutRow = rows.find(row => row.type === 'about');
  const firstSlug = aboutRow?.items[0]?.slug ?? 'tile-1';
  throw redirect(307, `/about/${firstSlug}`);
}
```

## Navigation Integration

### Keyboard Shortcuts

**Location:** `src/lib/controls/shortcuts.ts`

**Changes required:**

1. **Update gallery types (line 14-16):**
```typescript
type GalleryRow = Extract<Row, {
  type: 'photoGallery' | 'filmGallery' | 'about'
}>;

const galleryTypes = new Set<GalleryRow['type']>([
  'photoGallery',
  'filmGallery',
  'about'
]);
```

2. **No other changes needed** - `getGalleryItems()` already extracts `items` arrays

### Navigation Behavior

**Vertical (Up/Down arrows):**
- Move between rows (hero → about → photo → film, etc.)
- When on about row, arrow up/down navigates to adjacent rows

**Horizontal (Left/Right arrows):**
- When in about row: Navigate between tiles (tile-1 ↔ tile-2 ↔ tile-3 ↔ tile-4)
- When at tile-1, left arrow goes to previous row
- When at last tile, right arrow does nothing (clamped)

**Enter:**
- On about row (zoomed out): Zoom to first tile
- On about tile: No effect (already zoomed in)

**Escape:**
- On about tile: Zoom back to row view
- On about row: Zoom to grid view

### Camera Positioning

**How it works:**
- All tiles render simultaneously in the DOM
- Camera controller positions via CSS transforms
- Each tile has `tileIndex` (0-3)
- When navigating left/right, camera pans horizontally
- All tiles slide together maintaining relative positions

**Example:**
```
Route: /about/tile-2 (tileIndex = 1)

[tile-1]  [tile-2]  [tile-3]  [tile-4]
             ^^^
          (camera centered here)

Press right arrow → Route: /about/tile-3 (tileIndex = 2)

[tile-1]  [tile-2]  [tile-3]  [tile-4]
                       ^^^
                  (camera pans, all tiles slide left)
```

This matches how vertical row navigation works - all rows rendered, camera moves between them.

## Component Implementation

### AboutTile Component

**Location:** `src/lib/components/AboutTile.svelte`

**Responsibilities:**
- Render single tile with content
- Parse and inject hyperlinks
- Apply design tokens from store
- Accessibility markup

**Props:**
```typescript
export let slug: string;
export let content: string;
export let link: { text: string; url: string } | undefined = undefined;
export let position: { current: number; total: number };
```

**Key features:**
- Full viewport tile (100vw x 100vh)
- Centered content with max-width 800px
- Hyperlink parsing: Replace link text with `<a>` element
- Design tokens via CSS custom properties from `$theme` store
- ARIA labels for accessibility

**Hyperlink handling:**
```typescript
function renderContent(text: string, linkConfig?: { text: string; url: string }): string {
  if (!linkConfig) return text;
  return text.replace(
    linkConfig.text,
    `<a href="${linkConfig.url}" target="_blank" rel="noopener noreferrer" class="link">${linkConfig.text}</a>`
  );
}
```

**Styling:**
- Links: white, no underline, underline on hover
- Focus states: 2px outline, 4px offset
- Typography: `$theme.type.body`, `$theme.lineHeights.normal`
- Colors: `$theme.colors.*`

### Page Component

**Location:** `src/routes/about/[slug]/+page.svelte`

**Implementation:**
```svelte
<script lang="ts">
  import AboutTile from '$lib/components/AboutTile.svelte';

  export let data;

  const { item, row } = data;
  const currentIndex = row.items.findIndex(i => i.slug === item.slug);
  const position = {
    current: currentIndex + 1,
    total: row.items.length
  };
</script>

<AboutTile
  slug={item.slug}
  content={item.content}
  link={item.link}
  {position}
/>
```

Simple pass-through - Grid component handles positioning automatically.

## Design System Integration

### Typography Tokens

**Location:** `src/lib/utopia/tokens.ts`

**Extensions:**
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
  tight: 1.2,    // Headings
  normal: 1.5,   // Body text
  loose: 1.8     // Long-form reading
};

export const weights = {
  light: 200,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};
```

**Benefits:**
- Fluid typography scales with viewport
- Single source of truth for all type sizes
- Modular scale (1.25) maintains hierarchy

### Design System Store

**Location:** `src/lib/stores/designSystem.ts`

**Implementation:**
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

**Benefits:**
- Reactive Svelte store
- Runtime theme switching capability
- Type-safe with TypeScript
- Single source of truth for all design tokens
- Easy global changes (e.g., dark mode)

### Component Usage Pattern

**In components:**
```svelte
<script>
  import { theme } from '$lib/stores/designSystem';
</script>

<style>
  .element {
    font-size: var(--type-body);
    color: var(--text-primary);
  }
</style>

<div
  class="element"
  style="
    --type-body: {$theme.type.body};
    --text-primary: {$theme.colors.textPrimary};
  "
>
  Content
</div>
```

**Replace hardcoded values:**
- ❌ `font-size: clamp(...)`
- ✅ `$theme.type.body`
- ❌ `opacity: 0.6`
- ✅ `color: $theme.colors.textSecondary`
- ❌ `padding: 32px`
- ✅ `padding: $theme.spacing.s5`

## Accessibility

### Semantic HTML
- `<article>` for tiles
- `<a>` for links with proper attributes
- Proper heading hierarchy

### ARIA Labels
- `role="region"`
- `aria-label="About, 1 of 4"`

### Keyboard Navigation
- Native arrow key support
- Focus management on links
- Visible focus rings (2px outline, 4px offset)

### Screen Readers
- Meaningful labels on all interactive elements
- Link text clearly indicates purpose
- Position information announced

## Testing Considerations

### Browser Testing
- Verify navigation on iOS Safari, Chrome, Firefox
- Test arrow key behavior in all focus states
- Validate link focus states with keyboard-only navigation

### Schema Validation
- Validate content.json against updated schema
- Ensure all required fields present
- Check optional link objects

### Visual Testing
- Check fluid typography at min/max viewports
- Verify synchronized tile positioning during navigation
- Ensure no layout shift during transitions
- Test theme store reactivity

### Accessibility Testing
- Keyboard-only navigation flows
- Screen reader announcements
- Focus indicator visibility

## Migration Notes

**Breaking changes:**
- About row schema changes from `panels` to `items`
- Existing `AboutRow.svelte` replaced (was placeholder)
- Content JSON structure changes

**Backwards compatibility:**
- Navigation patterns unchanged for other rows
- Camera controller API unchanged
- Design tokens additive (no removals)

## Future Enhancements

- Navigation dots/progress indicator (1 of 4)
- Dark mode theme variant
- Animated tile transitions
- Swipe gesture support (already works via existing gesture handling)
- Lazy load tile content for performance

## Summary

**What changes:**
1. Schema: Replace panels with items array
2. Content: Restructure about row data
3. Navigation: Add 'about' to gallery types
4. Routes: Create `/about/[slug]/+page.svelte`
5. Components: New `AboutTile.svelte`
6. Design system: Create tokens and store

**What stays the same:**
- Camera controller logic
- Positioning system
- Core navigation patterns
- Existing row behaviors

The result: About tiles behave exactly like film/photo galleries, with horizontal navigation maintaining synchronized positions while integrating seamlessly with the existing keyboard shortcuts and camera system.
