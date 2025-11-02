<script lang="ts">
  import { onMount } from 'svelte';
  import { Canvas, T } from '@threlte/core';
  import type { Row } from '$lib/content';

  type FilmGalleryRow = Extract<Row, { type: 'filmGallery' }>;

  export let row: FilmGalleryRow;
  // TODO: implement masonry layout, pan/zoom, hit-testing, external open

  let viewport = { width: 1920, height: 1080 };
  $: filmCount = row.items.length;
  $: ariaLabel = `${row.title ?? row.slug.toUpperCase()} gallery with ${filmCount} film${filmCount === 1 ? '' : 's'}`;

  onMount(() => {
    const update = () => {
      viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  });
</script>

<div class="canvas-wrapper" aria-label={ariaLabel} data-row={row.slug}>
  <Canvas>
    <T.OrthographicCamera
      makeDefault
      left={0}
      right={viewport.width}
      top={0}
      bottom={viewport.height}
      near={-1000}
      far={1000}
      position={[0, 0, 10]}
    />
    <!-- Gallery content goes here -->
  </Canvas>
</div>

<style>
  .canvas-wrapper {
    position: absolute;
    inset: 0;
  }
</style>
