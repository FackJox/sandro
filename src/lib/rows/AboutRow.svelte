<script lang="ts">
  import Tile from '$lib/components/Tile.svelte';
  import type { Row } from '$lib/content';

  type AboutRowRow = Extract<Row, { type: 'about' }>;

  export let row: AboutRowRow;

  const title = row.title ?? row.slug.toUpperCase();
  const panelCount = row.items.length;
  const subtitle = `${panelCount} panel${panelCount === 1 ? '' : 's'} planned`;
</script>

<Tile {title} {subtitle} />
