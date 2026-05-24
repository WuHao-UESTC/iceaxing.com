// sanity/schema/custom-blocks/pdf-embed.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'pdfEmbed',
  title: 'PDF 嵌入',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'PDF 文件',
      type: 'file',
      options: { accept: '.pdf' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: '标题',
      type: 'string',
    }),
  ],
});
