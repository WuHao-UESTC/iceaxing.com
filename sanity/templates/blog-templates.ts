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

function textBlock(blockKey: string, style: 'normal' | 'h1' | 'h2', text: string) {
  return {
    _key: blockKey,
    _type: 'block' as const,
    style,
    markDefs: [],
    children: [
      {
        _key: `${blockKey}-span`,
        _type: 'span' as const,
        text,
        marks: [],
      },
    ],
  };
}

export const blogTemplates: Template[] = [
  {
    id: 'blog-blank',
    title: '空白文章',
    schemaType: 'blog',
    value: (params?: BlogRefs) => ({
      ...baseValue(params),
      body: [textBlock('blank-intro', 'normal', '')],
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
        textBlock('tutorial-overview-heading', 'h1', '概述'),
        textBlock('tutorial-overview', 'normal', ''),
        textBlock('tutorial-setup-heading', 'h2', '环境准备'),
        textBlock('tutorial-setup', 'normal', ''),
        textBlock('tutorial-steps-heading', 'h2', '实现步骤'),
        textBlock('tutorial-steps', 'normal', ''),
        textBlock('tutorial-summary-heading', 'h2', '总结'),
        textBlock('tutorial-summary', 'normal', ''),
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
        textBlock('reading-info-heading', 'h1', '书籍信息'),
        textBlock('reading-info', 'normal', ''),
        textBlock('reading-ideas-heading', 'h2', '核心观点'),
        textBlock('reading-ideas', 'normal', ''),
        textBlock('reading-thoughts-heading', 'h2', '我的思考'),
        textBlock('reading-thoughts', 'normal', ''),
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
        textBlock('retro-background-heading', 'h1', '背景'),
        textBlock('retro-background', 'normal', ''),
        textBlock('retro-goals-heading', 'h2', '目标'),
        textBlock('retro-goals', 'normal', ''),
        textBlock('retro-process-heading', 'h2', '过程'),
        textBlock('retro-process', 'normal', ''),
        textBlock('retro-lessons-heading', 'h2', '收获与教训'),
        textBlock('retro-lessons', 'normal', ''),
      ],
    }),
  },
];
