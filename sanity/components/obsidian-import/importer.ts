import type { SanityClient } from '@sanity/client';
import {
  contentFingerprint,
  deterministicObsidianDocumentId,
  hashObsidianContent,
  normalizeWikiLinks,
  prepareObsidianNote,
  splitMarkdownImages,
  type PreparedObsidianNote,
} from '../../../lib/obsidian/import-core';
import { markdownToPortableText, type PtBlock } from '../markdown-paste/markdownHandler';
import {
  resolveVaultImage,
  type VaultFileEntry,
  type VaultImageEntry,
  type VaultSnapshot,
} from './vault';

export type ExistingObsidianDocument = {
  _id: string;
  obsidianSource: string;
  obsidianContentHash?: string;
};

export type ImportStatus = 'new' | 'changed' | 'unchanged' | 'legacy';

export type PreviewImage = {
  target: string;
  source: string;
  kind: 'local' | 'remote' | 'missing';
  entry?: VaultImageEntry;
  size?: number;
  lastModified?: number;
};

export type ImportPreview = {
  entry: VaultFileEntry;
  note: PreparedObsidianNote;
  images: PreviewImage[];
  unresolvedImages: string[];
  contentHash: string;
  existing?: ExistingObsidianDocument;
  status: ImportStatus;
};

export type ImportDestination =
  | { mode: 'category'; categoryId: string }
  | { mode: 'project'; projectId: string; collectionId?: string };

export type ImportResult = {
  documentId: string;
  uploadedImages: number;
};

export type TaxonomyCategory = {
  _id: string;
  title: string;
  slug?: string;
};

export type TaxonomyProject = {
  _id: string;
  title: string;
  slug?: string;
  categoryId?: string;
};

export type TaxonomyCollection = {
  _id: string;
  title: string;
  slug?: string;
  projectId?: string;
};

export type ImportTaxonomy = {
  categories: TaxonomyCategory[];
  projects: TaxonomyProject[];
  collections: TaxonomyCollection[];
};

type SanityDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
};

export async function loadImportTaxonomy(client: SanityClient): Promise<ImportTaxonomy> {
  const [categories, projects, collections] = await Promise.all([
    client.fetch<TaxonomyCategory[]>(
      `*[_type == "category" && !(_id in path("drafts.**"))] | order(order asc, title asc) {
        _id, title, "slug": slug.current
      }`,
    ),
    client.fetch<TaxonomyProject[]>(
      `*[_type == "project" && !(_id in path("drafts.**"))] | order(order asc, title asc) {
        _id, title, "slug": slug.current, "categoryId": category._ref
      }`,
    ),
    client.fetch<TaxonomyCollection[]>(
      `*[_type == "collection" && !(_id in path("drafts.**"))] | order(order asc, title asc) {
        _id, title, "slug": slug.current, "projectId": project._ref
      }`,
    ),
  ]);
  return { categories, projects, collections };
}

export async function loadExistingObsidianDocuments(client: SanityClient) {
  const documents = await client.fetch<ExistingObsidianDocument[]>(
    `*[_type == "blog" && defined(obsidianSource)] {
      _id, obsidianSource, obsidianContentHash
    }`,
    {},
    { perspective: 'raw' },
  );
  const bySource = new Map<string, ExistingObsidianDocument>();
  for (const document of documents) {
    const current = bySource.get(document.obsidianSource);
    if (!current || document._id.startsWith('drafts.')) {
      bySource.set(document.obsidianSource, document);
    }
  }
  return bySource;
}

export async function prepareImportPreview(
  entry: VaultFileEntry,
  snapshot: VaultSnapshot,
  existingBySource: Map<string, ExistingObsidianDocument>,
): Promise<ImportPreview> {
  const file = await entry.handle.getFile();
  const markdown = await file.text();
  const modifiedAt = new Date(file.lastModified || Date.now());
  const note = prepareObsidianNote({
    relativePath: entry.path,
    markdown,
    createdAt: modifiedAt,
    updatedAt: modifiedAt,
  });
  const images: PreviewImage[] = [];

  for (const segment of splitMarkdownImages(note.bodyMarkdown)) {
    if (segment.type !== 'image') continue;
    if (/^https?:\/\//i.test(segment.target)) {
      images.push({
        target: segment.target,
        source: segment.target,
        kind: 'remote',
      });
      continue;
    }

    const resolved = resolveVaultImage(segment.target, note.relativePath, snapshot);
    if (!resolved) {
      images.push({ target: segment.target, source: segment.target, kind: 'missing' });
      continue;
    }
    const imageFile = await resolved.handle.getFile();
    images.push({
      target: segment.target,
      source: resolved.path,
      kind: 'local',
      entry: resolved,
      size: imageFile.size,
      lastModified: imageFile.lastModified,
    });
  }

  const contentHash = await hashObsidianContent(contentFingerprint(note, images));
  const existing = existingBySource.get(note.relativePath);
  const status: ImportStatus = !existing
    ? 'new'
    : !existing.obsidianContentHash
      ? 'legacy'
      : existing.obsidianContentHash === contentHash
        ? 'unchanged'
        : 'changed';

  return {
    entry,
    note,
    images,
    unresolvedImages: images.filter((image) => image.kind === 'missing').map((image) => image.target),
    contentHash,
    existing,
    status,
  };
}

async function uploadImage(
  client: SanityClient,
  image: PreviewImage,
  assetCache: Map<string, string>,
) {
  const cached = assetCache.get(image.source);
  if (cached) return { assetId: cached, uploaded: false };

  let asset;
  if (image.kind === 'local' && image.entry) {
    const file = await image.entry.handle.getFile();
    asset = await client.assets.upload('image', file, { filename: file.name });
  } else if (image.kind === 'remote') {
    const response = await fetch(image.source);
    if (!response.ok) throw new Error(`远程图片下载失败 (${response.status})：${image.source}`);
    const pathname = new URL(image.source).pathname;
    const filename = pathname.split('/').at(-1) || 'remote-image';
    asset = await client.assets.upload('image', await response.blob(), {
      filename,
      contentType: response.headers.get('content-type') || undefined,
    });
  } else {
    throw new Error(`图片无法解析：${image.target}`);
  }

  assetCache.set(image.source, asset._id);
  return { assetId: asset._id, uploaded: true };
}

async function buildPortableText(
  client: SanityClient,
  preview: ImportPreview,
  snapshot: VaultSnapshot,
  assetCache: Map<string, string>,
  allowMissingImages: boolean,
) {
  const body: PtBlock[] = [];
  let uploadedImages = 0;

  for (const segment of splitMarkdownImages(preview.note.bodyMarkdown)) {
    if (segment.type === 'text') {
      body.push(...markdownToPortableText(normalizeWikiLinks(segment.value)));
      continue;
    }

    const remote = /^https?:\/\//i.test(segment.target);
    const local = remote ? null : resolveVaultImage(segment.target, preview.note.relativePath, snapshot);
    const image: PreviewImage = remote
      ? { target: segment.target, source: segment.target, kind: 'remote' }
      : local
        ? { target: segment.target, source: local.path, kind: 'local', entry: local }
        : { target: segment.target, source: segment.target, kind: 'missing' };

    if (image.kind === 'missing') {
      if (!allowMissingImages) throw new Error(`图片无法解析：${segment.target}`);
      body.push(...markdownToPortableText(segment.syntax));
      continue;
    }

    const upload = await uploadImage(client, image, assetCache);
    if (upload.uploaded) uploadedImages++;
    body.push({
      _key: globalThis.crypto.randomUUID(),
      _type: 'image',
      asset: { _type: 'reference', _ref: upload.assetId },
      alt: segment.alt,
      caption: segment.caption,
      anchorId: segment.anchorId,
    });
  }

  return { body, uploadedImages };
}

function withoutSystemFields(document: SanityDocument): SanityDocument {
  const portableDocument: Record<string, unknown> = { ...document };
  delete portableDocument._rev;
  delete portableDocument._createdAt;
  delete portableDocument._updatedAt;
  return portableDocument as SanityDocument;
}

function compactObject(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function getObsidianOwnedFields(preview: ImportPreview, body: PtBlock[]) {
  return compactObject({
    title: preview.note.title,
    slug: { _type: 'slug', current: preview.note.slug },
    body,
    excerpt: preview.note.excerpt,
    language: 'zh',
    publishedAt: preview.note.publishedAt,
    updatedAt: preview.note.updatedAt,
    authorName: preview.note.authorName,
    tags: preview.note.tags,
    obsidianSource: preview.note.relativePath,
    obsidianContentHash: preview.contentHash,
    obsidianImportedAt: new Date().toISOString(),
  });
}

/** Update only fields owned by Obsidian, keeping publication state and taxonomy intact. */
export async function syncExistingObsidianPreview(input: {
  client: SanityClient;
  preview: ImportPreview;
  snapshot: VaultSnapshot;
  allowMissingImages: boolean;
  assetCache: Map<string, string>;
}): Promise<ImportResult> {
  const {
    client,
    preview,
    snapshot,
    allowMissingImages,
    assetCache,
  } = input;
  if (!preview.existing) {
    throw new Error(`无法同步尚未导入的文章：${preview.note.relativePath}`);
  }

  const { body, uploadedImages } = await buildPortableText(
    client,
    preview,
    snapshot,
    assetCache,
    allowMissingImages,
  );
  let patch = client
    .patch(preview.existing._id)
    .set(getObsidianOwnedFields(preview, body));
  if (!preview.note.authorName) patch = patch.unset(['authorName']);
  await patch.commit();

  return { documentId: preview.existing._id, uploadedImages };
}

export async function importObsidianPreview(input: {
  client: SanityClient;
  preview: ImportPreview;
  snapshot: VaultSnapshot;
  destination: ImportDestination;
  publish: boolean;
  allowMissingImages: boolean;
  assetCache: Map<string, string>;
}): Promise<ImportResult> {
  const {
    client,
    preview,
    snapshot,
    destination,
    publish,
    allowMissingImages,
    assetCache,
  } = input;
  const { body, uploadedImages } = await buildPortableText(
    client,
    preview,
    snapshot,
    assetCache,
    allowMissingImages,
  );
  const generatedId = await deterministicObsidianDocumentId(preview.note.relativePath);
  const existingBaseId = preview.existing?._id.replace(/^drafts\./, '');
  const baseId = existingBaseId && !existingBaseId.startsWith('obsidian.')
    ? existingBaseId
    : generatedId;
  const draftId = `drafts.${baseId}`;
  const targetId = publish ? baseId : draftId;
  const variants = await client.fetch<SanityDocument[]>(
    `*[_id in [$draftId, $publishedId]]`,
    { draftId, publishedId: baseId },
    { perspective: 'raw' },
  );
  const draft = variants.find((document) => document._id === draftId);
  const published = variants.find((document) => document._id === baseId);
  const source = draft ?? published;
  const seed: SanityDocument = source
    ? { ...withoutSystemFields(source), _id: targetId }
    : { _id: targetId, _type: 'blog' };
  const ownedFields = compactObject({
    ...getObsidianOwnedFields(preview, body),
    ...(destination.mode === 'category'
      ? { category: { _type: 'reference', _ref: destination.categoryId } }
      : {
          project: { _type: 'reference', _ref: destination.projectId },
          collection: destination.collectionId
            ? { _type: 'reference', _ref: destination.collectionId }
            : undefined,
        }),
  });

  if (publish) {
    const publishedDocument: SanityDocument = {
      ...seed,
      ...ownedFields,
      _id: baseId,
      _type: 'blog',
    };
    if (destination.mode === 'category') {
      delete publishedDocument.project;
      delete publishedDocument.collection;
    } else {
      delete publishedDocument.category;
      if (!destination.collectionId) delete publishedDocument.collection;
    }
    if (!preview.note.authorName) delete publishedDocument.authorName;
    let transaction = client.transaction().createOrReplace(publishedDocument);
    if (draft) transaction = transaction.delete(draftId);
    await transaction.commit();
    return { documentId: baseId, uploadedImages };
  }

  await client.createIfNotExists(seed);
  let patch = client.patch(targetId).set(ownedFields);
  if (!preview.note.authorName) patch = patch.unset(['authorName']);
  patch = destination.mode === 'category'
    ? patch.unset(['project', 'collection'])
    : destination.collectionId
      ? patch.unset(['category'])
      : patch.unset(['category', 'collection']);
  await patch.commit();

  return { documentId: targetId, uploadedImages };
}
