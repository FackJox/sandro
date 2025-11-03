<script lang="ts">
  import AboutTile from '$lib/components/AboutTile.svelte';

  export let data;

  const { item, row } = data;
  const currentIndex = row.items.findIndex((i) => i.slug === item.slug);
  const position = {
    current: currentIndex + 1,
    total: row.items.length
  };
</script>

<AboutTile slug={item.slug} content={item.content} link={item.link} {position} />
