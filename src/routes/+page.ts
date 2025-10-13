import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
  target: { kind: 'row', rowSlug: 'hero' }
});

