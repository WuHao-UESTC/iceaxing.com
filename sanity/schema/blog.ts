// sanity/schema/blog.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'blog',
  title: '博客',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
        ],
      },
      initialValue: 'zh',
    }),
    defineField({
      name: 'project',
      title: '所属项目',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'collection',
      title: '所属合集',
      type: 'reference',
      to: [{ type: 'collection' }],
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
        { type: 'image' },
      ],
    }),
    defineField({
      name: 'excerpt',
      title: '摘要',
      type: 'text',
      description: '用于列表页和 SEO description',
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
      category: 'project.category.title',
    },
    prepare({ title, project, category }) {
      return {
        title,
        subtitle: [category, project].filter(Boolean).join(' › '),
      };
    },
  },
});
