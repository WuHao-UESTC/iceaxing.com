import { createClient } from 'next-sanity';
import { validateEnv } from '@/lib/env';

validateEnv();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN,
});

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'previewDrafts',
  token: process.env.SANITY_API_READ_TOKEN,
  stega: {
    enabled: true,
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
  },
});

/**
 * Returns the appropriate Sanity client based on preview mode.
 * In preview mode (draft mode), uses a client that fetches drafts
 * and encodes stega source maps for Visual Editing.
 */
export function getClient(preview: boolean) {
  return preview ? previewClient : client;
}
