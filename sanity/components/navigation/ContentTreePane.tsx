import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AddIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FolderIcon,
  SearchIcon,
} from '@sanity/icons';
import { Badge, Box, Card, Flex, Spinner, Stack, Text, TextInput } from '@sanity/ui';
import { useClient } from 'sanity';
import { usePaneRouter } from 'sanity/structure';
import { CreateDocumentLink } from './CreateDocumentLink';

type Category = { _id: string; title: string; order?: number };
type Project = { _id: string; title: string; categoryId?: string; order?: number };
type Collection = { _id: string; title: string; projectId?: string; order?: number };
type Post = {
  _id: string;
  title: string;
  publishedAt?: string;
  categoryId?: string;
  projectId?: string;
  collectionId?: string;
};

type DirectoryData = {
  categories: Category[];
  projects: Project[];
  collections: Collection[];
  posts: Post[];
};

const DIRECTORY_QUERY = `{
  "categories": *[_type == "category"] | order(order asc, title asc) {
    _id, title, order
  },
  "projects": *[_type == "project"] | order(order asc, title asc) {
    _id, title, order, "categoryId": category._ref
  },
  "collections": *[_type == "collection"] | order(order asc, title asc) {
    _id, title, order, "projectId": project._ref
  },
  "posts": *[_type == "blog"] | order(publishedAt desc) {
    _id, title, publishedAt,
    "categoryId": category._ref,
    "projectId": project._ref,
    "collectionId": collection._ref
  }
}`;

const DIRECTORY_CACHE_KEY = 'iceaxing:studio:content-directory:v1';
const DIRECTORY_CACHE_MAX_AGE = 5 * 60 * 1000;
const DIRECTORY_FIELD_PATTERN = /^(title|publishedAt|category|project|collection|order|slug)(?:$|[.\[])/;

type MutationEvent = {
  mutations?: Array<Record<string, unknown>>;
};

function mutationTouchesFields(event: MutationEvent, fieldPattern: RegExp) {
  if (!Array.isArray(event.mutations)) return true;

  return event.mutations.some((mutation) => {
    if ('create' in mutation || 'createIfNotExists' in mutation || 'delete' in mutation) return true;

    const patch = mutation.patch;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return true;

    const patchRecord = patch as Record<string, unknown>;
    const paths: string[] = [];
    for (const operation of ['set', 'setIfMissing', 'inc', 'dec', 'diffMatchPatch']) {
      const value = patchRecord[operation];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(...Object.keys(value));
      }
    }
    if (Array.isArray(patchRecord.unset)) {
      paths.push(...patchRecord.unset.filter((value): value is string => typeof value === 'string'));
    }

    return paths.length === 0 || paths.some((path) => fieldPattern.test(path));
  });
}

function readDirectoryCache(): DirectoryData | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(DIRECTORY_CACHE_KEY) || 'null') as {
      data?: DirectoryData;
      savedAt?: number;
    } | null;
    if (!cached?.data || !cached.savedAt || Date.now() - cached.savedAt > DIRECTORY_CACHE_MAX_AGE) {
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function writeDirectoryCache(data: DirectoryData) {
  try {
    sessionStorage.setItem(
      DIRECTORY_CACHE_KEY,
      JSON.stringify({ data, savedAt: Date.now() }),
    );
  } catch {
    // Storage is optional; the in-memory state still keeps the pane responsive.
  }
}

function publishedDocumentId(id: string) {
  return id.replace(/^drafts\./, '');
}

function deduplicateDocuments<T extends { _id: string }>(items: T[]) {
  const documents = new Map<string, T>();

  for (const item of items) {
    const id = publishedDocumentId(item._id);
    const existing = documents.get(id);
    if (!existing || item._id.startsWith('drafts.')) {
      documents.set(id, { ...item, _id: id });
    }
  }

  return [...documents.values()];
}

function DocumentLink({ document }: { document: { _id: string; title: string } }) {
  const { ChildLink } = usePaneRouter();

  return (
    <ChildLink childId={document._id} childPayload={{ documentType: 'blog' }}>
      <span className="studio-tree-document">
        <DocumentTextIcon />
        <span>{document.title || '未命名文章'}</span>
      </span>
    </ChildLink>
  );
}

function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="studio-tree-posts">
      {posts.map((post) => (
        <DocumentLink document={post} key={post._id} />
      ))}
    </div>
  );
}

export function ContentTreePane() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [data, setData] = useState<DirectoryData | null>(readDirectoryCache);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const requestRef = useRef<Promise<void> | null>(null);
  const [hadCachedSnapshot] = useState(() => Boolean(data));

  const loadDirectory = useCallback(async () => {
    if (requestRef.current) return requestRef.current;

    const request = (async () => {
      try {
        const result = await client.fetch<DirectoryData>(DIRECTORY_QUERY);
        const nextData = {
          categories: deduplicateDocuments(result.categories),
          projects: deduplicateDocuments(result.projects),
          collections: deduplicateDocuments(result.collections),
          posts: deduplicateDocuments(result.posts),
        };
        writeDirectoryCache(nextData);
        setData(nextData);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '目录加载失败');
      } finally {
        requestRef.current = null;
      }
    })();

    requestRef.current = request;
    return request;
  }, [client]);

  useEffect(() => {
    let reloadTimer = 0;
    const scheduleReload = (delay = 650) => {
      window.clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(() => void loadDirectory(), delay);
    };
    const initialLoad = window.setTimeout(() => void loadDirectory(), hadCachedSnapshot ? 900 : 0);
    const subscription = client
      .listen('*[_type in ["category", "project", "collection", "blog"]]')
      .subscribe({
        next: (event) => {
          if (mutationTouchesFields(event, DIRECTORY_FIELD_PATTERN)) scheduleReload();
        },
      });
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') scheduleReload(150);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearTimeout(reloadTimer);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [client, hadCachedSnapshot, loadDirectory]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized || !data) return [];
    return data.posts.filter((post) => post.title.toLocaleLowerCase().includes(normalized));
  }, [data, query]);

  if (!data && !error) {
    return (
      <Flex align="center" height="fill" justify="center">
        <Spinner muted />
      </Flex>
    );
  }

  if (!data) {
    return (
      <Box padding={4}>
        <Card padding={4} radius={3} tone="critical">
          <Text>{error}</Text>
        </Card>
      </Box>
    );
  }

  const unattachedPosts = data.posts.filter(
    (post) => !post.categoryId && !post.projectId,
  );

  return (
    <div className="studio-directory">
      <header className="studio-directory-header">
        <span className="studio-directory-kicker">ICEAXING · KNOWLEDGE</span>
        <h1>内容目录</h1>
        <p>分类、项目、合集与文章在同一列中逐级展开。</p>
      </header>

      <details className="studio-create-menu">
        <summary>
          <AddIcon aria-hidden="true" />
          <span>新建文章</span>
          <ChevronDownIcon className="studio-create-chevron" />
        </summary>
        <div className="studio-create-options">
          <CreateDocumentLink
            className="studio-create-option studio-create-option-primary"
            label="空白文章"
            schemaType="blog"
            template="blog-blank"
          />
          <CreateDocumentLink
            className="studio-create-option"
            label="技术教程"
            schemaType="blog"
            template="blog-tech-tutorial"
          />
          <CreateDocumentLink
            className="studio-create-option"
            label="读书笔记"
            schemaType="blog"
            template="blog-reading-note"
          />
          <CreateDocumentLink
            className="studio-create-option"
            label="复盘总结"
            schemaType="blog"
            template="blog-retrospective"
          />
        </div>
      </details>

      <Box paddingX={3} paddingBottom={3}>
        <TextInput
          aria-label="搜索文章"
          icon={SearchIcon}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="搜索文章…"
          radius={3}
          value={query}
        />
      </Box>

      <div className="studio-directory-scroll">
        {query.trim() ? (
          <Stack space={2} padding={3}>
            <Flex align="center" justify="space-between" paddingBottom={2}>
              <Text muted size={1}>搜索结果</Text>
              <Badge mode="outline">{searchResults.length}</Badge>
            </Flex>
            {searchResults.length > 0 ? (
              <PostList posts={searchResults} />
            ) : (
              <Card padding={4} radius={3} tone="transparent">
                <Text muted size={1}>没有匹配的文章</Text>
              </Card>
            )}
          </Stack>
        ) : (
          <div className="studio-tree">
            {data.categories.map((category) => {
              const projects = data.projects.filter(
                (project) => project.categoryId === category._id,
              );
              const directPosts = data.posts.filter(
                (post) => post.categoryId === category._id && !post.projectId,
              );
              const categoryCount =
                directPosts.length +
                data.posts.filter((post) =>
                  projects.some((project) => project._id === post.projectId),
                ).length;

              return (
                <details className="studio-tree-group studio-tree-category" key={category._id} open>
                  <summary>
                    <ChevronDownIcon className="studio-tree-chevron" />
                    <FolderIcon className="studio-tree-folder" />
                    <span>{category.title}</span>
                    <Badge mode="outline">{categoryCount}</Badge>
                  </summary>

                  <div className="studio-tree-children">
                    <PostList posts={directPosts} />

                    {projects.map((project) => {
                      const collections = data.collections.filter(
                        (collection) => collection.projectId === project._id,
                      );
                      const projectPosts = data.posts.filter(
                        (post) => post.projectId === project._id,
                      );
                      const directProjectPosts = projectPosts.filter(
                        (post) => !post.collectionId,
                      );

                      return (
                        <details className="studio-tree-group studio-tree-project" key={project._id}>
                          <summary>
                            <ChevronDownIcon className="studio-tree-chevron" />
                            <span>{project.title}</span>
                            <Badge mode="outline">{projectPosts.length}</Badge>
                          </summary>
                          <div className="studio-tree-children">
                            <PostList posts={directProjectPosts} />
                            {collections.map((collection) => {
                              const collectionPosts = projectPosts.filter(
                                (post) => post.collectionId === collection._id,
                              );

                              return (
                                <details className="studio-tree-group studio-tree-collection" key={collection._id}>
                                  <summary>
                                    <ChevronDownIcon className="studio-tree-chevron" />
                                    <span>{collection.title}</span>
                                    <Badge mode="outline">{collectionPosts.length}</Badge>
                                  </summary>
                                  <PostList posts={collectionPosts} />
                                </details>
                              );
                            })}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </details>
              );
            })}

            {unattachedPosts.length > 0 && (
              <details className="studio-tree-group studio-tree-category" open>
                <summary>
                  <ChevronDownIcon className="studio-tree-chevron" />
                  <FolderIcon className="studio-tree-folder" />
                  <span>未归档</span>
                  <Badge mode="outline">{unattachedPosts.length}</Badge>
                </summary>
                <PostList posts={unattachedPosts} />
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
