import { CopyIcon } from '@sanity/icons';
import { useToast } from '@sanity/ui';
import { useCallback, useState } from 'react';
import { useClient } from 'sanity';
import type { DocumentActionComponent } from 'sanity';

export const DuplicateAction: DocumentActionComponent = (props) => {
  const { draft, published, type } = props;
  const doc = draft || published;
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [duplicating, setDuplicating] = useState(false);

  const onDuplicate = useCallback(async () => {
    if (!doc) return;
    setDuplicating(true);
    try {
      const { _id, _rev, _createdAt, _updatedAt, ...rest } = doc as Record<string, unknown>;
      await client.create({
        ...rest,
        _type: type,
        title: `${(rest.title as string) || 'Untitled'} (副本)`,
        slug: undefined, // Let Sanity regenerate the slug
      });
      toast.push({
        status: 'success',
        title: '复制成功',
        description: '文章已复制为新建文档。',
      });
    } catch {
      toast.push({
        status: 'error',
        title: '复制失败',
        description: '请稍后重试。',
      });
    } finally {
      setDuplicating(false);
    }
  }, [doc, client, type, toast]);

  if (!doc) return null;

  return {
    icon: CopyIcon,
    label: duplicating ? '复制中…' : '复制文章',
    onHandle: onDuplicate,
  };
};
