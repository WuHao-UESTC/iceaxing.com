import { defineField, defineType } from 'sanity';
import { SlashCommandInput } from '../../components/slash-commands/SlashCommandInput';
import { portableTextBlock } from '../portable-text-block';

export default defineType({
  name: 'callout',
  title: '提示框',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: '类型',
      type: 'string',
      options: {
        list: [
          { title: '💬 信息', value: 'info' },
          { title: '⚠️ 警告', value: 'warning' },
          { title: '✅ 成功', value: 'success' },
          { title: '🚫 危险', value: 'danger' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
    }),
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      description: '可选。提示框的标题。',
    }),
    defineField({
      name: 'body',
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
    select: {
      variant: 'variant',
      title: 'title',
      body: 'body',
    },
    prepare({ variant, title, body }) {
      const icons: Record<string, string> = { info: '💬', warning: '⚠️', success: '✅', danger: '🚫' };
      const icon = icons[variant] || '💬';
      const bodyText = body
        ?.map((b: { children?: Array<{ text?: string }> }) =>
          b.children?.map((c) => c.text).join('')
        )
        .join(' ')
        .slice(0, 80) || '';
      return {
        title: `${icon} ${title || '提示框'}`,
        subtitle: bodyText,
      };
    },
  },
});
