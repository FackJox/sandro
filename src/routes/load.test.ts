import { describe, expect, it } from 'vitest';
import { load as rootLoad } from './+page';
import { load as rowLoad } from './[row]/+page';
import { load as photoLoad } from './photo/[slug]/+page';
import { load as filmLoad } from './film/[slug]/+page';
import { rows } from '$lib/content';

const getSampleRowSlug = () => rows[0]?.slug ?? 'hero';

const getSamplePhotoSlug = () => {
  const photoRow = rows.find((row) => row.type === 'photoGallery');
  if (!photoRow) {
    throw new Error('Missing photo gallery row in content fixture');
  }
  if (photoRow.items.length === 0) {
    throw new Error('Missing photo item in content fixture');
  }
  return photoRow.items[0].slug;
};

const getSampleFilmSlug = () => {
  const filmRow = rows.find((row) => row.type === 'filmGallery');
  if (!filmRow) {
    throw new Error('Missing film gallery row in content fixture');
  }
  if (filmRow.items.length === 0) {
    throw new Error('Missing film item in content fixture');
  }
  return filmRow.items[0].slug;
};

describe('route load functions', () => {
  it('root load returns hero row target', () => {
    const result = rootLoad({} as any);

    expect(result).toEqual({
      target: { kind: 'row', rowSlug: 'hero' }
    });
  });

  it('row load resolves known slug', () => {
    const sampleSlug = getSampleRowSlug();
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

  it('photo load resolves known slug', () => {
    const slug = getSamplePhotoSlug();
    const result = photoLoad({ params: { slug } } as any);

    expect(result).toEqual({
      target: { kind: 'tile', rowSlug: 'photo', tileSlug: slug }
    });
  });

  it('photo load throws 404 for unknown slug', () => {
    try {
      photoLoad({ params: { slug: 'missing-photo' } } as any);
      throw new Error('Expected failure for missing photo');
    } catch (error) {
      expect((error as { status: number }).status).toBe(404);
    }
  });

  it('film load resolves known slug', () => {
    const slug = getSampleFilmSlug();
    const result = filmLoad({ params: { slug } } as any);

    expect(result).toEqual({
      target: { kind: 'tile', rowSlug: 'film', tileSlug: slug }
    });
  });

  it('film load throws 404 for unknown slug', () => {
    try {
      filmLoad({ params: { slug: 'missing-film' } } as any);
      throw new Error('Expected failure for missing film');
    } catch (error) {
      expect((error as { status: number }).status).toBe(404);
    }
  });
});
