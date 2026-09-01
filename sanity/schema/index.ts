// sanity/schema/index.ts
import category from './category';
import project from './project';
import collection from './collection';
import blog from './blog';
import log from './log';
import profile from './profile';
import friend from './friend';
import motto from './motto';
import about from './about';
import siteSettings from './site-settings';
import mindmap from './custom-blocks/mindmap';
import mathBlock from './custom-blocks/math-block';
import codeBlock from './custom-blocks/code-block';
import pdfEmbed from './custom-blocks/pdf-embed';
import callout from './custom-blocks/callout';
import columns from './custom-blocks/columns';
import toggle from './custom-blocks/toggle';
import divider from './custom-blocks/divider';
import table from './custom-blocks/table';

export const schemaTypes = [
  category,
  project,
  collection,
  blog,
  log,
  profile,
  friend,
  motto,
  about,
  siteSettings,
  mindmap,
  mathBlock,
  codeBlock,
  pdfEmbed,
  callout,
  columns,
  toggle,
  divider,
  table,
];
