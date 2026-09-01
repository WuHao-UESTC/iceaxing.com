import { defineField, defineType } from 'sanity';
import { SlashCommandInput } from '../components/slash-commands/SlashCommandInput';
import { customBlockOf } from './custom-blocks/shared-block-of';

export default defineType({
  name: 'about',
  title: '关于',
  type: 'document',
  groups: [
    { name: 'content-zh', title: '中文内容', default: true },
    { name: 'content-en', title: 'English Content' },
    { name: 'content-de', title: 'Deutsch Inhalt' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content-zh',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'titleEn', title: 'Title (English)', type: 'string', group: 'content-en' }),
    defineField({ name: 'titleDe', title: 'Title (Deutsch)', type: 'string', group: 'content-de' }),
    defineField({
      name: 'intro',
      title: 'Entry intro',
      type: 'text',
      rows: 3,
      group: 'content-zh',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'introEn', title: 'Entry intro (English)', type: 'text', rows: 3, group: 'content-en' }),
    defineField({ name: 'introDe', title: 'Entry intro (Deutsch)', type: 'text', rows: 3, group: 'content-de' }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content-zh',
      of: customBlockOf,
      components: { input: SlashCommandInput },
    }),
    defineField({
      name: 'bodyEn',
      title: 'Body (English)',
      type: 'array',
      group: 'content-en',
      of: customBlockOf,
      components: { input: SlashCommandInput },
    }),
    defineField({
      name: 'bodyDe',
      title: 'Body (Deutsch)',
      type: 'array',
      group: 'content-de',
      of: customBlockOf,
      components: { input: SlashCommandInput },
    }),
  ],
});
