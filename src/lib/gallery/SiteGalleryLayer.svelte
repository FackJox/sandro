<script lang="ts">
  import { onMount } from 'svelte';
  import { gutters, tileOrigin, tileSize } from '$lib/config/geometry';
  import { rows as contentRows, type Row } from '$lib/content';
  import { galleryPhotos, galleryVideos } from '$lib/content/gallery';

  import VideoTile from './VideoTile.svelte';
  import PhotoTile from './PhotoTile.svelte';
  import VideoPlayerModal from './VideoPlayerModal.svelte';
  import Lightbox from './Lightbox.svelte';

  export let rows: ReadonlyArray<Row> = contentRows;

  // Row indices
  $: aboutIndex = rows.findIndex((r) => r.type === 'about');
  $: heroIndex = rows.findIndex((r) => r.type === 'hero');
  $: showreelIndex = rows.findIndex((r) => r.type === 'showreel');
  $: contactIndex = rows.findIndex((r) => r.type === 'contact');
  $: servicesIndex = rows.findIndex((r) => r.type === 'services');

  // Height equals content tile height
  const { gx } = gutters();
  const yAt = (rowIndex: number) => tileOrigin(0, rowIndex).y;

  type VideoEntry =
    | { kind: 'youtube'; slug: string; title?: string }
    | { kind: 'local'; slug: string; title?: string; src: string; poster?: string }
    | { kind: 'external'; slug: string; title?: string; externalUrl: string; poster?: string };

  const videos: VideoEntry[] = [];
  for (const video of galleryVideos) {
    if (video.type === 'youtube') {
      videos.push({ kind: 'youtube', slug: video.slug, title: video.title });
      continue;
    }
    if (video.type === 'local' && video.src) {
      videos.push({ kind: 'local', slug: video.slug, title: video.title, src: video.src, poster: video.poster });
      continue;
    }
    if (video.type === 'external' && video.externalUrl) {
      videos.push({
        kind: 'external',
        slug: video.slug,
        title: video.title,
        externalUrl: video.externalUrl,
        poster: video.poster
      });
    }
  }

  const normalizePhotos = () =>
    galleryPhotos.map((photo) => ({ src: photo.src, alt: photo.alt, slug: photo.slug }));

  // Computed positions (recomputed when viewport changes)
  type Positioned<T> = T & { x:number; y:number; h:number; aspect:number };
  type PositionedTrack<T> = { rowIndex: number; entries: Array<Positioned<T>> };

  let videoTracks: Array<PositionedTrack<VideoEntry>> = [];
  let photoTracks: Array<PositionedTrack<{ src:string; alt?:string; slug:string }>> = [];

  const photoAspect = new Map<string, number>();

  const anchorIndices = (...candidates: number[]) => candidates.filter((index) => index >= 0);

  const distributeToAnchors = <T,>(items: T[], anchors: number[]) => {
    if (anchors.length === 0) return [];
    const groups = anchors.map((rowIndex) => ({ rowIndex, items: [] as T[] }));
    items.forEach((item, index) => {
      groups[index % groups.length]?.items.push(item);
    });
    return groups;
  };

  const recompute = () => {
    const t = tileSize();
    const h = t.h;
    const startX = (rowIndex: number) => tileOrigin(0, rowIndex).x + t.w + gx;
    const build = <T,>(
      items: T[],
      rowIndex: number,
      defaultAspect: number,
      widthFor?: (item: T) => number,
      side: 'left' | 'right' = 'right'
    ) => {
      let x = side === 'right' ? startX(rowIndex) : tileOrigin(0, rowIndex).x - gx;
      return items.map((item) => {
        const aspect = defaultAspect;
        const w = widthFor ? widthFor(item) : h * aspect;
        const resX = side === 'right' ? x : x - w;
        const res = { ...(item as any), x: resX, y: yAt(rowIndex), h, aspect } as Positioned<any>;
        x = side === 'right' ? resX + w + gx : resX - gx;
        return res;
      });
    };
    const videoAnchors = anchorIndices(aboutIndex, showreelIndex);
    const videoGroups = distributeToAnchors(videos, videoAnchors);
    videoTracks = videoGroups.map(({ rowIndex, items }) => ({
      rowIndex,
      entries: build(items, rowIndex, 16 / 9)
    }));

    const photoWidth = (item: { slug: string }) => h * (photoAspect.get(item.slug) ?? 3 / 2);
    const photoAnchors = anchorIndices(heroIndex, contactIndex, servicesIndex);
    const photoGroups = distributeToAnchors(normalizePhotos(), photoAnchors);
    photoTracks = photoGroups.flatMap(({ rowIndex, items }) => {
      const left = build(items.filter((__, index) => index % 2 === 1), rowIndex, 3 / 2, photoWidth, 'left');
      const right = build(items.filter((__, index) => index % 2 === 0), rowIndex, 3 / 2, photoWidth, 'right');
      const tracks: Array<PositionedTrack<{ src: string; alt?: string; slug: string }>> = [];
      if (left.length) tracks.push({ rowIndex, entries: left });
      if (right.length) tracks.push({ rowIndex, entries: right });
      return tracks;
    });
  };

  $: if (rows) {
    recompute();
  }

  const handlePhotoResize = (slug: string, aspect: number) => {
    photoAspect.set(slug, aspect);
    recompute();
  };

  onMount(() => {
    const onResize = () => recompute();
    recompute();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  // Modal state
  let videoModal: { kind:'youtube'|'video'; src:string; title?:string } | null = null;
  let lightbox: { src:string; alt?:string } | null = null;

  const openVideo = (entry: VideoEntry) => {
    if (entry.kind === 'youtube') {
      videoModal = { kind: 'youtube', src: `https://www.youtube.com/embed/${entry.slug}`, title: entry.title };
      return;
    }
    if (entry.kind === 'local') {
      videoModal = { kind: 'video', src: entry.src, title: entry.title };
      return;
    }
    if (entry.kind === 'external') {
      const url = entry.externalUrl;
      if (typeof window !== 'undefined') {
        const opened = window.open(url, '_blank', 'noopener');
        if (!opened) {
          window.location.assign(url);
        }
      }
    }
  };

  const openPhoto = (src: string, alt?: string) => {
    lightbox = { src, alt };
  };
</script>

<div class="layer">
  {#each videoTracks as track}
    {#each track.entries as entry (entry.slug)}
      <VideoTile
        x={entry.x}
        y={entry.y}
        h={entry.h}
        youtube={entry.kind === 'youtube' ? { id: entry.slug, title: entry.title } : null}
        server={entry.kind !== 'youtube' ? { slug: entry.slug, title: entry.title, poster: entry.poster } : null}
        previewSrc={null}
        on:play={() => openVideo(entry)}
      />
    {/each}
  {/each}

  {#each photoTracks as track}
    {#each track.entries as p (p.slug)}
      <PhotoTile
        x={p.x}
        y={p.y}
        h={p.h}
        src={p.src}
        alt={p.alt}
        on:open={() => openPhoto(p.src, p.alt)}
        on:resize={(event) => handlePhotoResize(p.slug, event.detail.aspect)}
      />
    {/each}
  {/each}
</div>

  {#if videoModal}
    <VideoPlayerModal
      title={videoModal.title || ''}
      kind={videoModal.kind}
      src={videoModal.src}
      on:close={() => (videoModal = null)}
    />
  {/if}
  {#if lightbox}
    <Lightbox src={lightbox.src} alt={lightbox.alt || ''} on:close={() => (lightbox = null)} />
  {/if}

<style>
  .layer {
    position: absolute;
    inset: 0;
    pointer-events: none; /* tiles enable interaction individually */
    z-index: 10; /* above base rows in grid view */
  }
  .layer :global(.media-tile) {
    pointer-events: auto;
  }
</style>
