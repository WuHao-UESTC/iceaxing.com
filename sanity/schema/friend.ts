// sanity/schema/friend.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'friend',
  title: '友链',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '名称',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: '链接',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      title: '头像',
      type: 'image',
    }),
    defineField({
      name: 'description',
      title: '简介',
      type: 'text',
    }),
    defineField({
      name: 'order',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
