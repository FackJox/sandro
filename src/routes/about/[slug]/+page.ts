import { rows } from '$lib/content';
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const aboutRow = rows.find((row) => row.type === 'about');
  if (!aboutRow || aboutRow.type !== 'about') {
    throw error(404, 'About section not found');
  }

  const tileIndex = aboutRow.items.findIndex((i) => i.slug === params.slug);
  if (tileIndex === -1) {
    throw error(404, 'About tile not found');
  }

  return {
    target: {
      kind: 'tile' as const,
      rowSlug: 'about',
      tileSlug: params.slug,
      tileIndex
    }
  };
}
