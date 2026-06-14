import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'toggle',
  title: '折叠块',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required().error('折叠块必须有标题'),
    }),
    defineField({
      name: 'open',
      title: '默认展开',
      type: 'boolean',
      initialValue: false,
      description: '开启后，折叠块在页面加载时默认展开。',
    }),
    defineField({
      name: 'body',
      title: '内容',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image' },
        { type: 'mindmap' },
        { type: 'mathBlock' },
        { type: 'codeBlock' },
        { type: 'pdfEmbed' },
        { type: 'callout' },
        { type: 'columns' },
        { type: 'toggle' },
        { type: 'divider' },
        { type: 'table' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      open: 'open',
      body: 'body',
    },
    prepare({ title, open, body }) {
      const bodyText = body
        ?.map((b: { children?: Array<{ text?: string }> }) =>
          b.children?.map((c) => c.text).join('')
        )
        .join(' ')
        .slice(0, 80) || '';
      return {
        title: `${open ? '📂' : '📁'} ${title || '折叠块'}`,
        subtitle: bodyText,
      };
    },
  },
});
