import assert from 'node:assert/strict';
import {
  normalizeWikiLinks,
  prepareObsidianNote,
  splitMarkdownImages,
} from '../lib/obsidian/import-core';
import {
  markdownToPortableText,
  type PtBlock,
} from '../sanity/components/markdown-paste/markdownHandler';
import { splitMathText } from '../components/blog/math-text';

type Span = { text?: string; marks?: string[] };

function spans(block: PtBlock) {
  return (block.children ?? []) as Span[];
}

const displaySource = '$$\nD_{\\mathrm{out}} = \\begin{cases}\n14\'h2000 + \\texttt{mag_code}, & V \\ge 0, \\\\\n14\'h1FFF - \\texttt{mag_code}, & V < 0.\n\\end{cases}\n$$';
const displayBlocks = markdownToPortableText(displaySource);
assert.equal(displayBlocks.length, 1);
assert.equal(displayBlocks[0]._type, 'mathBlock');
assert.equal(displayBlocks[0].formula, displaySource, 'display-math delimiters must be preserved');

const mixedDisplayFormula = '$$D_{\\mathrm{out}} = \\begin{cases}\n14\'h2000, & V \\ge 0, \\\\\n14\'h1FFF, & V < 0.\n\\end{cases}$$';
const mixedDisplaySource = `因此，输出规则为： ${mixedDisplayFormula} 其中，幅值码保持不变。`;
const mixedDisplayBlocks = markdownToPortableText(mixedDisplaySource);
assert.deepEqual(
  mixedDisplayBlocks.map((block) => block._type),
  ['block', 'mathBlock', 'block'],
  'display math mixed with surrounding prose must remain a standalone formula block',
);
assert.equal(
  mixedDisplayBlocks[1].formula,
  mixedDisplayFormula,
  'mixed multiline display math must keep both $$ delimiters',
);

const inlineSource = '输入为 $V_{\\mathrm{in}}$，输出为 \\(D_{out}\\)。';
const inlineBlocks = markdownToPortableText(inlineSource);
assert.deepEqual(
  spans(inlineBlocks[0])
    .filter((span) => span.marks?.includes('inlineMath'))
    .map((span) => span.text),
  ['$V_{\\mathrm{in}}$', '\\(D_{out}\\)'],
  'inline-math delimiters must be preserved',
);

const tableSource = [
  '| 条件 | 公式 |',
  '| --- | --- |',
  '| 正向 | $$D_{out}=14\'h2000+\\texttt{mag_code}$$ |',
].join('\n');
const tableBlocks = markdownToPortableText(tableSource);
assert.equal(tableBlocks.length, 1);
assert.equal(tableBlocks[0]._type, 'table', 'table math must stay inside the table');
assert.equal(
  (tableBlocks[0].rows as Array<{ cells: string[] }>)[0].cells[1],
  '$$D_{out}=14\'h2000+\\texttt{mag_code}$$',
);

const codeSource = [
  '````tex',
  '$$D_{out}=14\'h2000$$',
  '```',
  '[[代码中的链接|不能改写]]',
  '![代码中的图片](keep.png)',
  '````',
].join('\n');
const normalizedCode = normalizeWikiLinks(codeSource);
assert.equal(normalizedCode, codeSource, 'wiki-link normalization must not rewrite fenced code');
const codeSegments = splitMarkdownImages(normalizedCode);
assert.deepEqual(
  codeSegments,
  [{ type: 'text', value: codeSource }],
  'image extraction must not enter fenced code',
);
const codeSegment = codeSegments[0];
if (codeSegment.type !== 'text') assert.fail('expected a protected code text segment');
const codeBlocks = markdownToPortableText(codeSegment.value);
assert.equal(codeBlocks.length, 1);
assert.equal(codeBlocks[0]._type, 'codeBlock');
assert.equal(
  codeBlocks[0].code,
  [
    '$$D_{out}=14\'h2000$$',
    '```',
    '[[代码中的链接|不能改写]]',
    '![代码中的图片](keep.png)',
  ].join('\n'),
  'fenced code contents must remain byte-for-byte equivalent apart from the fence itself',
);

const rawMarkdown = `---\ntitle: 无损导入\n---\n\n${displaySource}\n`;
const note = prepareObsidianNote({
  relativePath: 'tests/lossless.md',
  markdown: rawMarkdown,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});
assert.equal(note.sourceMarkdown, rawMarkdown, 'the original Obsidian file must be retained exactly');

assert.deepEqual(
  splitMathText('阻抗除以 $(1+T_{oc})'),
  [
    { type: 'text', content: '阻抗除以 ' },
    { type: 'math', content: '(1+T_{oc})', displayMode: false },
  ],
  'a grouped inline formula with a missing closing dollar should render safely',
);
assert.deepEqual(
  splitMathText('价格为 $100'),
  [{ type: 'text', content: '价格为 $100' }],
  'a price with one dollar sign must remain plain text',
);

console.log('Markdown/Obsidian import regression checks passed.');
