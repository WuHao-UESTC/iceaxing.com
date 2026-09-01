import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'motto',
  title: '主页格言',
  type: 'document',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'textEn',
      title: 'Text (English)',
      type: 'string',
    }),
    defineField({
      name: 'textDe',
      title: 'Text (Deutsch)',
      type: 'string',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
