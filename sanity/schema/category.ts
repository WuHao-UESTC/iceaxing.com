// sanity/schema/category.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'category',
  title: '分类',
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
      name: 'description',
      title: '描述',
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
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'icon',
      title: '图标',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'notified',
      title: '已发送通知',
      type: 'boolean',
      initialValue: false,
      hidden: true,
    }),
  ],
  orderings: [
    { title: '排序', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
});
