import type { Template } from 'sanity';

interface BlogRefs {
  collection?: string;
  project?: string;
  category?: string;
}

function refTo(id?: string) {
  return id ? { _type: 'reference' as const, _ref: id } : undefined;
}

function baseValue(refs?: BlogRefs) {
  return {
    theme: 'default' as const,
    language: 'zh' as const,
    tags: [] as string[],
    collection: refTo(refs?.collection),
    project: refTo(refs?.project),
    category: refTo(refs?.category),
  };
}

export const blogTemplates: Template[] = [
  {
    id: 'blog-blank',
    title: '空白文章',
    schemaType: 'blog',
    value: (params?: BlogRefs) => ({
      ...baseValue(params),
      body: [
        {
          style: 'normal',
          children: [{ _type: 'span', text: '' }],
        },
      ],
    }),
  },
  {
    id: 'blog-tech-tutorial',
    title: '技术教程',
    schemaType: 'blog',
    value: (params?: BlogRefs) => ({
      ...baseValue(params),
      tags: ['教程'],
      body: [
        { style: 'h1', children: [{ _type: 'span', text: '概述' }] },
        { style: 'normal', _key: 's1', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '环境准备' }] },
        { style: 'normal', _key: 's2', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '实现步骤' }] },
        { style: 'normal', _key: 's3', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '总结' }] },
        { style: 'normal', _key: 's4', children: [{ _type: 'span', text: '' }] },
      ],
    }),
  },
  {
    id: 'blog-reading-note',
    title: '读书笔记',
    schemaType: 'blog',
    value: (params?: BlogRefs) => ({
      ...baseValue(params),
      theme: 'serif',
      tags: ['读书'],
      body: [
        { style: 'h1', children: [{ _type: 'span', text: '书籍信息' }] },
        { style: 'normal', _key: 's1', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '核心观点' }] },
        { style: 'normal', _key: 's2', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '我的思考' }] },
        { style: 'normal', _key: 's3', children: [{ _type: 'span', text: '' }] },
      ],
    }),
  },
  {
    id: 'blog-retrospective',
    title: '项目复盘',
    schemaType: 'blog',
    value: (params?: BlogRefs) => ({
      ...baseValue(params),
      theme: 'terminal',
      tags: ['复盘'],
      body: [
        { style: 'h1', children: [{ _type: 'span', text: '背景' }] },
        { style: 'normal', _key: 's1', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '目标' }] },
        { style: 'normal', _key: 's2', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '过程' }] },
        { style: 'normal', _key: 's3', children: [{ _type: 'span', text: '' }] },
        { style: 'h2', children: [{ _type: 'span', text: '收获与教训' }] },
        { style: 'normal', _key: 's4', children: [{ _type: 'span', text: '' }] },
      ],
    }),
  },
];
