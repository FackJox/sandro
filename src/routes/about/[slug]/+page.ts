import { rows } from '$lib/content';
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const aboutRow = rows.find((row) => row.type === 'about');
  if (!aboutRow) {
    throw error(404, 'About section not found');
  }

  const item = aboutRow.items.find((i) => i.slug === params.slug);
  if (!item) {
    throw error(404, 'About tile not found');
  }

  return {
    item,
    row: aboutRow
  };
}
