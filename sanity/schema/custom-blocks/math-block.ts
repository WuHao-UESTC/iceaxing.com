// sanity/schema/custom-blocks/math-block.ts
import { defineField, defineType } from 'sanity';
import { MathBlockInput } from '../../components/portable-text/MathBlockInput';

export default defineType({
  name: 'mathBlock',
  title: '数学公式',
  type: 'object',
  components: {
    input: MathBlockInput,
  },
  fields: [
    defineField({
      name: 'formula',
      title: 'LaTeX 公式',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      formula: 'formula',
    },
    prepare({ formula }) {
      return {
        title: '数学公式',
        subtitle: formula || '尚未输入公式',
      };
    },
  },
});
