# About Tiles & Centralized Design System

**Date:** 2025-10-28
**Status:** Approved

## Overview

Add four content tiles to the About section and establish a centralized, reactive design system using Svelte stores integrated with the existing Utopia fluid design tokens.

## Goals

1. Display four biography/story tiles in the About row with horizontal scroll
2. Centralize design tokens (typography, colors, spacing) for easy global changes
3. Enable runtime theme switching capability
4. Maintain existing tile patterns and UX consistency

## Architecture

### Design Token Store

**Location:** `src/lib/stores/designSystem.ts`

**Structure:**
```typescript
import { writable } from 'svelte/store';
import { spacing, type as utopiaType } from '$lib/utopia/tokens';

export const theme = writable({
  type: {
    bodySmall: '...',
    body: '...',
    bodyLarge: '...',
    h3: '...',
    h2: '...',
    h1: '...',
    display: '...'
  },
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
  spacing: spacing,
  weights: {
    light: 200,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8
  }
});
```

**Benefits:**
- Single source of truth for all design tokens
- Runtime theme switching (future dark mode, brand variations)
- Type-safe with TypeScript
- Reactive - changes cascade to all components

### Typography Scale Extension

**Location:** `src/lib/utopia/tokens.ts`

Add to existing tokens:
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

## Content Structure

### Schema Updates

**Location:** `src/lib/content/schema.ts`

Extend `aboutRowSchema` to support content and links:
```typescript
const aboutRowSchema = baseRow.extend({
  type: z.literal('about'),
  panels: z.array(aboutPanelSchema).min(1),
  content: z.record(z.string(), nonEmptyString).optional(),
  links: z.record(z.string(), z.object({
    text: nonEmptyString,
    url: urlSchema
  })).optional()
});
```

### Content Data

**Location:** `src/lib/content/content.json`

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

## Component Implementation

### AboutRow.svelte

**Responsibilities:**
- Horizontal scroll container with snap points
- Map panels to AboutPanel components
- Pass content and link data to children

**Layout:**
```svelte
<div class="scroll-container">
  {#each row.panels as panel, index}
    <AboutPanel
      {panel}
      content={row.content?.[panel.id]}
      link={row.links?.[panel.id]}
      position={{ current: index + 1, total: row.panels.length }}
    />
  {/each}
</div>
```

**CSS:**
- `display: flex`
- `overflow-x: auto`
- `scroll-snap-type: x mandatory`
- `scroll-behavior: smooth`

### AboutPanel.svelte

**Location:** `src/lib/components/AboutPanel.svelte` (new)

**Responsibilities:**
- Render single tile with content
- Handle hyperlink rendering
- Apply design tokens from store
- Accessibility markup

**Props:**
- `panel`: Panel config (kind, id)
- `content`: Text content string
- `link`: Optional link object
- `position`: Current position (1 of 4)

**Layout:**
- Full viewport tile (100vw x 100vh)
- Centered content with padding (`$theme.spacing.s6`)
- Typography using `$theme.type.body`
- Colors from `$theme.colors.*`

**Hyperlink rendering:**
- Parse content for link text
- Replace with `<a>` element
- Styles: underline on hover, proper focus states
- Attributes: `target="_blank"`, `rel="noopener noreferrer"`

## Styling & Accessibility

### Design Token Usage Pattern

Replace hardcoded values:
- `font-size: clamp(...)` → `$theme.type.h1`
- `opacity: 0.6` → `color: $theme.colors.textSecondary`
- `padding: 32px` → `padding: $theme.spacing.s5`

### Accessibility Requirements

- Semantic HTML: `<article>` for tiles
- Heading structure: Proper hierarchy
- ARIA labels: "About section, panel X of Y"
- Keyboard navigation: Native scroll with arrow keys
- Focus management: Visible focus rings on links
- Screen readers: Meaningful alt text and labels

### Responsive Behavior

- **Mobile:** Touch/swipe enabled, full viewport tiles
- **Desktop:** Mouse wheel, click-drag scrolling
- **All viewports:** Smooth scroll-snap behavior

## Testing Considerations

- Verify scroll snap on iOS Safari, Chrome, Firefox
- Test hyperlink focus states with keyboard
- Validate content.json against updated schema
- Check fluid typography at min/max viewports
- Ensure no layout shift during scroll
- Test theme store reactivity

## Future Enhancements

- Navigation dots indicator (1 of 4)
- Dark mode theme variant
- Animated transitions between tiles
- Keyboard shortcuts (arrow keys) for explicit navigation
- Progress indicator during scroll
