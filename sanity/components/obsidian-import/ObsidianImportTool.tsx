import { Badge, Box, Button, Card, Checkbox, Flex, Heading, Spinner, Stack, Text, TextInput } from '@sanity/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useClient } from 'sanity';
import { dirname } from '../../../lib/obsidian/import-core';
import {
  importObsidianPreview,
  loadExistingObsidianDocuments,
  loadImportTaxonomy,
  prepareImportPreview,
  type ExistingObsidianDocument,
  type ImportDestination,
  type ImportPreview,
  type ImportTaxonomy,
} from './importer';
import {
  chooseVaultDirectory,
  ensureVaultPermission,
  loadVaultHandle,
  saveVaultHandle,
  scanVault,
  supportsDirectoryPicker,
  type VaultSnapshot,
} from './vault';

type RowProgress = {
  status: 'waiting' | 'running' | 'success' | 'failed' | 'skipped';
  message?: string;
  documentId?: string;
};

const EMPTY_TAXONOMY: ImportTaxonomy = {
  categories: [],
  projects: [],
  collections: [],
};

const STATUS_LABELS: Record<ImportPreview['status'], string> = {
  new: '新增',
  changed: '有更新',
  unchanged: '无变化',
  legacy: '待建立指纹',
};

const STATUS_TONES: Record<ImportPreview['status'], 'positive' | 'caution' | 'default' | 'primary'> = {
  new: 'positive',
  changed: 'caution',
  unchanged: 'default',
  legacy: 'primary',
};

export function ObsidianImportTool() {
  const client = useClient({ apiVersion: '2025-02-19' });
  const [taxonomy, setTaxonomy] = useState<ImportTaxonomy>(EMPTY_TAXONOMY);
  const [existingBySource, setExistingBySource] = useState(
    () => new Map<string, ExistingObsidianDocument>(),
  );
  const [savedHandle, setSavedHandle] = useState<FileSystemDirectoryHandle>();
  const [snapshot, setSnapshot] = useState<VaultSnapshot>();
  const [selectedPaths, setSelectedPaths] = useState(() => new Set<string>());
  const [previews, setPreviews] = useState<ImportPreview[]>([]);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('');
  const [mode, setMode] = useState<'category' | 'project'>('project');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [publish, setPublish] = useState(false);
  const [allowMissingImages, setAllowMissingImages] = useState(false);
  const [conflictStrategy, setConflictStrategy] = useState<'update' | 'skip-existing'>('update');
  const [busyMessage, setBusyMessage] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<Record<string, RowProgress>>({});
  const cancelRequested = useRef(false);
  const assetCache = useRef(new Map<string, string>());

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImportTaxonomy(client), loadExistingObsidianDocuments(client)])
      .then(([nextTaxonomy, nextExisting]) => {
        if (cancelled) return;
        setTaxonomy(nextTaxonomy);
        setExistingBySource(nextExisting);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(`无法读取 Sanity 数据：${toErrorMessage(loadError)}`);
      });
    loadVaultHandle()
      .then((handle) => {
        if (!cancelled && handle) setSavedHandle(handle);
      })
      .catch(() => {
        // IndexedDB persistence is optional; manual selection remains available.
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const folders = useMemo(() => {
    if (!snapshot) return [];
    return Array.from(new Set(snapshot.notes.map((note) => dirname(note.path)).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right, 'zh-CN'));
  }, [snapshot]);

  const visibleNotes = useMemo(() => {
    if (!snapshot) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return snapshot.notes.filter((note) => {
      const matchesFolder = !folder || note.path === folder || note.path.startsWith(`${folder}/`);
      const matchesQuery = !normalizedQuery || note.path.toLocaleLowerCase().includes(normalizedQuery);
      return matchesFolder && matchesQuery;
    });
  }, [folder, query, snapshot]);

  const filteredProjects = useMemo(
    () => taxonomy.projects.filter((project) => !categoryId || project.categoryId === categoryId),
    [categoryId, taxonomy.projects],
  );
  const filteredCollections = useMemo(
    () => taxonomy.collections.filter((collection) => collection.projectId === projectId),
    [projectId, taxonomy.collections],
  );

  useEffect(() => {
    if (mode !== 'project' || !projectId) return;
    const project = taxonomy.projects.find((item) => item._id === projectId);
    if (project?.categoryId) setCategoryId(project.categoryId);
  }, [mode, projectId, taxonomy.projects]);

  useEffect(() => {
    if (collectionId && !filteredCollections.some((collection) => collection._id === collectionId)) {
      setCollectionId('');
    }
  }, [collectionId, filteredCollections]);

  const connectVault = useCallback(async (handle?: FileSystemDirectoryHandle) => {
    setError('');
    setBusyMessage('正在读取 Obsidian 仓库…');
    try {
      const selected = handle ?? await chooseVaultDirectory();
      if (!(await ensureVaultPermission(selected))) throw new Error('未获得仓库读取权限。');
      const nextSnapshot = await scanVault(selected);
      setSnapshot(nextSnapshot);
      setSavedHandle(selected);
      setSelectedPaths(new Set());
      setPreviews([]);
      setProgress({});
      assetCache.current.clear();
      await saveVaultHandle(selected).catch(() => undefined);
    } catch (connectError) {
      if (toErrorName(connectError) !== 'AbortError') setError(toErrorMessage(connectError));
    } finally {
      setBusyMessage('');
    }
  }, []);

  const togglePath = (path: string) => {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    setPreviews([]);
    setProgress({});
  };

  const toggleVisible = () => {
    const allVisibleSelected = visibleNotes.length > 0 && visibleNotes.every((note) => selectedPaths.has(note.path));
    setSelectedPaths((current) => {
      const next = new Set(current);
      for (const note of visibleNotes) {
        if (allVisibleSelected) next.delete(note.path);
        else next.add(note.path);
      }
      return next;
    });
    setPreviews([]);
    setProgress({});
  };

  const runPreflight = async () => {
    if (!snapshot || selectedPaths.size === 0) return;
    setError('');
    setPreviews([]);
    setProgress({});
    assetCache.current.clear();
    const entries = snapshot.notes.filter((entry) => selectedPaths.has(entry.path));
    const nextPreviews: ImportPreview[] = [];
    try {
      for (let index = 0; index < entries.length; index++) {
        setBusyMessage(`正在预检 ${index + 1}/${entries.length}：${entries[index].path}`);
        nextPreviews.push(await prepareImportPreview(entries[index], snapshot, existingBySource));
      }
      setPreviews(nextPreviews);
    } catch (preflightError) {
      setError(`预检失败：${toErrorMessage(preflightError)}`);
    } finally {
      setBusyMessage('');
    }
  };

  const destination = useMemo<ImportDestination | null>(() => {
    if (mode === 'category') return categoryId ? { mode, categoryId } : null;
    return projectId
      ? { mode, projectId, collectionId: collectionId || undefined }
      : null;
  }, [categoryId, collectionId, mode, projectId]);

  const runImport = async (onlyPaths?: Set<string>) => {
    if (!snapshot || !destination || previews.length === 0) return;
    const candidates = previews.filter((preview) => {
      if (onlyPaths && !onlyPaths.has(preview.note.relativePath)) return false;
      if (preview.status === 'unchanged') return false;
      if (conflictStrategy === 'skip-existing' && preview.status !== 'new') return false;
      return true;
    });
    const missing = candidates.flatMap((preview) => preview.unresolvedImages);
    if (missing.length > 0 && !allowMissingImages) {
      setError('存在无法解析的图片。请先处理图片，或明确勾选“保留原始图片语法并继续”。');
      return;
    }
    if (publish && !window.confirm(`将直接发布 ${candidates.length} 篇文章，并移除对应草稿。是否继续？`)) {
      return;
    }

    setError('');
    cancelRequested.current = false;
    const initialProgress: Record<string, RowProgress> = {};
    for (const preview of previews) {
      const shouldImport = candidates.some((candidate) => candidate.note.relativePath === preview.note.relativePath);
      initialProgress[preview.note.relativePath] = {
        status: shouldImport ? 'waiting' : 'skipped',
        message: preview.status === 'unchanged' ? '内容无变化' : shouldImport ? undefined : '按冲突策略跳过',
      };
    }
    setProgress(initialProgress);

    let completed = 0;
    const successfulPaths = new Set<string>();
    for (const preview of candidates) {
      if (cancelRequested.current) break;
      const path = preview.note.relativePath;
      setBusyMessage(`正在导入 ${completed + 1}/${candidates.length}：${path}`);
      setProgress((current) => ({
        ...current,
        [path]: { status: 'running', message: '上传图片并写入草稿…' },
      }));
      try {
        const result = await importObsidianPreview({
          client,
          preview,
          snapshot,
          destination,
          publish,
          allowMissingImages,
          assetCache: assetCache.current,
        });
        setProgress((current) => ({
          ...current,
          [path]: {
            status: 'success',
            documentId: result.documentId,
            message: `完成，上传 ${result.uploadedImages} 张新图片`,
          },
        }));
        successfulPaths.add(path);
      } catch (importError) {
        setProgress((current) => ({
          ...current,
          [path]: { status: 'failed', message: toErrorMessage(importError) },
        }));
      }
      completed++;
    }
    if (cancelRequested.current) {
      setProgress((current) => Object.fromEntries(
        Object.entries(current).map(([path, item]) => [
          path,
          item.status === 'waiting' ? { status: 'skipped', message: '已取消' } : item,
        ]),
      ));
    }
    setBusyMessage('');
    const refreshed = await loadExistingObsidianDocuments(client).catch(() => null);
    if (refreshed) {
      setExistingBySource(refreshed);
      setPreviews((current) => current.map((preview) => successfulPaths.has(preview.note.relativePath)
        ? {
            ...preview,
            status: 'unchanged',
            existing: refreshed.get(preview.note.relativePath),
          }
        : preview));
    }
  };

  const failedPaths = useMemo(
    () => new Set(Object.entries(progress).filter(([, item]) => item.status === 'failed').map(([path]) => path)),
    [progress],
  );
  const selectedPreviewCount = previews.filter((preview) => preview.status !== 'unchanged').length;
  const importCandidateCount = previews.filter((preview) =>
    preview.status !== 'unchanged'
      && (conflictStrategy === 'update' || preview.status === 'new'),
  ).length;
  const unresolvedCount = previews.reduce((sum, preview) => sum + preview.unresolvedImages.length, 0);
  const allVisibleSelected = visibleNotes.length > 0 && visibleNotes.every((note) => selectedPaths.has(note.path));

  return (
    <div className="obsidian-importer">
      <header className="obsidian-importer-header">
        <div>
          <Text size={1} muted weight="semibold">CONTENT PIPELINE</Text>
          <Heading as="h1" size={3}>Obsidian 导入</Heading>
          <Text muted size={1}>预检本地笔记和图片，再安全地写入 Sanity。</Text>
        </div>
        <Flex align="center" gap={2} wrap="wrap">
          {snapshot && <Badge tone="positive">{snapshot.name}</Badge>}
          {savedHandle && !snapshot && (
            <Button mode="ghost" text={`恢复 ${savedHandle.name}`} onClick={() => void connectVault(savedHandle)} />
          )}
          <Button
            disabled={!supportsDirectoryPicker() || Boolean(busyMessage)}
            text={snapshot ? '重新选择仓库' : '选择 Obsidian 仓库'}
            tone="primary"
            onClick={() => void connectVault()}
          />
        </Flex>
      </header>

      {error && <Card className="obsidian-importer-alert" padding={3} radius={2} tone="critical"><Text size={1}>{error}</Text></Card>}
      {!supportsDirectoryPicker() && (
        <Card className="obsidian-importer-alert" padding={3} radius={2} tone="caution">
          <Text size={1}>当前浏览器不支持本地目录读取。请使用最新版 Chrome 或 Edge 打开 Studio。</Text>
        </Card>
      )}
      {busyMessage && (
        <Card className="obsidian-importer-busy" padding={3} radius={2} tone="primary">
          <Flex align="center" gap={3}><Spinner muted /><Text size={1}>{busyMessage}</Text></Flex>
        </Card>
      )}

      <main className="obsidian-importer-grid">
        <Card className="obsidian-importer-panel" radius={3} shadow={1}>
          <PanelHeader eyebrow="01 / SOURCE" title="选择文章" meta={snapshot ? `${snapshot.notes.length} 篇` : '未连接'} />
          <Box className="obsidian-importer-controls" padding={3}>
            <Stack space={3}>
              <TextInput value={query} placeholder="搜索文章路径…" onChange={(event) => setQuery(event.currentTarget.value)} />
              <select className="obsidian-importer-select" value={folder} onChange={(event) => setFolder(event.currentTarget.value)}>
                <option value="">全部目录</option>
                {folders.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <Flex align="center" justify="space-between">
                <label className="obsidian-importer-checkline">
                  <Checkbox checked={allVisibleSelected} onChange={toggleVisible} />
                  <Text size={1}>选择当前筛选结果</Text>
                </label>
                <Text muted size={1}>已选 {selectedPaths.size}</Text>
              </Flex>
            </Stack>
          </Box>
          <div className="obsidian-importer-file-list">
            {!snapshot && <EmptyState>请选择仓库根目录。需要选择整个仓库，以便解析 System/Attachments 中的图片。</EmptyState>}
            {snapshot && visibleNotes.length === 0 && <EmptyState>没有符合条件的 Markdown 文件。</EmptyState>}
            {visibleNotes.map((note) => (
              <label className="obsidian-importer-file" key={note.path}>
                <Checkbox checked={selectedPaths.has(note.path)} onChange={() => togglePath(note.path)} />
                <span title={note.path}>{note.path}</span>
              </label>
            ))}
          </div>
          <div className="obsidian-importer-panel-footer">
            <Button
              disabled={!snapshot || selectedPaths.size === 0 || Boolean(busyMessage)}
              text={`预检 ${selectedPaths.size || ''} 篇文章`}
              tone="primary"
              onClick={() => void runPreflight()}
            />
          </div>
        </Card>

        <Card className="obsidian-importer-panel" radius={3} shadow={1}>
          <PanelHeader eyebrow="02 / PREFLIGHT" title="检查结果" meta={previews.length ? `${previews.length} 篇` : '等待预检'} />
          <div className="obsidian-importer-preview-list">
            {previews.length === 0 && <EmptyState>选择文章后执行预检，这里会显示标题、变更状态和图片问题。</EmptyState>}
            {previews.map((preview) => {
              const rowProgress = progress[preview.note.relativePath];
              return (
                <article className="obsidian-importer-preview" key={preview.note.relativePath}>
                  <Flex align="flex-start" justify="space-between" gap={3}>
                    <div className="obsidian-importer-preview-copy">
                      <Text size={1} weight="semibold">{preview.note.title}</Text>
                      <Text muted size={0} textOverflow="ellipsis">{preview.note.relativePath}</Text>
                    </div>
                    <Badge tone={STATUS_TONES[preview.status]}>{STATUS_LABELS[preview.status]}</Badge>
                  </Flex>
                  <Flex gap={3} wrap="wrap">
                    <Text muted size={0}>{preview.images.length} 张图片</Text>
                    <Text muted size={0}>/{preview.note.slug}</Text>
                    {preview.unresolvedImages.length > 0 && (
                      <Text size={0} style={{ color: 'var(--card-critical-fg-color)' }}>
                        {preview.unresolvedImages.length} 张未解析
                      </Text>
                    )}
                  </Flex>
                  {rowProgress && (
                    <div className={`obsidian-importer-progress is-${rowProgress.status}`}>
                      {rowProgress.status === 'running' && <Spinner muted />}
                      <Text size={0}>{rowProgress.message || rowProgress.status}</Text>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {previews.length > 0 && (
            <div className="obsidian-importer-summary">
              <Text size={1}>{selectedPreviewCount} 篇待处理</Text>
              <Text muted size={1}>{unresolvedCount ? `${unresolvedCount} 张图片需处理` : '所有本地图片均可解析'}</Text>
            </div>
          )}
        </Card>

        <Card className="obsidian-importer-panel" radius={3} shadow={1}>
          <PanelHeader eyebrow="03 / DESTINATION" title="发布设置" meta={publish ? '直接发布' : '保存草稿'} />
          <Box padding={4}>
            <Stack space={4}>
              <Field label="文章类型">
                <div className="obsidian-importer-segmented">
                  <button type="button" className={mode === 'project' ? 'is-active' : ''} onClick={() => setMode('project')}>项目文章</button>
                  <button type="button" className={mode === 'category' ? 'is-active' : ''} onClick={() => setMode('category')}>独立文章</button>
                </div>
              </Field>
              <Field label={mode === 'project' ? 'Category（筛选项目）' : 'Category'}>
                <select className="obsidian-importer-select" value={categoryId} onChange={(event) => { setCategoryId(event.currentTarget.value); setProjectId(''); setCollectionId(''); }}>
                  <option value="">请选择 Category</option>
                  {taxonomy.categories.map((category) => <option key={category._id} value={category._id}>{category.title}</option>)}
                </select>
              </Field>
              {mode === 'project' && (
                <>
                  <Field label="Project">
                    <select className="obsidian-importer-select" value={projectId} onChange={(event) => { setProjectId(event.currentTarget.value); setCollectionId(''); }}>
                      <option value="">请选择 Project</option>
                      {filteredProjects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}
                    </select>
                  </Field>
                  <Field label="Collection（可选）">
                    <select className="obsidian-importer-select" disabled={!projectId} value={collectionId} onChange={(event) => setCollectionId(event.currentTarget.value)}>
                      <option value="">不加入 Collection</option>
                      {filteredCollections.map((collection) => <option key={collection._id} value={collection._id}>{collection.title}</option>)}
                    </select>
                  </Field>
                </>
              )}
              <Field label="已有文章">
                <select className="obsidian-importer-select" value={conflictStrategy} onChange={(event) => setConflictStrategy(event.currentTarget.value as 'update' | 'skip-existing')}>
                  <option value="update">安全更新（保留手工字段）</option>
                  <option value="skip-existing">跳过所有已存在文章</option>
                </select>
              </Field>
              <label className="obsidian-importer-option">
                <Checkbox checked={publish} onChange={(event) => setPublish(event.currentTarget.checked)} />
                <span><Text size={1} weight="semibold">直接发布</Text><Text muted size={0}>默认关闭；关闭时仅创建或更新草稿。</Text></span>
              </label>
              <label className="obsidian-importer-option">
                <Checkbox checked={allowMissingImages} onChange={(event) => setAllowMissingImages(event.currentTarget.checked)} />
                <span><Text size={1} weight="semibold">允许缺失图片</Text><Text muted size={0}>保留原始 Markdown 图片语法后继续导入。</Text></span>
              </label>
            </Stack>
          </Box>
          <div className="obsidian-importer-panel-footer obsidian-importer-publish-footer">
            {busyMessage && Object.values(progress).some((item) => item.status === 'running') ? (
              <Button text="完成当前文章后停止" tone="critical" mode="ghost" onClick={() => { cancelRequested.current = true; }} />
            ) : (
              <Button
                disabled={!destination || importCandidateCount === 0 || Boolean(busyMessage)}
                text={publish ? `确认并发布 (${importCandidateCount})` : `导入为草稿 (${importCandidateCount})`}
                tone={publish ? 'caution' : 'primary'}
                onClick={() => void runImport()}
              />
            )}
            {failedPaths.size > 0 && !busyMessage && (
              <Button text={`重试失败项 (${failedPaths.size})`} mode="ghost" onClick={() => void runImport(failedPaths)} />
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

function PanelHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return (
    <header className="obsidian-importer-panel-header">
      <div><Text muted size={0} weight="semibold">{eyebrow}</Text><Heading as="h2" size={1}>{title}</Heading></div>
      <Text muted size={0}>{meta}</Text>
    </header>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="obsidian-importer-empty"><Text muted size={1}>{children}</Text></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="obsidian-importer-field"><Text size={1} weight="semibold">{label}</Text>{children}</label>;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function toErrorName(error: unknown) {
  return error instanceof Error ? error.name : '';
}
