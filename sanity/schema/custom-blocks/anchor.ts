import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'anchor',
  title: 'HTML anchor',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'Anchor ID',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^[^\s"'<>]+$/),
    }),
  ],
  preview: {
    select: { id: 'id' },
    prepare({ id }) {
      return {
        title: `#${id || 'anchor'}`,
        subtitle: 'HTML anchor',
      };
    },
  },
});
