<script lang="ts">
  import Tile from '$lib/components/Tile.svelte';
  import type { Row } from '$lib/content';

  type ShowreelRowRow = Extract<Row, { type: 'showreel' }>;

  export let row: ShowreelRowRow;

  const title = row.title ?? row.slug.toUpperCase();
  const stillCount = row.stills.length;
  const subtitle = `${stillCount} still${stillCount === 1 ? '' : 's'} · external link ready`;
</script>

<Tile {title} {subtitle} />
