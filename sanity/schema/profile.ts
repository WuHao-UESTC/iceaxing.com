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
