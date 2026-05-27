// sanity/schema/profile.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'profile',
  title: '个人简介',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名称',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      title: '头像',
      type: 'image',
    }),
    defineField({
      name: 'bio',
      title: '简介',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'entryTitle',
      title: 'Entry title',
      type: 'string',
    }),
    defineField({
      name: 'entryTitleEn',
      title: 'Entry title (English)',
      type: 'string',
    }),
    defineField({
      name: 'entryTitleDe',
      title: 'Entry title (Deutsch)',
      type: 'string',
    }),
    defineField({
      name: 'entryIntro',
      title: 'Entry intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'entryIntroEn',
      title: 'Entry intro (English)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'entryIntroDe',
      title: 'Entry intro (Deutsch)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'socialLinks',
      title: '社交链接',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: '名称' },
            { name: 'url', type: 'url', title: '链接' },
          ],
        },
      ],
    }),
  ],
});
