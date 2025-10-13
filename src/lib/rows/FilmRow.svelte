<script lang="ts">
  import Tile from '$lib/components/Tile.svelte';
  import FilmCanvas from '$lib/galleries/FilmCanvas.svelte';
  export let row: any;
</script>

<div style="position: relative; width: 100vw; height: 100vh;">
  <Tile title="FILM" subtitle="2D masonry gallery (external links)" />
  <div style="position:absolute; inset:0;">
    <FilmCanvas {row} />
  </div>
</div>

