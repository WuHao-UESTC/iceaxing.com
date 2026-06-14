// sanity/schema/log.ts
import { defineField, defineType } from 'sanity';
import { SlashCommandInput } from '../components/slash-commands/SlashCommandInput';
import { customBlockOf } from './custom-blocks/shared-block-of';

export default defineType({
  name: 'log',
  title: '日志',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: '日期',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
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
      title: '短摘要',
      type: 'text',
      description: '展示在农田地块 hover 提示',
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'array',
      of: customBlockOf,
      components: { input: SlashCommandInput },
    }),
    defineField({
      name: 'category',
      title: '类别',
      type: 'string',
      options: {
        list: [
          { title: '🌾 内容更新', value: 'content' },
          { title: '🌽 网站维护', value: 'site' },
          { title: '🥕 其他', value: 'other' },
        ],
      },
      initialValue: 'content',
    }),
  ],
  orderings: [
    { title: '日期', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] },
  ],
});
