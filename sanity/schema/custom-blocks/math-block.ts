// sanity/schema/custom-blocks/math-block.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'mathBlock',
  title: '数学公式',
  type: 'object',
  fields: [
    defineField({
      name: 'formula',
      title: 'LaTeX 公式',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
  ],
});
