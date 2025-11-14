<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  type YoutubeVideo = { id: string; title?: string };
  type ServerVideo = { slug: string; title?: string; poster?: string };

  export let x = 0;
  export let y = 0;
  export let h = 0; // height equals content tile height (viewport)
  export let aspect = 16 / 9; // updated when metadata loads

  export let youtube: YoutubeVideo | null = null;
  export let server: ServerVideo | null = null;

  export let previewSrc: string | null = null; // /videos/previews/<slug>.mp4
  // Removed: videoSrc (unused)

  const dispatch = createEventDispatcher<{ play: void }>();

  let width = Math.max(1, h * aspect);
  $: width = Math.max(1, h * aspect);

  let videoEl: HTMLVideoElement | null = null;

  const onLoadedMetadata = () => {
    if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
      aspect = videoEl.videoWidth / videoEl.videoHeight;
    }
  };

  const onPlay = () => dispatch('play');
</script>

<div class="media-tile" style={`transform:translate3d(${x}px, ${y}px, 0); width:${width}px; height:${h}px;`}>
  <button
    type="button"
    class="surface"
    on:click={onPlay}
    aria-label={youtube?.title || server?.title || 'Play video'}
  >
    {#if previewSrc}
      <video
        bind:this={videoEl}
        class="preview"
        src={previewSrc}
        muted
        autoplay
        loop
        playsinline
        on:loadedmetadata={onLoadedMetadata}
      />
    {:else if server?.poster}
      <img class="poster" src={server.poster} alt={server.title || server.slug} />
    {/if}
    <span class="play">▶</span>
  </button>
</div>

<style>
  .media-tile { position: absolute; top: 0; left: 0; border-radius: 8px; overflow: hidden; background: #000; }
  .surface {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .preview, .poster { width: 100%; height: 100%; object-fit: cover; display: block; }
  .play {
    position: absolute;
    right: 16px;
    bottom: 16px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 1rem;
    line-height: 1;
    pointer-events: none;
  }

  .surface:focus-visible {
    outline: 2px solid rgba(255,255,255,0.8);
    outline-offset: 2px;
  }
</style>
