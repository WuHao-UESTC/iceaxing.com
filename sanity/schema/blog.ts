// sanity/schema/blog.ts
import { defineField, defineType } from 'sanity';
import { SlashCommandInput } from '../components/slash-commands/SlashCommandInput';
import { portableTextBlock } from './portable-text-block';

const bodyOf = [
  portableTextBlock(),
  { type: 'mindmap' },
  { type: 'mathBlock' },
  { type: 'codeBlock' },
  { type: 'pdfEmbed' },
  { type: 'callout' },
  { type: 'columns' },
  { type: 'toggle' },
  { type: 'divider' },
  { type: 'table' },
  {
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'caption',
        title: '图名',
        type: 'string',
        description: '可选。显示在图片下方。',
      }),
    ],
  },
];

const bodyOfEn = [
  portableTextBlock(),
  { type: 'mindmap' },
  { type: 'mathBlock' },
  { type: 'codeBlock' },
  { type: 'pdfEmbed' },
  { type: 'callout' },
  { type: 'columns' },
  { type: 'toggle' },
  { type: 'divider' },
  { type: 'table' },
  {
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'caption',
        title: 'Caption',
        type: 'string',
      }),
    ],
  },
];

const bodyOfDe = [
  portableTextBlock(),
  { type: 'mindmap' },
  { type: 'mathBlock' },
  { type: 'codeBlock' },
  { type: 'pdfEmbed' },
  { type: 'callout' },
  { type: 'columns' },
  { type: 'toggle' },
  { type: 'divider' },
  { type: 'table' },
  {
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'caption',
        title: 'Bildunterschrift',
        type: 'string',
      }),
    ],
  },
];

export default defineType({
  name: 'blog',
  title: '博客',
  type: 'document',
  groups: [
    { name: 'content-zh', title: '中文内容', default: true },
    { name: 'content-en', title: 'English Content' },
    { name: 'content-de', title: 'Deutsch Inhalt' },
    { name: 'meta', title: '公共信息' },
    { name: 'seo', title: 'SEO' },
  ],
  validation: (Rule) =>
    Rule.custom((document) => {
      if (!document?.project && !document?.category) {
        return '请选择所属项目，或为独立文章选择直属分类。';
      }
      if (document?.project && document?.category) {
        return '项目文章会从项目继承分类，请不要同时选择直属分类。';
      }
      if (document?.collection && !document?.project) {
        return '合集文章必须属于某个项目。';
      }
      return true;
    }),
  fields: [
    /* ---- 中文内容 ---- */
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      group: 'content-zh',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'array',
      group: 'content-zh',
      of: bodyOf,
      components: { input: SlashCommandInput },
    }),
    defineField({
      name: 'excerpt',
      title: '摘要',
      type: 'text',
      group: 'content-zh',
      description: '用于列表页和 SEO description',
    }),

    /* ---- English Content ---- */
    defineField({
      name: 'titleEn',
      title: 'Title (English)',
      type: 'string',
      group: 'content-en',
    }),
    defineField({
      name: 'bodyEn',
      title: 'Body (English)',
      type: 'array',
      group: 'content-en',
      of: bodyOfEn,
      components: { input: SlashCommandInput },
    }),
    defineField({
      name: 'excerptEn',
      title: 'Excerpt (English)',
      type: 'text',
      group: 'content-en',
    }),

    /* ---- Deutsch Inhalt ---- */
    defineField({
      name: 'titleDe',
      title: 'Title (Deutsch)',
      type: 'string',
      group: 'content-de',
    }),
    defineField({
      name: 'bodyDe',
      title: 'Body (Deutsch)',
      type: 'array',
      group: 'content-de',
      of: bodyOfDe,
      components: { input: SlashCommandInput },
    }),
    defineField({
      name: 'excerptDe',
      title: 'Excerpt (Deutsch)',
      type: 'text',
      group: 'content-de',
    }),

    /* ---- 公共信息 ---- */
    defineField({
      name: 'slug',
      title: 'URL 标识',
      type: 'slug',
      group: 'meta',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'language',
      title: '语言',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: '中文', value: 'zh' },
          { title: 'English', value: 'en' },
          { title: 'Deutsch', value: 'de' },
        ],
      },
      initialValue: 'zh',
    }),
    defineField({
      name: 'theme',
      title: '文章主题',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: 'Default', value: 'default' },
          { title: 'Terminal', value: 'terminal' },
          { title: 'Serif', value: 'serif' },
          { title: 'Manga', value: 'manga' },
          { title: 'Minimal', value: 'minimal' },
        ],
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'project',
      title: '所属项目',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'project' }],
      description: '可选。项目文章选择项目；独立文章留空并选择直属分类。',
    }),
    defineField({
      name: 'category',
      title: '直属分类',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'category' }],
      description: '仅用于不属于任何项目的独立文章。',
      hidden: ({ document }) => Boolean(document?.project),
    }),
    defineField({
      name: 'collection',
      title: '所属合集',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'collection' }],
      hidden: ({ document }) => !document?.project,
    }),
    defineField({
      name: 'publishedAt',
      title: '发布日期',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: '更新日期',
      type: 'datetime',
      group: 'meta',
    }),
    defineField({
      name: 'authorName',
      title: 'Author name',
      type: 'string',
      group: 'meta',
    }),

    /* ---- SEO ---- */
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      group: 'seo',
      of: [
        {
          type: 'string',
          options: {
            list: [
              '前端', '后端', 'DevOps', '设计',
              '读书', '随笔', '教程', '复盘', '翻译',
              'AI', '性能', '工具', '开源',
            ],
          },
        },
      ],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'coverImage',
      title: '封面图',
      type: 'image',
      group: 'seo',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
    }),
  ],
  orderings: [
    { title: '发布日期', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'coverImage',
      project: 'project.title',
      projectCategory: 'project.category.title',
      directCategory: 'category.title',
      publishedAt: 'publishedAt',
    },
    prepare({ title, media, project, projectCategory, directCategory, publishedAt }) {
      return {
        title,
        media,
        subtitle: [
          [directCategory || projectCategory, project].filter(Boolean).join(' / '),
          publishedAt ? new Date(publishedAt).toLocaleDateString('zh-CN') : '',
        ].filter(Boolean).join(' · '),
      };
    },
  },
});
