import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'divider',
  title: '分隔线',
  type: 'object',
  fields: [
    defineField({
      name: 'style',
      title: '样式',
      type: 'string',
      options: {
        list: [
          { title: '实线', value: 'solid' },
          { title: '虚线', value: 'dashed' },
          { title: '点线', value: 'dotted' },
        ],
        layout: 'radio',
      },
      initialValue: 'solid',
    }),
  ],
  preview: {
    select: { style: 'style' },
    prepare({ style }) {
      const labels: Record<string, string> = { solid: '实线', dashed: '虚线', dotted: '点线' };
      return {
        title: `➖ 分隔线 (${labels[style] || style})`,
      };
    },
  },
});
