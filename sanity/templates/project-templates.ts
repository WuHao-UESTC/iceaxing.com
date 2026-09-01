import type { Template } from 'sanity';

export const projectTemplates: Template[] = [
  {
    id: 'project-blank',
    title: '空白项目',
    schemaType: 'project',
    value: (params?: Record<string, unknown>) => ({
      category: params?.category
        ? { _type: 'reference', _ref: params.category }
        : undefined,
    }),
  },
];
