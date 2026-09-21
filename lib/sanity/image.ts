import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImage } from './types';

// Image URLs only need public project details. This helper is also used by
// interactive content blocks, so it must not import the server API client.
const builder = createImageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
});

export function urlFor(source: SanityImage) {
  return builder.image(source);
}
