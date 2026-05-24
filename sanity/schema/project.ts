// sanity/schema/project.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'project',
  title: '项目',
  type: 'document',
  preview: {
    select: {
      title: 'title',
      category: 'category.title',
    },
    prepare({ title, category }) {
      return {
        title,
        subtitle: category ? `${category}` : undefined,
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
      name: 'category',
      title: '所属分类',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
