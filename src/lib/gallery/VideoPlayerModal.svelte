<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  export let title: string = '';
  export let kind: 'youtube' | 'video' = 'video';
  export let src: string = '';
  export let autoplay: boolean = true;

  const dispatch = createEventDispatcher<{ close: void }>();

  const close = () => dispatch('close');

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
  });
  onDestroy(() => {
    document.removeEventListener('keydown', onKeyDown);
  });
</script>

<div
  class="backdrop"
  role="dialog"
  aria-modal="true"
  tabindex="0"
  aria-label={title}
  on:click={close}
  on:keydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close(); }}
>
  <div class="modal" on:click|stopPropagation>
    {#if kind === 'youtube'}
      <iframe
        title={title}
        src={`${src}${src.includes('?') ? '&' : '?'}autoplay=${autoplay ? '1' : '0'}&rel=0`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      />
    {:else}
      <!-- svelte-ignore a11y-media-has-caption -->
      <video src={src} controls autoplay={autoplay} playsinline />
    {/if}
    <button class="close" on:click={close} aria-label="Close">✕</button>
  </div>
  
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    display: grid;
    place-items: center;
    z-index: 50;
  }
  .modal {
    position: relative;
    width: min(100vw, 1280px);
    aspect-ratio: 16 / 9;
    background: black;
  }
  iframe, video { width: 100%; height: 100%; display: block; }
  .close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: 0;
    padding: 6px 10px;
    cursor: pointer;
  }
</style>
