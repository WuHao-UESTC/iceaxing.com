import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'homeIntro',
      title: 'Home intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'homeIntroEn',
      title: 'Home intro (English)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'homeIntroDe',
      title: 'Home intro (Deutsch)',
      type: 'text',
      rows: 3,
    }),
  ],
});
