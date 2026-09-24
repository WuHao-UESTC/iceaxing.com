import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react';
import {
  EditIcon,
  FolderIcon,
  ProjectsIcon,
  TagIcon,
  TrashIcon,
} from '@sanity/icons';
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@sanity/ui';
import { useClient } from 'sanity';
import { usePaneRouter } from 'sanity/structure';
import { CreateDocumentLink } from './CreateDocumentLink';

type ManagedDocument = {
  _id: string;
  title: string;
  referenceCount: number;
};

type Category = ManagedDocument;
type Project = ManagedDocument & { categoryId?: string };
type Collection = ManagedDocument & { projectId?: string };

type TaxonomyData = {
  categories: Category[];
  projects: Project[];
  collections: Collection[];
};

type DeleteTarget = ManagedDocument & {
  schemaType: 'category' | 'project' | 'collection';
};

const TAXONOMY_QUERY = `{
  "categories": *[_type == "category"] | order(order asc, title asc) {
    _id, title, "referenceCount": count(*[references(^._id)])
  },
  "projects": *[_type == "project"] | order(order asc, title asc) {
    _id, title, "categoryId": category._ref,
    "referenceCount": count(*[references(^._id)])
  },
  "collections": *[_type == "collection"] | order(order asc, title asc) {
    _id, title, "projectId": project._ref,
    "referenceCount": count(*[references(^._id)])
  }
}`;

const TAXONOMY_CACHE_KEY = 'iceaxing:studio:taxonomy-manager:v1';
const TAXONOMY_CACHE_MAX_AGE = 5 * 60 * 1000;
const TAXONOMY_FIELD_PATTERN = /^(title|category|project|collection|order)(?:$|[.\[])/;

type MutationEvent = {
  mutations?: Array<Record<string, unknown>>;
};

function mutationTouchesTaxonomy(event: MutationEvent) {
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

    return paths.length === 0 || paths.some((path) => TAXONOMY_FIELD_PATTERN.test(path));
  });
}

function readTaxonomyCache(): TaxonomyData | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(TAXONOMY_CACHE_KEY) || 'null') as {
      data?: TaxonomyData;
      savedAt?: number;
    } | null;
    if (!cached?.data || !cached.savedAt || Date.now() - cached.savedAt > TAXONOMY_CACHE_MAX_AGE) {
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function writeTaxonomyCache(data: TaxonomyData) {
  try {
    sessionStorage.setItem(
      TAXONOMY_CACHE_KEY,
      JSON.stringify({ data, savedAt: Date.now() }),
    );
  } catch {
    // Storage is optional; the current pane state remains available.
  }
}

const TYPE_LABELS = {
  category: '分类',
  project: '项目',
  collection: '合集',
} as const;

function publishedDocumentId(id: string) {
  return id.replace(/^drafts\./, '');
}

function deduplicateDocuments<T extends ManagedDocument>(items: T[]) {
  const documents = new Map<string, T>();

  for (const item of items) {
    const id = publishedDocumentId(item._id);
    const existing = documents.get(id);
    if (!existing) {
      documents.set(id, { ...item, _id: id });
      continue;
    }

    const preferred = item._id.startsWith('drafts.') ? item : existing;
    documents.set(id, {
      ...preferred,
      _id: id,
      referenceCount: Math.max(existing.referenceCount, item.referenceCount),
    });
  }

  return [...documents.values()];
}

function EditLink({ documentId, documentType }: { documentId: string; documentType: string }) {
  const { ChildLink } = usePaneRouter();

  return (
    <ChildLink childId={documentId} childParameters={{ documentType }}>
      <span className="studio-manager-action" title="编辑">
        <EditIcon aria-hidden="true" />
        <span className="studio-sr-only">编辑</span>
      </span>
    </ChildLink>
  );
}

function ManagementSection({
  children,
  count,
  icon: Icon,
  schemaType,
  title,
}: {
  children: ReactNode;
  count: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  schemaType: 'category' | 'project' | 'collection';
  title: string;
}) {
  return (
    <section className="studio-manager-section">
      <header>
        <Flex align="center" gap={2}>
          <Icon />
          <Text weight="semibold">{title}</Text>
          <Badge mode="outline">{count}</Badge>
        </Flex>
        <CreateDocumentLink
          className="studio-manager-create"
          label={`新增${title}`}
          schemaType={schemaType}
        />
      </header>
      <div className="studio-manager-list">{children}</div>
    </section>
  );
}

function ManagementRow({
  document,
  parentTitle,
  schemaType,
  onDelete,
}: {
  document: ManagedDocument;
  parentTitle?: string;
  schemaType: DeleteTarget['schemaType'];
  onDelete: (target: DeleteTarget) => void;
}) {
  const deletionBlocked = document.referenceCount > 0;
  const deleteHint = deletionBlocked
    ? `仍被 ${document.referenceCount} 项内容引用，请先移动或删除下级内容`
    : `删除${TYPE_LABELS[schemaType]}`;

  return (
    <div className="studio-manager-row">
      <div className="studio-manager-row-copy">
        <Text size={1} weight="medium">{document.title || `未命名${TYPE_LABELS[schemaType]}`}</Text>
        <Text muted size={1}>
          {parentTitle || '顶级内容'}
          {deletionBlocked ? ` · ${document.referenceCount} 项引用` : ' · 可删除'}
        </Text>
      </div>
      <div className="studio-manager-actions">
        <EditLink documentId={document._id} documentType={schemaType} />
        <button
          aria-label={deleteHint}
          className="studio-manager-action studio-manager-delete"
          disabled={deletionBlocked}
          onClick={() => onDelete({ ...document, schemaType })}
          title={deleteHint}
          type="button"
        >
          <TrashIcon aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function TaxonomyManagerPane() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [data, setData] = useState<TaxonomyData | null>(readTaxonomyCache);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const requestRef = useRef<Promise<void> | null>(null);
  const [hadCachedSnapshot] = useState(() => Boolean(data));

  const loadData = useCallback(async () => {
    if (requestRef.current) return requestRef.current;

    const request = (async () => {
      try {
        const result = await client.fetch<TaxonomyData>(TAXONOMY_QUERY);
        const nextData = {
          categories: deduplicateDocuments(result.categories),
          projects: deduplicateDocuments(result.projects),
          collections: deduplicateDocuments(result.collections),
        };
        writeTaxonomyCache(nextData);
        setData(nextData);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '分类数据加载失败');
      } finally {
        requestRef.current = null;
      }
    })();

    requestRef.current = request;
    return request;
  }, [client]);

  useEffect(() => {
    let reloadTimer = 0;
    const scheduleReload = (delay = 500) => {
      window.clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(() => void loadData(), delay);
    };
    const initialLoad = window.setTimeout(() => void loadData(), hadCachedSnapshot ? 900 : 0);
    const subscription = client
      .listen('*[_type in ["category", "project", "collection", "blog"]]')
      .subscribe({
        next: (event) => {
          if (mutationTouchesTaxonomy(event)) scheduleReload();
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
  }, [client, hadCachedSnapshot, loadData]);

  const categoryTitles = useMemo(
    () => new Map(data?.categories.map((item) => [item._id, item.title]) ?? []),
    [data],
  );
  const projectTitles = useMemo(
    () => new Map(data?.projects.map((item) => [item._id, item.title]) ?? []),
    [data],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || deleteTarget.referenceCount > 0) return;
    setDeleting(true);

    try {
      const publishedId = publishedDocumentId(deleteTarget._id);
      await client
        .transaction()
        .delete(publishedId)
        .delete(`drafts.${publishedId}`)
        .commit();
      toast.push({
        status: 'success',
        title: `${TYPE_LABELS[deleteTarget.schemaType]}已删除`,
        description: deleteTarget.title,
      });
      setDeleteTarget(null);
      await loadData();
    } catch (deleteError) {
      toast.push({
        status: 'error',
        title: '删除失败',
        description: deleteError instanceof Error ? deleteError.message : '请稍后重试',
      });
    } finally {
      setDeleting(false);
    }
  }, [client, deleteTarget, loadData, toast]);

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

  return (
    <div className="studio-manager">
      <header className="studio-directory-header">
        <span className="studio-directory-kicker">ICEAXING · STRUCTURE</span>
        <h1>分类管理</h1>
        <p>在这里新增、编辑或删除分类、项目与合集。</p>
      </header>

      <div className="studio-manager-scroll">
        <Stack space={4} padding={3}>
          <ManagementSection
            count={data.categories.length}
            icon={TagIcon}
            schemaType="category"
            title="分类"
          >
            {data.categories.map((category) => (
              <ManagementRow
                document={category}
                key={category._id}
                onDelete={setDeleteTarget}
                schemaType="category"
              />
            ))}
          </ManagementSection>

          <ManagementSection
            count={data.projects.length}
            icon={ProjectsIcon}
            schemaType="project"
            title="项目"
          >
            {data.projects.map((project) => (
              <ManagementRow
                document={project}
                key={project._id}
                onDelete={setDeleteTarget}
                parentTitle={project.categoryId ? categoryTitles.get(project.categoryId) : undefined}
                schemaType="project"
              />
            ))}
          </ManagementSection>

          <ManagementSection
            count={data.collections.length}
            icon={FolderIcon}
            schemaType="collection"
            title="合集"
          >
            {data.collections.map((collection) => (
              <ManagementRow
                document={collection}
                key={collection._id}
                onDelete={setDeleteTarget}
                parentTitle={collection.projectId ? projectTitles.get(collection.projectId) : undefined}
                schemaType="collection"
              />
            ))}
          </ManagementSection>
        </Stack>
      </div>

      {deleteTarget && (
        <Dialog
          header={`删除${TYPE_LABELS[deleteTarget.schemaType]}`}
          id="delete-taxonomy-dialog"
          onClose={() => setDeleteTarget(null)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text>
                确定删除“{deleteTarget.title}”吗？此操作会同时删除草稿和已发布版本。
              </Text>
              <Flex gap={2} justify="flex-end">
                <Button
                  disabled={deleting}
                  mode="bleed"
                  onClick={() => setDeleteTarget(null)}
                  text="取消"
                />
                <Button
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  text={deleting ? '删除中…' : '确认删除'}
                  tone="critical"
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </div>
  );
}
