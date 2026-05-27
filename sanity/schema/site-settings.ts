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
    defineField({
      name: 'logEntryTitle',
      title: 'Log entry title',
      type: 'string',
    }),
    defineField({
      name: 'logEntryTitleEn',
      title: 'Log entry title (English)',
      type: 'string',
    }),
    defineField({
      name: 'logEntryTitleDe',
      title: 'Log entry title (Deutsch)',
      type: 'string',
    }),
    defineField({
      name: 'logEntryIntro',
      title: 'Log entry intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logEntryIntroEn',
      title: 'Log entry intro (English)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logEntryIntroDe',
      title: 'Log entry intro (Deutsch)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'friendsEntryTitle',
      title: 'Friends entry title',
      type: 'string',
    }),
    defineField({
      name: 'friendsEntryTitleEn',
      title: 'Friends entry title (English)',
      type: 'string',
    }),
    defineField({
      name: 'friendsEntryTitleDe',
      title: 'Friends entry title (Deutsch)',
      type: 'string',
    }),
    defineField({
      name: 'friendsEntryIntro',
      title: 'Friends entry intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'friendsEntryIntroEn',
      title: 'Friends entry intro (English)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'friendsEntryIntroDe',
      title: 'Friends entry intro (Deutsch)',
      type: 'text',
      rows: 3,
    }),
  ],
});
