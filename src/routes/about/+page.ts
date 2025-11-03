import { redirect } from '@sveltejs/kit';
import { rows } from '$lib/content';

export function load() {
  const aboutRow = rows.find((row) => row.type === 'about');
  const firstSlug = aboutRow?.items?.[0]?.slug ?? 'tile-1';
  throw redirect(307, `/about/${firstSlug}`);
}
