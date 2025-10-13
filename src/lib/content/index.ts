import raw from './content.json';

export type RowType =
  | 'hero'
  | 'about'
  | 'showreel'
  | 'services'
  | 'contact'
  | 'photoGallery'
  | 'filmGallery';

export type BaseRow = { type: RowType; slug: string; title?: string };

export type PhotoItem = { slug: string; title: string; image: string };
export type FilmItem = { slug: string; title: string; poster: string; externalUrl: string };

export type Rows =
  | (BaseRow & { type: 'hero' | 'contact' })
  | (BaseRow & { type: 'about'; panels: any[] })
  | (BaseRow & { type: 'showreel'; stills: string[]; externalUrl: string })
  | (BaseRow & { type: 'services'; items: string[]; shutterstockUrl: string; shutterstockLogo: string })
  | (BaseRow & { type: 'photoGallery'; items: PhotoItem[] })
  | (BaseRow & { type: 'filmGallery'; items: FilmItem[] });

export type Content = { rows: Rows[] };

const content = raw as Content;

export const rows = content.rows;
export const rowSlugs = new Set(rows.map((r) => r.slug));

export const getRow = (slug: string) => rows.find((r) => r.slug === slug);

export const getPhotoItem = (slug: string) => {
  const row = rows.find((r) => r.type === 'photoGallery');
  if (row?.type === 'photoGallery') {
    return row.items.find((item) => item.slug === slug);
  }
  return undefined;
};

export const getFilmItem = (slug: string) => {
  const row = rows.find((r) => r.type === 'filmGallery');
  if (row?.type === 'filmGallery') {
    return row.items.find((item) => item.slug === slug);
  }
  return undefined;
};

