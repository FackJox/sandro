import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getFilmItem } from '$lib/content';

export const load: PageLoad = ({ params }) => {
  const { slug } = params;
  const item = getFilmItem(slug);
  if (!item) {
    throw error(404, `Film '${slug}' not found`);
  }
  return { target: { kind: 'tile', rowSlug: 'film', tileSlug: slug } };
};

