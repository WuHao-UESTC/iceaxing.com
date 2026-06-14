import {
  InsertAboveIcon,
  AddCommentIcon,
  OlistIcon,
  ToggleArrowRightIcon,
  BlockElementIcon,
  SparklesIcon,
  AsteriskIcon,
  CodeBlockIcon,
  DocumentPdfIcon,
  ThListIcon,
} from '@sanity/icons';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: typeof InsertAboveIcon;
  blockType: string;
  /** If set, insert as a custom block object. Otherwise use `style` on a standard block. */
  isCustomBlock?: boolean;
  /** Standard block style (h1, h2, h3, normal) */
  style?: string;
  /** Props to set on the new custom block */
  defaultProps?: Record<string, unknown>;
}

export const slashCommands: SlashCommand[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    description: '一级标题',
    icon: BlockElementIcon,
    blockType: 'block',
    style: 'h1',
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: '二级标题',
    icon: BlockElementIcon,
    blockType: 'block',
    style: 'h2',
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: '三级标题',
    icon: BlockElementIcon,
    blockType: 'block',
    style: 'h3',
  },
  {
    id: 'callout',
    label: 'Callout',
    description: '提示框 (信息/警告/成功/危险)',
    icon: AddCommentIcon,
    blockType: 'callout',
    isCustomBlock: true,
    defaultProps: { variant: 'info', title: '', body: [] },
  },
  {
    id: 'columns',
    label: 'Columns',
    description: '多栏布局 (2-3 列)',
    icon: OlistIcon,
    blockType: 'columns',
    isCustomBlock: true,
    defaultProps: { columns: [{ _key: 'col1', content: [] }, { _key: 'col2', content: [] }] },
  },
  {
    id: 'toggle',
    label: 'Toggle',
    description: '可折叠块',
    icon: ToggleArrowRightIcon,
    blockType: 'toggle',
    isCustomBlock: true,
    defaultProps: { title: '展开/收起', open: false, body: [] },
  },
  {
    id: 'divider',
    label: 'Divider',
    description: '分割线',
    icon: InsertAboveIcon,
    blockType: 'divider',
    isCustomBlock: true,
    defaultProps: { style: 'solid' },
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: '代码块 (语法高亮)',
    icon: CodeBlockIcon,
    blockType: 'codeBlock',
    isCustomBlock: true,
    defaultProps: { language: 'plain', code: '', filename: '' },
  },
  {
    id: 'mathBlock',
    label: 'Math Block',
    description: '数学公式 (LaTeX)',
    icon: AsteriskIcon,
    blockType: 'mathBlock',
    isCustomBlock: true,
    defaultProps: { formula: '' },
  },
  {
    id: 'mindmap',
    label: 'Mind Map',
    description: '思维导图',
    icon: SparklesIcon,
    blockType: 'mindmap',
    isCustomBlock: true,
    defaultProps: { data: '', caption: '' },
  },
  {
    id: 'pdfEmbed',
    label: 'PDF Embed',
    description: 'PDF 文件嵌入',
    icon: DocumentPdfIcon,
    blockType: 'pdfEmbed',
    isCustomBlock: true,
    defaultProps: {},
  },
  {
    id: 'table',
    label: 'Table',
    description: '表格',
    icon: ThListIcon,
    blockType: 'table',
    isCustomBlock: true,
    defaultProps: { caption: '', headers: ['列 1', '列 2'], rows: [] },
  },
];

export function filterCommands(query: string): SlashCommand[] {
  if (!query) return slashCommands;
  const q = query.toLowerCase();
  return slashCommands.filter(
    (cmd) =>
      cmd.id.toLowerCase().includes(q) ||
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q),
  );
}
