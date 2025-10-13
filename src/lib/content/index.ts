import { ZodError } from 'zod';
import raw from './content.json';
import { contentSchema, type Content, type FilmItem, type PhotoItem, type Row } from './schema';

type LookupKind = 'row' | 'photo' | 'film';

const lookupLabels: Record<LookupKind, string> = {
  row: 'Row',
  photo: 'Photo item',
  film: 'Film item'
};

export class ContentValidationError extends Error {
  constructor(message: string, readonly issues?: string[], readonly cause?: unknown) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

export class ContentLookupError extends Error {
  constructor(readonly kind: LookupKind, readonly slug: string) {
    super(`${lookupLabels[kind]} '${slug}' not found in content.json`);
    this.name = 'ContentLookupError';
  }
}

const parseContent = (): Content => {
  try {
    return contentSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'content';
        return `${path}: ${issue.message}`;
      });
      throw new ContentValidationError(`Invalid content.json: ${issues.join('; ')}`, issues, error);
    }
    throw error;
  }
};

const content = parseContent();

const rowsBySlug = new Map(content.rows.map((row) => [row.slug, row] as const));

const photoRow = content.rows.find(
  (row): row is Extract<Row, { type: 'photoGallery' }> => row.type === 'photoGallery'
);
const filmRow = content.rows.find(
  (row): row is Extract<Row, { type: 'filmGallery' }> => row.type === 'filmGallery'
);

if (!photoRow || !filmRow) {
  // contentSchema ensures these exist, but this guards against runtime mutation.
  throw new ContentValidationError('Content is missing gallery rows after validation.');
}

const photoItemsBySlug = new Map(photoRow.items.map((item) => [item.slug, item] as const));
const filmItemsBySlug = new Map(filmRow.items.map((item) => [item.slug, item] as const));

export const rows = content.rows;
export const rowSlugs = new Set(rows.map((r) => r.slug));

export const findRow = (slug: string) => rowsBySlug.get(slug);
export const getRow = (slug: string) => {
  const row = findRow(slug);
  if (!row) {
    throw new ContentLookupError('row', slug);
  }
  return row;
};

export const findPhotoItem = (slug: string) => photoItemsBySlug.get(slug);
export const getPhotoItem = (slug: string) => {
  const item = findPhotoItem(slug);
  if (!item) {
    throw new ContentLookupError('photo', slug);
  }
  return item;
};

export const findFilmItem = (slug: string) => filmItemsBySlug.get(slug);
export const getFilmItem = (slug: string) => {
  const item = findFilmItem(slug);
  if (!item) {
    throw new ContentLookupError('film', slug);
  }
  return item;
};

export type { Content, FilmItem, PhotoItem, Row } from './schema';
