import { createClient } from 'next-sanity';
import { validateEnv } from '@/lib/env';

validateEnv();

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN,
});
