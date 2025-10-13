import { describe, expect, it } from 'vitest';
import {
  ContentLookupError,
  findFilmItem,
  findPhotoItem,
  findRow,
  getFilmItem,
  getPhotoItem,
  getRow,
  rowSlugs,
  rows
} from './index';

const getPhotoSampleSlug = () => {
  const photoRow = rows.find((row) => row.type === 'photoGallery');
  if (!photoRow) {
    throw new Error('Test fixture missing photoGallery row');
  }
  if (photoRow.items.length === 0) {
    throw new Error('Test fixture missing photo item');
  }
  return photoRow.items[0].slug;
};

const getFilmSampleSlug = () => {
  const filmRow = rows.find((row) => row.type === 'filmGallery');
  if (!filmRow) {
    throw new Error('Test fixture missing filmGallery row');
  }
  if (filmRow.items.length === 0) {
    throw new Error('Test fixture missing film item');
  }
  return filmRow.items[0].slug;
};

describe('content helpers', () => {
  it('exposes unique row slugs', () => {
    expect(rows.length).toBeGreaterThan(0);
    expect(rowSlugs.size).toBe(rows.length);
  });

  it('findRow returns a row when slug exists', () => {
    const slug = rows[0]?.slug;
    expect(slug).toBeTruthy();
    expect(findRow(slug!)).toBeDefined();
  });

  it('getRow returns the typed row when slug exists', () => {
    const slug = rows[0]?.slug;
    expect(slug).toBeTruthy();
    const result = getRow(slug!);
    expect(result.slug).toBe(slug);
  });

  it('getRow throws descriptive error when slug is missing', () => {
    expect(() => getRow('missing-row')).toThrowError(
      new ContentLookupError('row', 'missing-row')
    );
  });

  it('getPhotoItem resolves known photo slugs', () => {
    const slug = getPhotoSampleSlug();
    const viaFind = findPhotoItem(slug);
    expect(viaFind?.slug).toBe(slug);
    expect(getPhotoItem(slug).slug).toBe(slug);
  });

  it('getPhotoItem throws descriptive error for unknown slug', () => {
    expect(() => getPhotoItem('missing-photo')).toThrowError(
      new ContentLookupError('photo', 'missing-photo')
    );
  });

  it('getFilmItem resolves known film slugs', () => {
    const slug = getFilmSampleSlug();
    const viaFind = findFilmItem(slug);
    expect(viaFind?.slug).toBe(slug);
    expect(getFilmItem(slug).slug).toBe(slug);
  });

  it('getFilmItem throws descriptive error for unknown slug', () => {
    expect(() => getFilmItem('missing-film')).toThrowError(
      new ContentLookupError('film', 'missing-film')
    );
  });
});
