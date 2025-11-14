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
  import { filterCategory, type FilterCategory } from '$lib/stores/ui';

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

  const shouldShowRow = (row: Row, filter: FilterCategory) => {
    switch (filter) {
      case 'video':
        return row.type === 'filmGallery' || row.type === 'showreel';
      case 'photo':
        return row.type === 'photoGallery';
      case 'content':
        return row.type === 'about' || row.type === 'services' || row.type === 'contact';
      case 'all':
      default:
        return true;
    }
  };

  const onFilterChange = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value as FilterCategory;
    if (value !== $filterCategory) {
      filterCategory.set(value);
      // Reset view to grid so positions remain intuitive after filter change
      void api.zoomOutToGrid();
    }
  };

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
  .topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 15; /* below contact CTA (z-index: 20) */
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.0));
    color: white;
    pointer-events: auto;
  }
  .topbar label {
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.9;
  }
  .topbar select {
    appearance: none;
    background: rgba(255,255,255,0.96);
    color: #111;
    border: 0;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 14px;
    letter-spacing: 0.02em;
    cursor: pointer;
  }
  .topbar select:focus-visible {
    outline: 2px solid #bbb;
    outline-offset: 2px;
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
  <div class="topbar" role="region" aria-label="Filter content">
    <label for="grid-filter">Filter:</label>
    <select id="grid-filter" value={$filterCategory} on:change={onFilterChange} aria-label="Filter grid"
      title="Filter grid by category">
      <option value="all">All</option>
      <option value="video">Video</option>
      <option value="photo">Photo</option>
      <option value="content">Content</option>
    </select>
  </div>
  <div class="stack" style={`transform:${transform}`}>
    <!-- Media overlay layer (visible in grid state) -->
    <SiteGalleryLayer {rows} />
    {#each rows as row, i (row.slug)}
      {@const RowComponent = resolve(row.type)}
      {#if RowComponent}
        <div
          class="row"
          style={`transform:translate3d(0, calc(${i * 100}vh + ${i} * ${tileSpacing}), 0); display: ${shouldShowRow(row, $filterCategory) ? 'block' : 'none'};`}
          on:click={() => handleRowClick(row)}
          on:keydown={(event) => handleRowKeyDown(row, event)}
          role="button"
          tabindex="0"
          aria-label={`Focus ${row.title ?? row.slug}`}
          aria-hidden={!shouldShowRow(row, $filterCategory)}
          data-row-type={row.type}
          data-row-slug={row.slug}
        >
          <svelte:component this={RowComponent} row={row} />
        </div>
      {/if}
    {/each}
  </div>
</div>
