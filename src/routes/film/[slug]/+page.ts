import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { ContentLookupError, getFilmItem } from '$lib/content';

export const load: PageLoad = ({ params }) => {
  const { slug } = params;
  try {
    getFilmItem(slug);
  } catch (cause) {
    if (cause instanceof ContentLookupError) {
      throw error(404, cause.message);
    }
    throw cause;
  }
  return { target: { kind: 'tile', rowSlug: 'film', tileSlug: slug } };
};
