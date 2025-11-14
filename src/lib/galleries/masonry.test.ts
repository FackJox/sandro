import { describe, expect, it } from 'vitest';
import { masonry } from './masonry';

describe('masonry', () => {
  it('uses single column for narrow viewports', () => {
    const rects = masonry({
      items: [
        { slug: 'a', aspect: 4 / 3 },
        { slug: 'b', aspect: 3 / 4 }
      ],
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
