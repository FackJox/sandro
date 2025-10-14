<script lang="ts">
  import content from '$lib/content/content.json';
  import HeroRow from '$lib/rows/HeroRow.svelte';
  import AboutRow from '$lib/rows/AboutRow.svelte';
  import ShowreelRow from '$lib/rows/ShowreelRow.svelte';
  import ServicesRow from '$lib/rows/ServicesRow.svelte';
  import ContactRow from '$lib/rows/ContactRow.svelte';
  import PhotoRow from '$lib/rows/PhotoRow.svelte';
  import FilmRow from '$lib/rows/FilmRow.svelte';

  import { camera } from '$lib/stores/camera';

  const rows = content.rows;

  const resolve = (type: string) => {
    switch (type) {
      case 'hero': return HeroRow;
      case 'about': return AboutRow;
      case 'showreel': return ShowreelRow;
      case 'services': return ServicesRow;
      case 'contact': return ContactRow;
      case 'photoGallery': return PhotoRow;
      case 'filmGallery': return FilmRow;
      default: return HeroRow;
    }
  };

  $: translateX = (-$camera.x).toFixed(2);
  $: translateY = (-$camera.y).toFixed(2);
  $: scale = $camera.scale.toFixed(4);
  $: transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
</script>

<style>
  .grid {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
  .stack {
    position: absolute;
    top: 0; left: 0;
    will-change: transform;
    transform-origin: top left;
  }
  .row {
    position: absolute;
    width: 100vw;
    height: 100vh;
    transform-origin: top left;
  }
</style>

<div class="grid">
  <div class="stack" style={`transform:${transform}`}>
    {#each rows as row, i (row.slug)}
      {@const RowComponent = resolve(row.type)}
      {#if RowComponent}
        <svelte:component
          this={RowComponent}
          row={row}
          class="row"
          style={`transform:translate3d(0, ${i * 100}vh, 0);`}
        />
      {/if}
    {/each}
  </div>
</div>
