import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  DocumentTextIcon,
  EditIcon,
  FolderIcon,
  SearchIcon,
} from '@sanity/icons';
import { Badge, Box, Card, Flex, Spinner, Stack, Text, TextInput } from '@sanity/ui';
import { useClient } from 'sanity';
import { usePaneRouter } from 'sanity/structure';

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

function EditDocumentLink({
  documentId,
  documentType,
  label,
}: {
  documentId: string;
  documentType: string;
  label: string;
}) {
  const { ChildLink } = usePaneRouter();

  return (
    <ChildLink
      childId={documentId}
      childParameters={{ documentType }}
    >
      <span
        className="studio-tree-edit"
        onClick={(event) => event.stopPropagation()}
        title={label}
      >
        <EditIcon aria-hidden="true" />
        <span className="studio-sr-only">{label}</span>
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
  const [data, setData] = useState<DirectoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadDirectory = useCallback(async () => {
    try {
      const result = await client.fetch<DirectoryData>(DIRECTORY_QUERY);
      setData({
        categories: deduplicateDocuments(result.categories),
        projects: deduplicateDocuments(result.projects),
        collections: deduplicateDocuments(result.collections),
        posts: deduplicateDocuments(result.posts),
      });
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '目录加载失败');
    }
  }, [client]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadDirectory(), 0);
    const subscription = client
      .listen('*[_type in ["category", "project", "collection", "blog"]]')
      .subscribe({ next: () => void loadDirectory() });

    return () => {
      window.clearTimeout(initialLoad);
      subscription.unsubscribe();
    };
  }, [client, loadDirectory]);

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
                    <EditDocumentLink
                      documentId={category._id}
                      documentType="category"
                      label={`编辑分类 ${category.title}`}
                    />
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
                            <EditDocumentLink
                              documentId={project._id}
                              documentType="project"
                              label={`编辑项目 ${project.title}`}
                            />
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
                                    <EditDocumentLink
                                      documentId={collection._id}
                                      documentType="collection"
                                      label={`编辑合集 ${collection.title}`}
                                    />
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
