<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Grid from '$lib/components/Grid.svelte';
  import { api } from '$lib/stores/camera';
  import { initPointer } from '$lib/controls/pointer';
  import { initShortcuts } from '$lib/controls/shortcuts';

  let root: HTMLDivElement | null = null;

  onMount(() => {
    const disposePointer = root ? initPointer(root) : undefined;
    const disposeShortcuts = initShortcuts();
    const unsubscribe = page.subscribe(($page) => {
      const target = $page.data?.target;
      if (!target) return;
      if (target.kind === 'grid') {
        api.zoomOutToGrid();
      } else if (target.kind === 'row') {
        api.focusRow(target.rowSlug, target.tileIndex);
      } else if (target.kind === 'tile') {
        api.focusTile(target.rowSlug, target.tileSlug);
      }
    });
    return () => {
      disposePointer?.();
      disposeShortcuts?.();
      unsubscribe();
    };
  });
</script>

<style>
  .app {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #050505;
    color: white;
  }
</style>

<div class="app" bind:this={root}>
  <Grid />
  <slot />
</div>

