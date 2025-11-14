<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let x = 0;
  export let y = 0;
  export let h = 0; // height equals content tile height
  export let src = '';
  export let alt = '';

  let aspect = 3/2;
  let width = Math.max(1, h * aspect);
  $: width = Math.max(1, h * aspect);

  const dispatch = createEventDispatcher<{ open: void; resize: { aspect: number } }>();
  const onLoad = (e: Event) => {
    const img = e.currentTarget as HTMLImageElement;
    if (img.naturalWidth && img.naturalHeight) {
      aspect = img.naturalWidth / img.naturalHeight;
      dispatch('resize', { aspect });
    }
  };
</script>

<div class="media-tile" style={`transform:translate3d(${x}px, ${y}px, 0); width:${width}px; height:${h}px;`}>
  <button class="surface" on:click={() => dispatch('open')} aria-label={`Open ${alt || 'photo'}`}>
    <img src={src} alt={alt} on:load={onLoad} />
  </button>
</div>

<style>
  .media-tile { position: absolute; top: 0; left: 0; border-radius: 8px; overflow: hidden; background: #000; }
  .surface { position: relative; width: 100%; height: 100%; padding: 0; border: 0; background: transparent; cursor: zoom-in; }
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
