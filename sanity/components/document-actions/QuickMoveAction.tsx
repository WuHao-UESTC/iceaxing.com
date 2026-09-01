import { ArrowRightIcon } from '@sanity/icons';
import { useCallback, useEffect, useState } from 'react';
import { useClient, useFormValue } from 'sanity';
import type { DocumentActionComponent } from 'sanity';
import { Box, Button, Card, Dialog, Flex, Menu, MenuItem, Stack, Text } from '@sanity/ui';

interface ProjRef {
  _id: string;
  title: string;
}

export const QuickMoveAction: DocumentActionComponent = (props) => {
  const { type, draft, published } = props;
  const doc = draft || published;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projects, setProjects] = useState<ProjRef[]>([]);
  const client = useClient({ apiVersion: '2024-01-01' });

  useEffect(() => {
    if (!dialogOpen) return;
    client.fetch<ProjRef[]>('*[_type == "project"] | order(title asc) { _id, title }').then(setProjects);
  }, [dialogOpen, client]);

  const handleMoveToProject = useCallback(
    async (projectId: string | null) => {
      if (!doc) return;
      try {
        await client
          .patch((doc as { _id: string })._id)
          .set(projectId ? { project: { _type: 'reference', _ref: projectId } } : { project: null as never, category: null as never })
          .commit();
        setDialogOpen(false);
      } catch {
        // ignore
      }
    },
    [doc, client],
  );

  if (type !== 'blog' || !doc) return null;

  const isProjectArticle = Boolean((doc as Record<string, unknown>).project);

  return {
    icon: ArrowRightIcon,
    label: isProjectArticle ? '移出项目' : '移至项目…',
    onHandle: () => {
      setDialogOpen(true);
    },
    dialog: dialogOpen
      ? {
          type: 'dialog',
          header: '移动文章',
          content: (
            <Box padding={4}>
              <Stack space={4}>
                <Text size={1}>
                  当前: {isProjectArticle ? '项目文章' : '独立文章'}
                </Text>
                <Stack space={1}>
                  {isProjectArticle ? (
                    <Button
                      tone="caution"
                      text="移除项目 · 变为独立文章"
                      onClick={() => handleMoveToProject(null)}
                    />
                  ) : (
                    <Stack space={2}>
                      {projects.map((proj) => (
                        <Button
                          key={proj._id}
                          tone="primary"
                          text={proj.title}
                          onClick={() => handleMoveToProject(proj._id)}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Box>
          ),
          onClose: () => {
            setDialogOpen(false);
          },
        }
      : undefined,
  };
};
