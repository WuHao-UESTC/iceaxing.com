import { defineField, defineType } from 'sanity';
import { SlashCommandInput } from '../../components/slash-commands/SlashCommandInput';
import { portableTextBlock } from '../portable-text-block';

export default defineType({
  name: 'columns',
  title: '多栏布局',
  type: 'object',
  fields: [
    defineField({
      name: 'columns',
      title: '栏',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'column',
          title: '栏',
          fields: [
            defineField({
              name: 'content',
              title: '内容',
              type: 'array',
              components: { input: SlashCommandInput },
              of: [
                portableTextBlock(),
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
            select: { content: 'content' },
            prepare({ content }) {
              const text = content
                ?.map((b: { children?: Array<{ text?: string }> }) =>
                  b.children?.map((c) => c.text).join('')
                )
                .join(' ')
                .slice(0, 60) || '(空)';
              return { title: text, subtitle: '栏' };
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(2).max(3).error('栏数必须在 2 到 3 之间'),
    }),
  ],
  preview: {
    select: { columns: 'columns' },
    prepare({ columns }) {
      const count = columns?.length || 0;
      return {
        title: `📐 ${count} 栏布局`,
        subtitle: `${count} 列内容`,
      };
    },
  },
});
