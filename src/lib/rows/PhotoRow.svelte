<script lang="ts">
  import Tile from '$lib/components/Tile.svelte';
  import PhotoCanvas from '$lib/galleries/PhotoCanvas.svelte';
  export let row: any;
</script>

<div style="position: relative; width: 100vw; height: 100vh;">
  <Tile title="PHOTO" subtitle="2D masonry gallery (pan/zoom)" />
  <div style="position:absolute; inset:0;">
    <PhotoCanvas {row} />
  </div>
  <!-- The canvas will manage pointer capture when active -->
</div>

