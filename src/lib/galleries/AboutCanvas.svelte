<script lang="ts">
  import AboutTile from '$lib/components/AboutTile.svelte';
  import type { Row } from '$lib/content';
  import { gutters } from '$lib/config/geometry';

  type AboutRow = Extract<Row, { type: 'about' }>;

  export let row: AboutRow;

  $: tiles = row.items || [];
  $: tileSpacing = gutters().gx;
</script>

<div class="about-canvas">
  {#each tiles as item, index (item.slug)}
    {@const position = { current: index + 1, total: tiles.length }}
    <div
      class="tile-wrapper"
      style="transform: translate3d(calc({index} * (100vw + {tileSpacing}px)), 0, 0);"
      data-tile-index={index}
    >
      <AboutTile slug={item.slug} content={item.content} link={item.link} {position} />
    </div>
  {/each}
</div>

<style>
  .about-canvas {
    position: absolute;
    inset: 0;
    width: 100vw;
    height: 100vh;
  }
  .tile-wrapper {
    position: absolute;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
  }
</style>
