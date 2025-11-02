<script lang="ts">
  import Tile from '$lib/components/Tile.svelte';
  import type { Row } from '$lib/content';

  type ServicesRowRow = Extract<Row, { type: 'services' }>;

  export let row: ServicesRowRow;

  const title = row.title ?? row.slug.toUpperCase();
  const subtitle = `${row.items.length} service${row.items.length === 1 ? '' : 's'} · Shutterstock ready`;
</script>

<Tile {title} {subtitle} />
