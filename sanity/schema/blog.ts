// sanity/schema/blog.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'blog',
  title: '博客',
  type: 'document',
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
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'titleEn',
      title: 'Title (English)',
      type: 'string',
    }),
    defineField({
      name: 'titleDe',
      title: 'Title (Deutsch)',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'URL 标识',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'language',
      title: '语言',
      type: 'string',
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
      name: 'project',
      title: '所属项目',
      type: 'reference',
      to: [{ type: 'project' }],
      description: '可选。项目文章选择项目；独立文章留空并选择直属分类。',
    }),
    defineField({
      name: 'category',
      title: '直属分类',
      type: 'reference',
      to: [{ type: 'category' }],
      description: '仅用于不属于任何项目的独立文章。',
      hidden: ({ document }) => Boolean(document?.project),
    }),
    defineField({
      name: 'collection',
      title: '所属合集',
      type: 'reference',
      to: [{ type: 'collection' }],
      hidden: ({ document }) => !document?.project,
    }),
    defineField({
      name: 'theme',
      title: '文章主题',
      type: 'string',
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
      name: 'body',
      title: '正文',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'mindmap' },
        { type: 'mathBlock' },
        { type: 'codeBlock' },
        { type: 'pdfEmbed' },
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
      ],
    }),
    defineField({
      name: 'bodyEn',
      title: 'Body (English)',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'mindmap' },
        { type: 'mathBlock' },
        { type: 'codeBlock' },
        { type: 'pdfEmbed' },
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
      ],
    }),
    defineField({
      name: 'bodyDe',
      title: 'Body (Deutsch)',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'mindmap' },
        { type: 'mathBlock' },
        { type: 'codeBlock' },
        { type: 'pdfEmbed' },
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
      ],
    }),
    defineField({
      name: 'excerpt',
      title: '摘要',
      type: 'text',
      description: '用于列表页和 SEO description',
    }),
    defineField({
      name: 'excerptEn',
      title: 'Excerpt (English)',
      type: 'text',
    }),
    defineField({
      name: 'excerptDe',
      title: 'Excerpt (Deutsch)',
      type: 'text',
    }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'publishedAt',
      title: '发布日期',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: '更新日期',
      type: 'datetime',
    }),
  ],
  orderings: [
    { title: '发布日期', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      project: 'project.title',
      projectCategory: 'project.category.title',
      directCategory: 'category.title',
    },
    prepare({ title, project, projectCategory, directCategory }) {
      return {
        title,
        subtitle: [directCategory || projectCategory, project].filter(Boolean).join(' / '),
      };
    },
  },
});
