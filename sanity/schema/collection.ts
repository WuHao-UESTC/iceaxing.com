// sanity/schema/collection.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'collection',
  title: '合集',
  type: 'document',
  preview: {
    select: {
      title: 'title',
      project: 'project.title',
    },
    prepare({ title, project }) {
      return {
        title,
        subtitle: project ? `${project}` : undefined,
      };
    },
  },
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
      name: 'project',
      title: '所属项目',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '描述',
      type: 'text',
    }),
    defineField({
      name: 'descriptionEn',
      title: 'Description (English)',
      type: 'text',
    }),
    defineField({
      name: 'descriptionDe',
      title: 'Description (Deutsch)',
      type: 'text',
    }),
    defineField({
      name: 'intro',
      title: '入口简介',
      type: 'text',
      rows: 3,
      description: '用于首页入口按钮展示的简短介绍。为空时会使用描述字段。',
    }),
    defineField({
      name: 'introEn',
      title: 'Entry intro (English)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'introDe',
      title: 'Entry intro (Deutsch)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'notified',
      title: '已发送通知',
      type: 'boolean',
      initialValue: false,
      hidden: true,
    }),
  ],
});
