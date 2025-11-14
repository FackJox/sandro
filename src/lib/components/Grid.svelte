<script lang="ts">
  import { rows as contentRows } from '$lib/content';
  import HeroRow from '$lib/rows/HeroRow.svelte';
  import ShowreelRow from '$lib/rows/ShowreelRow.svelte';
  import ServicesRow from '$lib/rows/ServicesRow.svelte';
  import ContactRow from '$lib/rows/ContactRow.svelte';
  import AboutRow from '$lib/rows/AboutRow.svelte';
  import SiteGalleryLayer from '$lib/gallery/SiteGalleryLayer.svelte';

  import { camera, focus, api } from '$lib/stores/camera';
  import type { Row } from '$lib/content';
  import { spacing } from '$lib/utopia/tokens';

  const hiddenRowTypes = new Set<Row['type']>(['photoGallery', 'filmGallery']);
  const rows: ReadonlyArray<Row> = contentRows.filter((row) => !hiddenRowTypes.has(row.type));
  const tileSpacing = spacing.s5;

  const resolve = (type: string) => {
    switch (type) {
      case 'hero': return HeroRow;
      case 'about': return AboutRow;
      case 'showreel': return ShowreelRow;
      case 'services': return ServicesRow;
      case 'contact': return ContactRow;
      default: return HeroRow;
    }
  };

  $: translateX = (-$camera.x).toFixed(2);
  $: translateY = (-$camera.y).toFixed(2);
  $: scale = $camera.scale.toFixed(4);
  $: transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;

  const activateRow = (row: Row) => {
    if ($focus.kind !== 'grid') return;
    const tileIndex = row.type === 'about' && Array.isArray(row.items) && row.items.length > 0 ? 0 : undefined;
    void api.focusRow(row.slug, tileIndex);
  };

  const handleRowClick = (row: Row) => {
    activateRow(row);
  };

  const handleRowKeyDown = (row: Row, event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activateRow(row);
  };
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
    <!-- Media overlay layer (visible in grid state) -->
    <SiteGalleryLayer {rows} />
    {#each rows as row, i (row.slug)}
      {@const RowComponent = resolve(row.type)}
      {#if RowComponent}
        <div
          class="row"
          style={`transform:translate3d(0, calc(${i * 100}vh + ${i} * ${tileSpacing}), 0);`}
          on:click={() => handleRowClick(row)}
          on:keydown={(event) => handleRowKeyDown(row, event)}
          role="button"
          tabindex="0"
          aria-label={`Focus ${row.title ?? row.slug}`}
        >
          <svelte:component this={RowComponent} row={row} />
        </div>
      {/if}
    {/each}
  </div>
</div>
