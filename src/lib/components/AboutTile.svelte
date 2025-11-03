<script lang="ts">
  import { theme } from '$lib/stores/designSystem';

  export let slug: string;
  export let content: string;
  export let link: { text: string; url: string } | undefined = undefined;
  export let position: { current: number; total: number };

  // HTML escape helper to prevent XSS
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Parse content and replace link text with anchor tag
  function renderContent(text: string, linkConfig?: { text: string; url: string }): string {
    if (!linkConfig) return text;
    // Don't create link if text is empty string (no replacement possible)
    if (linkConfig.text === '') return text;
    const escapedUrl = escapeHtml(linkConfig.url);
    const escapedText = escapeHtml(linkConfig.text);
    const linkHtml = `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="link">${escapedText}</a>`;
    return text.replace(linkConfig.text, linkHtml);
  }

  $: processedContent = renderContent(content, link);
  $: ariaLabel = `About, ${position.current} of ${position.total}`;
</script>

<style>
  .tile {
    width: 100vw;
    height: 100vh;
    display: grid;
    place-items: center;
  }

  .content-wrapper {
    max-width: 800px;
    padding: var(--spacing-s6);
  }

  .content {
    font-size: var(--type-body);
    line-height: var(--line-height-normal);
    font-weight: var(--weight-regular);
    color: var(--text-primary);
  }

  :global(.content a.link) {
    color: var(--text-link);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  :global(.content a.link:hover) {
    color: var(--text-link-hover);
    text-decoration: underline;
  }

  :global(.content a.link:focus-visible) {
    outline: 2px solid var(--interactive);
    outline-offset: 4px;
    border-radius: 2px;
  }
</style>

<article
  class="tile"
  role="region"
  aria-label={ariaLabel}
  data-slug={slug}
  style="
    --spacing-s6: {$theme.spacing.s6};
    --type-body: {$theme.type.body};
    --line-height-normal: {$theme.lineHeights.normal};
    --weight-regular: {$theme.weights.regular};
    --text-primary: {$theme.colors.textPrimary};
    --text-link: {$theme.colors.textLink};
    --text-link-hover: {$theme.colors.textLinkHover};
    --interactive: {$theme.colors.interactive};
    background: {$theme.colors.bgPrimary};
  "
>
  <div class="content-wrapper">
    <div class="content">
      {@html processedContent}
    </div>
  </div>
</article>
