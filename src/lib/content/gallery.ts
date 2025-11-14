import { rows, type Row } from '$lib/content';
import youtubeIds from '$lib/content/youtube.json';

export type GalleryPhoto = {
  slug: string;
  src: string;
  alt: string;
  title?: string;
};

export type GalleryVideo = {
  slug: string;
  title?: string;
  poster?: string;
  src?: string;
  externalUrl?: string;
  type: 'local' | 'external' | 'youtube';
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');

const photoRow = rows.find((row): row is Extract<Row, { type: 'photoGallery' }> => row.type === 'photoGallery');
const filmRow = rows.find((row): row is Extract<Row, { type: 'filmGallery' }> => row.type === 'filmGallery');
const showreelRow = rows.find((row): row is Extract<Row, { type: 'showreel' }> => row.type === 'showreel');

const toPublicAssetUrl = (url?: string | null) => {
  if (!url) return undefined;
  return url.startsWith('/static/') ? url.slice('/static'.length) : url;
};

const showreelPhotoSlugs = new Set<string>();
if (showreelRow) {
  for (const still of showreelRow.stills) {
    const name = still.split('/').pop() ?? '';
    const slug = slugify(name.replace(/\.[^/.]+$/, ''));
    if (slug) showreelPhotoSlugs.add(slug);
  }
}

const basePhotos: GalleryPhoto[] = photoRow
  ? photoRow.items.map((item) => ({ slug: item.slug, src: item.image, alt: item.title ?? item.slug, title: item.title }))
  : [];

const portfolioPhotoEntries = [
  ...Object.entries(
    import.meta.glob('/static/images/portfolio/photos/**/*.{avif,webp,jpg,jpeg,png}', {
      eager: true,
      as: 'url'
    })
  ),
  ...Object.entries(
    import.meta.glob('/static/portfolio/**/*.{avif,webp,jpg,jpeg,png}', {
      eager: true,
      as: 'url'
    })
  )
];

const portfolioPhotos: GalleryPhoto[] = portfolioPhotoEntries.map(([path, url]) => {
  const name = path.split('/').pop() ?? 'photo';
  const slug = slugify(name.replace(/\.[^/.]+$/, ''));
  return {
    slug,
    src: toPublicAssetUrl(url) ?? url,
    alt: slug.replace(/-/g, ' ')
  } satisfies GalleryPhoto;
});

const allPhotosMap = new Map<string, GalleryPhoto>();
for (const photo of [...basePhotos, ...portfolioPhotos]) {
  if (showreelPhotoSlugs.has(photo.slug)) continue;
  allPhotosMap.set(photo.slug, photo);
}

export const galleryPhotos = Array.from(allPhotosMap.values());

const videoModuleEntries = Object.entries(
  import.meta.glob('/static/videos/**/*.{mp4,webm,m4v,mov}', {
    eager: true,
    as: 'url'
  })
).filter(([path]) => !path.includes('/previews/')) as Array<[string, string]>;

const videoModules = Object.fromEntries(videoModuleEntries) as Record<string, string>;

const posterEntries = [
  ...Object.entries(
    import.meta.glob('/static/images/film/**/*.{avif,webp,jpg,jpeg,png}', {
      eager: true,
      as: 'url'
    })
  ),
  ...Object.entries(
    import.meta.glob('/static/images/portfolio/photos/**/*.{avif,webp,jpg,jpeg,png}', {
      eager: true,
      as: 'url'
    })
  )
].map(([path, url]) => [path, url as string]) as Array<[string, string]>;

const posters = Object.fromEntries(posterEntries) as Record<string, string>;

const baseVideos: GalleryVideo[] = filmRow
  ? filmRow.items.map((item) => {
      const localSrc =
        videoModules[`/static/videos/${item.slug}.mp4`] ??
        videoModules[`/static/videos/${item.slug}.webm`] ??
        (videoModuleEntries.find(([path]) => path.includes(`/static/videos/${item.slug}/`))?.[1] as
          | string
          | undefined);
      const normalizedSrc = toPublicAssetUrl(localSrc);
      return {
        slug: item.slug,
        title: item.title,
        poster: posters[`/static${item.poster}`] ?? item.poster,
        src: normalizedSrc,
        externalUrl: item.externalUrl,
        type: normalizedSrc ? 'local' : 'external'
      } satisfies GalleryVideo;
    })
  : [];

const portfolioVideoModules = [
  ...Object.entries(
    import.meta.glob('/static/videos/portfolio/**/*.{mp4,webm,m4v,mov}', {
      eager: true,
      as: 'url'
    })
  ),
  ...Object.entries(
    import.meta.glob('/static/portfolio/**/*.{mp4,webm,m4v,mov}', {
      eager: true,
      as: 'url'
    })
  )
].map(([path, url]) => [path, url as string]) as Array<[string, string]>;

const portfolioVideos: GalleryVideo[] = portfolioVideoModules.map(([path, url]) => {
  const name = path.split('/').pop() ?? 'video';
  const slug = slugify(name.replace(/\.[^/.]+$/, ''));
  const posterCandidate =
    posters[`/static/images/portfolio/photos/${slug}.avif`] ||
    posters[`/static/images/portfolio/photos/${slug}.jpg`];
  const normalizedSrc = toPublicAssetUrl(url) ?? url;
  return {
    slug,
    title: slug.replace(/-/g, ' '),
    poster: posterCandidate,
    src: normalizedSrc,
    type: 'local'
  } satisfies GalleryVideo;
});

const youtubeVideos: GalleryVideo[] = (Array.isArray(youtubeIds) ? youtubeIds : []).map((id) => ({
  slug: slugify(id),
  title: id,
  type: 'youtube'
}));

const videoMap = new Map<string, GalleryVideo>();
for (const video of [...baseVideos, ...portfolioVideos, ...youtubeVideos]) {
  videoMap.set(video.slug, video);
}

export const galleryVideos = Array.from(videoMap.values());
