// sanity/schema/custom-blocks/mindmap.ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'mindmap',
  title: '思维导图',
  type: 'object',
  fields: [
    defineField({
      name: 'data',
      title: 'Markdown 内容',
      type: 'text',
      description: '粘贴 Markdown 内容（markmap-lib 会将其渲染为交互式思维导图）。使用 ## / ### / - 等标准 Markdown 语法组织层级。',
    }),
    defineField({
      name: 'caption',
      title: '标题',
      type: 'string',
    }),
  ],
});
