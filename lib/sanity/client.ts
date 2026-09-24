import { createClient } from 'next-sanity';
import type { QueryParams } from '@sanity/client';
import { validateEnv } from '@/lib/env';

validateEnv();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;

const publishedClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
  perspective: 'published',
  timeout: 12000,
  maxRetries: 3,
});

export const originClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN,
  timeout: 12000,
  maxRetries: 3,
});

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
  timeout: 12000,
  maxRetries: 3,
});

export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'previewDrafts',
  token: process.env.SANITY_API_READ_TOKEN,
  timeout: 12000,
  maxRetries: 3,
  stega: {
    enabled: true,
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
  },
});

const CACHEABLE_DOCUMENT_TYPES = [
  'about',
  'blog',
  'category',
  'collection',
  'friend',
  'log',
  'motto',
  'profile',
  'project',
  'siteSettings',
] as const;

export function sanityCacheTag(type: string) {
  return `sanity:${type}`;
}

function cacheTagsForQuery(query: string) {
  const tags = CACHEABLE_DOCUMENT_TYPES
    .filter((type) => query.includes(`"${type}"`) || query.includes(`'${type}'`))
    .map(sanityCacheTag);

  return tags.length > 0 ? tags : [sanityCacheTag('content')];
}

function fetchPublished<Result>(query: string, params: QueryParams = {}) {
  return publishedClient.fetch<Result>(query, params, {
    next: {
      revalidate: 3600,
      tags: cacheTagsForQuery(query),
    },
  });
}

function fetchPreview<Result>(query: string, params: QueryParams = {}) {
  return previewClient.fetch<Result>(query, params, { cache: 'no-store' });
}

export const client = {
  fetch: fetchPublished,
};

/**
 * Returns the appropriate Sanity client based on preview mode.
 * In preview mode (draft mode), uses a client that fetches drafts
 * and encodes stega source maps for Visual Editing.
 */
export function getClient(preview: boolean) {
  return {
    fetch: preview ? fetchPreview : fetchPublished,
  };
}
