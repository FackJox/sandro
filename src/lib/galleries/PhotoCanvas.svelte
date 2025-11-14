<script lang="ts">
  import { Canvas, T } from '@threlte/core';
  import type { Row } from '$lib/content';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { actions, createGalleryState, reducer, type GalleryState } from './galleryState';
  import { masonry } from './masonry';
  import { preloadImage } from './preload';

  type PhotoGalleryRow = Extract<Row, { type: 'photoGallery' }>;

  type ZoomToggle = {
    zoomOut: () => void;
    restore: () => void;
    toggle: () => void;
    getState: () => unknown;
  };

  const DEFAULT_GAP = 16;
  const MIN_COLUMN_WIDTH = 320;
  const MAX_COLUMNS = 4;

  export let row: PhotoGalleryRow;
  export let zoomToggle: ZoomToggle = {
    zoomOut: () => {},
    restore: () => {},
    toggle: () => {},
    getState: () => undefined
  };

  const gallery = writable<GalleryState>(
    createGalleryState({
      mode: 'photo',
      tiles: row.items.map((item) => ({
        slug: item.slug,
        status: 'idle',
        aspect: 1,
        src: item.image,
        title: item.title
      }))
    })
  );

  const dispatch = (action: Parameters<typeof reducer>[1]) => {
    gallery.update((current) => reducer(current, action));
  };

  const computeLayout = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const viewport = { vw: window.innerWidth, vh: window.innerHeight };
    const layout = masonry({
      items: row.items.map((item) => ({
        slug: item.slug,
        aspect: 1
      })),
      viewport,
      gap: DEFAULT_GAP,
      minColumnWidth: MIN_COLUMN_WIDTH,
      maxColumns: MAX_COLUMNS
    });
    dispatch(actions.viewportChanged({ viewport, layout }));
  };

  onMount(() => {
    const resizeHandler = () => computeLayout();
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === '-') {
        zoomToggle?.zoomOut?.();
        dispatch(actions.requestExit());
      }
    };

    computeLayout();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeHandler);
      window.addEventListener('keydown', keyHandler);
    }

    row.items.forEach((item) => {
      dispatch(actions.preload({ slug: item.slug, status: 'loading' }));
      preloadImage(item.image).then((result) => {
        dispatch(
          actions.preload({
            slug: item.slug,
            status: result.status === 'success' ? 'loaded' : 'error'
          })
        );
      });
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('keydown', keyHandler);
      }
    };
  });

  $: snapshot = $gallery;
  $: layout = snapshot.layout;
  $: tiles = layout?.tiles.map((tile) => ({
    rect: tile,
    state: snapshot.tiles[tile.slug]
  }));
  $: ariaLabel = `${row.title ?? row.slug.toUpperCase()} gallery with ${row.items.length} photo${
    row.items.length === 1 ? '' : 's'
  }`;

  const cameraViewport = () => {
    const viewport = snapshot.viewport;
    const fallbackWidth = typeof window === 'undefined' ? viewport.vw : window.innerWidth;
    const fallbackHeight = typeof window === 'undefined' ? viewport.vh : window.innerHeight;
    return {
      left: 0,
      right: viewport.vw || fallbackWidth || 0,
      top: 0,
      bottom: viewport.vh || fallbackHeight || 0
    };
  };
</script>

<div
  class="gallery"
  aria-label={ariaLabel}
  data-gallery="photo"
  data-row={row.slug}
  tabindex="-1"
>
  <Canvas>
    <T.OrthographicCamera
      makeDefault
      left={cameraViewport().left}
      right={cameraViewport().right}
      top={cameraViewport().top}
      bottom={cameraViewport().bottom}
      near={-1000}
      far={1000}
      position={[0, 0, 10]}
    />
  </Canvas>
  <div
    class="tiles"
    style={`transform: translate3d(${snapshot.view.translation.x}px, ${snapshot.view.translation.y}px, 0) scale(${snapshot.view.scale});`}
  >
    {#if tiles}
      {#each tiles as tile (tile.rect.slug)}
        <div
          class="tile"
          data-tile={tile.rect.slug}
          data-testid={tile.state?.status === 'loaded' ? 'gallery-tile' : 'gallery-tile-skeleton'}
          style={`transform: translate3d(${tile.rect.x}px, ${tile.rect.y}px, 0); width: ${tile.rect.w}px; height: ${tile.rect.h}px;`}
        >
          {#if tile.state?.status === 'loaded'}
            <img alt={tile.state.title ?? tile.rect.slug} src={tile.state.src} />
          {:else}
            <div class="shimmer" />
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .gallery {
    position: relative;
    width: 100%;
    height: 100%;
    outline: none;
  }

  .tiles {
    position: absolute;
    inset: 0;
    will-change: transform;
  }

  .tile {
    position: absolute;
    overflow: hidden;
    border-radius: 8px;
    background: #111;
  }

  .tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .shimmer {
    width: 100%;
    height: 100%;
    background: linear-gradient(120deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
</style>
