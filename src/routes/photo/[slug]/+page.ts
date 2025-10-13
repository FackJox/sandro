import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getPhotoItem } from '$lib/content';

export const load: PageLoad = ({ params }) => {
  const { slug } = params;
  const item = getPhotoItem(slug);
  if (!item) {
    throw error(404, `Photo '${slug}' not found`);
  }
  return { target: { kind: 'tile', rowSlug: 'photo', tileSlug: slug } };
};

