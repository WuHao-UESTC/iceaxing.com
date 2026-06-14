// sanity/schema/collection.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'collection',
  title: '合集',
  type: 'document',
  groups: [
    { name: 'content-zh', title: '中文内容', default: true },
    { name: 'content-en', title: 'English Content' },
    { name: 'content-de', title: 'Deutsch Inhalt' },
    { name: 'meta', title: '公共信息' },
    { name: 'seo', title: 'SEO' },
  ],
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
    /* ---- 中文内容 ---- */
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      group: 'content-zh',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: '入口简介',
      type: 'text',
      rows: 3,
      group: 'content-zh',
      description: '用于首页入口按钮展示的简短介绍。为空时会使用描述字段。',
    }),
    defineField({
      name: 'description',
      title: '描述',
      type: 'text',
      group: 'content-zh',
    }),

    /* ---- English Content ---- */
    defineField({
      name: 'titleEn',
      title: 'Title (English)',
      type: 'string',
      group: 'content-en',
    }),
    defineField({
      name: 'introEn',
      title: 'Entry intro (English)',
      type: 'text',
      rows: 3,
      group: 'content-en',
    }),
    defineField({
      name: 'descriptionEn',
      title: 'Description (English)',
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
      name: 'introDe',
      title: 'Entry intro (Deutsch)',
      type: 'text',
      rows: 3,
      group: 'content-de',
    }),
    defineField({
      name: 'descriptionDe',
      title: 'Description (Deutsch)',
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
      name: 'project',
      title: '所属项目',
      type: 'reference',
      group: 'meta',
      to: [{ type: 'project' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created at',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    }),

    /* ---- SEO ---- */
    defineField({
      name: 'coverImage',
      title: 'Cover image',
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
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'seo',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      group: 'seo',
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
