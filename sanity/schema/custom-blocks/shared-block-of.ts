import { portableTextBlock } from '../portable-text-block';

// Shared custom block types for Portable Text arrays.
// Excludes `image` — add inline if the schema needs it.
export const customBlockOf = [
  portableTextBlock(),
  { type: 'mindmap' },
  { type: 'mathBlock' },
  { type: 'codeBlock' },
  { type: 'pdfEmbed' },
  { type: 'callout' },
  { type: 'columns' },
  { type: 'toggle' },
  { type: 'divider' },
  { type: 'table' },
];
