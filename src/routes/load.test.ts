import { describe, expect, it } from 'vitest';
import { load as rootLoad } from './+page';
import { load as rowLoad } from './[row]/+page';
import { rows } from '$lib/content';

describe('route load functions', () => {
  it('root load returns hero row target', () => {
    const result = rootLoad();

    expect(result).toEqual({
      target: { kind: 'row', rowSlug: 'hero' }
    });
  });

  it('row load resolves known slug', () => {
    const sampleSlug = rows[0]?.slug ?? 'hero';
    const result = rowLoad({ params: { row: sampleSlug } } as any);

    expect(result).toEqual({
      target: { kind: 'row', rowSlug: sampleSlug }
    });
  });

  it('row load throws 404 for unknown slug', () => {
    try {
      rowLoad({ params: { row: 'missing-row' } } as any);
      throw new Error('Expected failure for missing row');
    } catch (error) {
      expect((error as { status: number }).status).toBe(404);
    }
  });
});
