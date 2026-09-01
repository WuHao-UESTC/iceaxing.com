// sanity/schema/custom-blocks/code-block.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'codeBlock',
  title: '代码块',
  type: 'object',
  fields: [
    defineField({
      name: 'language',
      title: '语言',
      type: 'string',
      options: {
        list: [
          'javascript', 'typescript', 'python', 'rust', 'go',
          'bash', 'json', 'yaml', 'html', 'css', 'sql', 'text',
        ].map((lang) => ({ title: lang, value: lang })),
      },
      initialValue: 'text',
    }),
    defineField({
      name: 'code',
      title: '代码',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'filename',
      title: '文件名',
      type: 'string',
    }),
  ],
});
