import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { rowSlugs } from '$lib/content';

export const load: PageLoad = ({ params }) => {
  const { row } = params;
  if (!rowSlugs.has(row)) {
    throw error(404, `Row '${row}' not found`);
  }
  return { target: { kind: 'row', rowSlug: row } };
};

