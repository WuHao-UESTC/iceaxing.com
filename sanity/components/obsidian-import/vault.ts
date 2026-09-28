import {
  basename,
  extension,
  normalizeLookupPath,
  normalizeVaultPath,
  OBSIDIAN_IMAGE_EXTENSIONS,
  resolveVaultTarget,
  stem,
} from '../../../lib/obsidian/import-core';

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  queryPermission?(options: { mode: 'read' }): Promise<PermissionState>;
  requestPermission?(options: { mode: 'read' }): Promise<PermissionState>;
};

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: WellKnownDirectory;
  }) => Promise<FileSystemDirectoryHandle>;
};

type WellKnownDirectory =
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'music'
  | 'pictures'
  | 'videos';

export type VaultFileEntry = {
  path: string;
  handle: FileSystemFileHandle;
};

export type VaultImageEntry = VaultFileEntry & {
  extension: string;
};

export type VaultSnapshot = {
  name: string;
  handle: FileSystemDirectoryHandle;
  notes: VaultFileEntry[];
  images: VaultImageEntry[];
  imageIndex: {
    byPath: Map<string, VaultImageEntry>;
    byBasename: Map<string, VaultImageEntry[]>;
    byStem: Map<string, VaultImageEntry[]>;
  };
};

const SKIPPED_DIRECTORIES = new Set(['.git', '.obsidian', '.claude', '.claudian']);

export function supportsDirectoryPicker() {
  return typeof window !== 'undefined' && Boolean((window as WindowWithDirectoryPicker).showDirectoryPicker);
}

export async function chooseVaultDirectory() {
  const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker;
  if (!picker) throw new Error('当前浏览器不支持目录选择，请使用最新版 Chrome 或 Edge。');
  return picker({ id: 'iceaxing-obsidian-vault', mode: 'read', startIn: 'documents' });
}

export async function ensureVaultPermission(handle: FileSystemDirectoryHandle) {
  const permissionHandle = handle as DirectoryHandleWithEntries;
  if (!permissionHandle.queryPermission) return true;
  if (await permissionHandle.queryPermission({ mode: 'read' }) === 'granted') return true;
  if (!permissionHandle.requestPermission) return false;
  return (await permissionHandle.requestPermission({ mode: 'read' })) === 'granted';
}

async function walkDirectory(
  directory: FileSystemDirectoryHandle,
  prefix: string,
  files: VaultFileEntry[],
) {
  for await (const [name, handle] of (directory as DirectoryHandleWithEntries).entries()) {
    if (handle.kind === 'directory') {
      if (SKIPPED_DIRECTORIES.has(name.toLocaleLowerCase())) continue;
      await walkDirectory(handle as FileSystemDirectoryHandle, normalizeVaultPath(`${prefix}/${name}`), files);
    } else {
      files.push({
        path: normalizeVaultPath(`${prefix}/${name}`),
        handle: handle as FileSystemFileHandle,
      });
    }
  }
}

export async function scanVault(handle: FileSystemDirectoryHandle): Promise<VaultSnapshot> {
  const files: VaultFileEntry[] = [];
  await walkDirectory(handle, '', files);

  const notes = files
    .filter((file) => extension(file.path) === '.md')
    .filter((file) => basename(file.path).toLocaleLowerCase() !== 'claude.md')
    .filter((file) => !normalizeLookupPath(file.path).startsWith('system/attachments/'))
    .sort((left, right) => left.path.localeCompare(right.path, 'zh-CN'));
  const images = files
    .filter((file) => OBSIDIAN_IMAGE_EXTENSIONS.has(extension(file.path)))
    .map((file) => ({ ...file, extension: extension(file.path) }));
  const byPath = new Map<string, VaultImageEntry>();
  const byBasename = new Map<string, VaultImageEntry[]>();
  const byStem = new Map<string, VaultImageEntry[]>();

  for (const image of images) {
    const pathKey = normalizeLookupPath(image.path);
    const basenameKey = basename(image.path).toLocaleLowerCase();
    const stemKey = stem(image.path).toLocaleLowerCase();
    byPath.set(pathKey, image);
    byBasename.set(basenameKey, [...(byBasename.get(basenameKey) ?? []), image]);
    byStem.set(stemKey, [...(byStem.get(stemKey) ?? []), image]);
  }

  return {
    name: handle.name,
    handle,
    notes,
    images,
    imageIndex: { byPath, byBasename, byStem },
  };
}

export function resolveVaultImage(
  target: string,
  notePath: string,
  snapshot: VaultSnapshot,
): VaultImageEntry | null {
  const relativeTarget = resolveVaultTarget(notePath, target);
  const cleanTarget = normalizeVaultPath(target.replace(/[?#].*$/, ''));
  const targetBasename = basename(cleanTarget);
  const exactCandidates = [
    relativeTarget,
    cleanTarget,
    `System/Attachments/${targetBasename}`,
  ];

  if (/\.excalidraw$/i.test(cleanTarget)) {
    exactCandidates.unshift(
      `System/Attachments/${targetBasename}.png`,
      `System/Attachments/${cleanTarget.replace(/\.excalidraw$/i, '.png')}`,
    );
  }

  for (const candidate of exactCandidates) {
    const match = snapshot.imageIndex.byPath.get(normalizeLookupPath(candidate));
    if (match) return match;
  }

  const basenameMatches = snapshot.imageIndex.byBasename.get(targetBasename.toLocaleLowerCase()) ?? [];
  if (basenameMatches.length === 1) return basenameMatches[0];

  if (!extension(cleanTarget)) {
    const stemMatches = snapshot.imageIndex.byStem.get(targetBasename.toLocaleLowerCase()) ?? [];
    if (stemMatches.length === 1) return stemMatches[0];
  }

  return null;
}

const DATABASE_NAME = 'iceaxing-obsidian-importer';
const STORE_NAME = 'handles';
const VAULT_HANDLE_KEY = 'vault';

function openHandleDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVaultHandle(handle: FileSystemDirectoryHandle) {
  const database = await openHandleDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(handle, VAULT_HANDLE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function loadVaultHandle() {
  const database = await openHandleDatabase();
  const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(VAULT_HANDLE_KEY);
    request.onsuccess = () => resolve(request.result as FileSystemDirectoryHandle | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return handle;
}
