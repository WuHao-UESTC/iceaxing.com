import { Box, Card, Container, Flex, Heading, Stack, Text } from '@sanity/ui';
import { useFormValue } from 'sanity';

interface DocData {
  title?: string;
  titleEn?: string;
  titleDe?: string;
  body?: Array<BlockNode>;
  bodyEn?: Array<BlockNode>;
  bodyDe?: Array<BlockNode>;
  excerpt?: string;
  excerptEn?: string;
  excerptDe?: string;
  slug?: { current?: string };
  tags?: string[];
  coverImage?: unknown;
  publishedAt?: string;
  updatedAt?: string;
}

interface BlockNode {
  _type: string;
  style?: string;
  children?: Array<{ text: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

function countWords(text: string): number {
  const cleaned = text
    .replace(/[^一-鿿\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 0;

  let count = 0;
  for (const char of cleaned) {
    // CJK characters count as individual words
    if (/[一-鿿]/.test(char)) {
      count++;
    }
  }

  // Count Latin words
  const latinWords = cleaned.replace(/[一-鿿]/g, ' ').trim();
  if (latinWords) count += latinWords.split(/\s+/).length;

  return count;
}

function extractTextFromBlocks(blocks: BlockNode[] | undefined): string {
  if (!blocks) return '';
  return blocks
    .map((block) => {
      if (block._type === 'block' && block.children) {
        return block.children.map((c) => c.text || '').join(' ');
      }
      return '';
    })
    .join(' ');
}

function readingTime(words: number): string {
  // Average reading speed: ~275 wpm for Latin, ~500 cpm for CJK mixed
  const minutes = Math.ceil(words / 350);
  if (minutes < 1) return '< 1 min';
  return `${minutes} min`;
}

function extractHeadings(blocks: BlockNode[] | undefined): Array<{ level: number; text: string }> {
  if (!blocks) return [];
  return blocks
    .filter((b) => b._type === 'block' && b.style && /^h[123]/.test(b.style))
    .map((b) => ({
      level: parseInt(b.style!.replace('h', ''), 10),
      text: b.children?.map((c) => c.text).join(' ') || '(空)',
    }));
}

interface SeoCheck {
  label: string;
  pass: boolean;
  hint: string;
}

function seoChecks(doc: DocData): SeoCheck[] {
  const zhBody = extractTextFromBlocks(doc.body);
  const zhWords = countWords(zhBody);

  return [
    {
      label: '标题',
      pass: Boolean(doc.title) && (doc.title?.length ?? 0) >= 3,
      hint: '标题至少 3 个字符',
    },
    {
      label: '摘要',
      pass: Boolean(doc.excerpt),
      hint: '填写摘要用于 SEO description',
    },
    {
      label: '封面图',
      pass: Boolean(doc.coverImage),
      hint: '添加封面图提升社交分享效果',
    },
    {
      label: '标签',
      pass: Boolean(doc.tags && doc.tags.length > 0),
      hint: '添加标签便于分类和检索',
    },
    {
      label: 'URL 标识',
      pass: Boolean(doc.slug?.current),
      hint: '设置 URL 标识',
    },
    {
      label: '发布日期',
      pass: Boolean(doc.publishedAt),
      hint: '设置发布日期',
    },
    {
      label: '正文字数',
      pass: zhWords >= 300,
      hint: zhWords < 300 ? `正文仅 ${zhWords} 字，建议 ≥ 300 字` : `正文 ${zhWords} 字 ✓`,
    },
    {
      label: '标题层级',
      pass: extractHeadings(doc.body).some((h) => h.level === 2),
      hint: '建议使用 h2 作为主要段落标题',
    },
  ];
}

export const WritingAssistantInspector = {
  name: 'writing-assistant',
  title: '写作助手',
  component: function WritingAssistantComponent() {
    const doc = useFormValue([]) as DocData | null;

    if (!doc) {
      return (
        <Container padding={4}>
          <Text muted>等待文档加载…</Text>
        </Container>
      );
    }

    const zhBody = extractTextFromBlocks(doc.body);
    const enBody = extractTextFromBlocks(doc.bodyEn);
    const deBody = extractTextFromBlocks(doc.bodyDe);

    const zhWords = countWords(zhBody);
    const enWords = countWords(enBody);
    const deWords = countWords(deBody);

    const zhHeadings = extractHeadings(doc.body);
    const checks = seoChecks(doc);
    const passedChecks = checks.filter((c) => c.pass).length;

    return (
      <Container padding={4}>
        <Stack space={5}>
          {/* Word Count & Reading Time */}
          <Card padding={4} radius={2} tone="default" border>
            <Stack space={3}>
              <Heading as="h2" size={1}>
                字数统计
              </Heading>
              {[
                { key: 'zh', label: '中文', words: zhWords, done: zhWords > 0 },
                { key: 'en', label: 'English', words: enWords, done: enWords > 0 },
                { key: 'de', label: 'Deutsch', words: deWords, done: deWords > 0 },
              ].map((l) =>
                l.done ? (
                  <Flex key={l.key} justify="space-between">
                    <Text size={1}>{l.label}</Text>
                    <Text size={1} muted>
                      {l.words.toLocaleString()} 字 · {readingTime(l.words)}
                    </Text>
                  </Flex>
                ) : null,
              )}
            </Stack>
          </Card>

          {/* Heading Tree */}
          <Card padding={4} radius={2} tone="default" border>
            <Stack space={3}>
              <Heading as="h2" size={1}>
                标题结构
              </Heading>
              {zhHeadings.length === 0 ? (
                <Text size={1} muted>
                  暂无标题
                </Text>
              ) : (
                <Stack space={1}>
                  {zhHeadings.map((h, i) => (
                    <Flex key={i} gap={2}>
                      <Text size={0} muted style={{ minWidth: '2ch' }}>
                        {'#'.repeat(h.level)}
                      </Text>
                      <Text size={1}>{h.text}</Text>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>

          {/* SEO Checklist */}
          <Card padding={4} radius={2} tone="default" border>
            <Stack space={3}>
              <Flex justify="space-between" align="center">
                <Heading as="h2" size={1}>
                  SEO 检查
                </Heading>
                <Text weight="semibold" size={1}>
                  {passedChecks}/{checks.length}
                </Text>
              </Flex>
              <Stack space={2}>
                {checks.map((check) => (
                  <Card key={check.label} padding={3} radius={1} tone={check.pass ? 'positive' : 'caution'}>
                    <Flex justify="space-between" align="center" gap={3}>
                      <Text size={1} weight="semibold">
                        {check.pass ? '✅' : '⚠️'} {check.label}
                      </Text>
                      <Text size={0} muted>
                        {check.hint}
                      </Text>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Container>
    );
  },
};
