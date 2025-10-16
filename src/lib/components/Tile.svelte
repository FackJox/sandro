<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
</script>

<style>
  .tile {
    width: 100vw;
    height: 100vh;
    display: grid;
    place-items: center;
    background: #708090;
    color: white;
  }
  .title { font-size: clamp(20px, 4vw, 48px); letter-spacing: 0.05em; }
  .subtitle { opacity: 0.6; margin-top: 0.5em; }
  :global(.contact-cta) {
    position: fixed; top: 16px; right: 16px; z-index: 20;
  }
  @media (min-width: 768px) {
    :global(.contact-cta) { top: 24px; right: 24px; }
  }
  button.cta {
    background: white; color: #111; border: 0; padding: 8px 12px; cursor: pointer;
  }
  button.cta:hover { filter: brightness(0.95); }
  button.cta:active { filter: brightness(0.9); }
  button.cta:focus-visible { outline: 2px solid #bbb; outline-offset: 2px; }
  /* Placeholder styles; replace with design later */
</style>

<div class="tile" role="region" aria-label={title}>
  <div>
    {#if title}<div class="title">{title}</div>{/if}
    {#if subtitle}<div class="subtitle">{subtitle}</div>{/if}
  </div>
</div>
