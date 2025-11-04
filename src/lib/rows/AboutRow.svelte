<script lang="ts">
  import Tile from '$lib/components/Tile.svelte';
  import AboutCanvas from '$lib/galleries/AboutCanvas.svelte';
  export let row: any;
</script>

<div style="position: relative; width: 100vw; height: 100vh;">
  <Tile title="ABOUT" subtitle="Biography & story" />
  <div style="position:absolute; inset:0;">
    <AboutCanvas {row} />
  </div>
</div>
