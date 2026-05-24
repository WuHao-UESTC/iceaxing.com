# Sanity Data Restore Guide

## Prerequisites

- Node.js 22+ (for running Sanity CLI via npx)
- A Sanity auth token with write access to the target project (set as `SANITY_AUTH_TOKEN` env var, or run `npx sanity@3 login` first)
- Run these commands from the project root (where `sanity.config.ts` lives), or pass `--project <projectId>` explicitly

## Restore Steps

1. Download the latest `.tar.gz` from the `backup/` directory
2. From the project root directory, run:
   ```
   npx sanity@3 dataset import <file>.tar.gz production --replace
   ```
3. Verify all documents are accessible in the Studio

The `--replace` flag replaces all existing documents with the imported ones (full restore). Remove it to merge (append) the backup into the current dataset.
