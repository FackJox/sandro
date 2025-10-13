import contentData from './content.json';
import { describe, expect, it } from 'vitest';

type PhotoItem = { slug: string; title: string; image: string };
type FilmItem = { slug: string; title: string; poster: string; externalUrl: string };

describe('content.json', () => {
  const rows = contentData.rows;

  it('provides uniquely identified rows', () => {
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    const seen = new Set<string>();
    for (const row of rows) {
      expect(typeof row.slug).toBe('string');
      expect(row.slug).not.toHaveLength(0);
      expect(typeof row.type).toBe('string');

      expect(seen.has(row.slug)).toBe(false);
      seen.add(row.slug);
    }
  });

  it('matches expected structure for each row type', () => {
    for (const row of rows) {
      switch (row.type) {
        case 'photoGallery': {
          const items = row.items as PhotoItem[];
          expect(Array.isArray(items)).toBe(true);
          expect(items.length).toBeGreaterThan(0);
          for (const item of items) {
            expect(typeof item.slug).toBe('string');
            expect(item.slug).not.toHaveLength(0);
            expect(typeof item.title).toBe('string');
            expect(item.title).not.toHaveLength(0);
            expect(typeof item.image).toBe('string');
            expect(item.image.startsWith('/')).toBe(true);
          }
          break;
        }
        case 'filmGallery': {
          const items = row.items as FilmItem[];
          expect(Array.isArray(items)).toBe(true);
          expect(items.length).toBeGreaterThan(0);
          for (const item of items) {
            expect(typeof item.slug).toBe('string');
            expect(item.slug).not.toHaveLength(0);
            expect(typeof item.title).toBe('string');
            expect(item.title).not.toHaveLength(0);
            expect(typeof item.poster).toBe('string');
            expect(item.poster.startsWith('/')).toBe(true);
            expect(typeof item.externalUrl).toBe('string');
            expect(item.externalUrl.startsWith('http')).toBe(true);
          }
          break;
        }
        case 'services': {
          expect(Array.isArray(row.items)).toBe(true);
          expect(row.items.length).toBeGreaterThan(0);
          expect(typeof row.shutterstockUrl).toBe('string');
          expect(row.shutterstockUrl.startsWith('http')).toBe(true);
          expect(typeof row.shutterstockLogo).toBe('string');
          expect(row.shutterstockLogo.startsWith('/')).toBe(true);
          break;
        }
        case 'showreel': {
          expect(Array.isArray(row.stills)).toBe(true);
          expect(row.stills.length).toBeGreaterThan(0);
          for (const still of row.stills) {
            expect(typeof still).toBe('string');
            expect(still.startsWith('/')).toBe(true);
          }
          expect(typeof row.externalUrl).toBe('string');
          expect(row.externalUrl.startsWith('http')).toBe(true);
          break;
        }
        case 'about': {
          expect(Array.isArray(row.panels)).toBe(true);
          expect(row.panels.length).toBeGreaterThan(0);
          for (const panel of row.panels) {
            expect(typeof panel.kind).toBe('string');
          }
          break;
        }
        case 'hero':
        case 'contact': {
          expect(row.slug).toBeDefined();
          break;
        }
        default: {
          throw new Error(`Unexpected row type ${(row as { type: string }).type}`);
        }
      }
    }
  });
});
