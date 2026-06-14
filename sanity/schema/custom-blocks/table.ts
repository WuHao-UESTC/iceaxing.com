import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'table',
  title: '表格',
  type: 'object',
  fields: [
    defineField({
      name: 'caption',
      title: '表格标题',
      type: 'string',
      description: '可选。表格上方的标题文字。',
    }),
    defineField({
      name: 'headers',
      title: '表头',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.min(1).error('至少需要一个表头列'),
    }),
    defineField({
      name: 'rows',
      title: '数据行',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'tableRow',
          title: '行',
          fields: [
            defineField({
              name: 'cells',
              title: '单元格',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare({ cells }) {
              return { title: (cells || []).join(' | ') || '(空行)' };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      caption: 'caption',
      headers: 'headers',
      rows: 'rows',
    },
    prepare({ caption, headers, rows }) {
      const colCount = headers?.length || 0;
      const rowCount = rows?.length || 0;
      return {
        title: `📊 ${caption || '表格'}`,
        subtitle: `${colCount} 列 × ${rowCount} 行`,
      };
    },
  },
});
