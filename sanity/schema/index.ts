// sanity/schema/index.ts
import category from './category';
import project from './project';
import collection from './collection';
import blog from './blog';
import log from './log';
import profile from './profile';
import friend from './friend';
import mindmap from './custom-blocks/mindmap';
import mathBlock from './custom-blocks/math-block';
import codeBlock from './custom-blocks/code-block';
import pdfEmbed from './custom-blocks/pdf-embed';

export const schemaTypes = [
  category,
  project,
  collection,
  blog,
  log,
  profile,
  friend,
  mindmap,
  mathBlock,
  codeBlock,
  pdfEmbed,
];