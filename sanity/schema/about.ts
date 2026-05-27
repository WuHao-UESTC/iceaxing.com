import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'titleEn', title: 'Title (English)', type: 'string' }),
    defineField({ name: 'titleDe', title: 'Title (Deutsch)', type: 'string' }),
    defineField({
      name: 'intro',
      title: 'Entry intro',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'introEn', title: 'Entry intro (English)', type: 'text', rows: 3 }),
    defineField({ name: 'introDe', title: 'Entry intro (Deutsch)', type: 'text', rows: 3 }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'bodyEn', title: 'Body (English)', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'bodyDe', title: 'Body (Deutsch)', type: 'array', of: [{ type: 'block' }] }),
  ],
});
