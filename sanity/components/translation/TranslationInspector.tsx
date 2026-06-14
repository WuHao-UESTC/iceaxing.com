import { Box, Card, Container, Flex, Heading, Stack, Text } from '@sanity/ui';
import { useFormValue } from 'sanity';

interface DocData {
  title?: string;
  titleEn?: string;
  titleDe?: string;
  body?: unknown[];
  bodyEn?: unknown[];
  bodyDe?: unknown[];
  excerpt?: string;
  excerptEn?: string;
  excerptDe?: string;
}

export const TranslationInspector = {
  name: 'translation-progress',
  title: '翻译进度',
  component: function TranslationInspectorComponent() {
    const doc = useFormValue([]) as DocData | null;

    if (!doc) {
      return (
        <Container padding={4}>
          <Text muted>等待文档加载…</Text>
        </Container>
      );
    }

    const locales = [
      {
        key: 'zh',
        label: '中文 (主语言)',
        hasTitle: Boolean(doc.title),
        hasBody: Array.isArray(doc.body) && doc.body.length > 0,
        hasExcerpt: Boolean(doc.excerpt),
      },
      {
        key: 'en',
        label: 'English',
        hasTitle: Boolean(doc.titleEn),
        hasBody: Array.isArray(doc.bodyEn) && doc.bodyEn.length > 0,
        hasExcerpt: Boolean(doc.excerptEn),
      },
      {
        key: 'de',
        label: 'Deutsch',
        hasTitle: Boolean(doc.titleDe),
        hasBody: Array.isArray(doc.bodyDe) && doc.bodyDe.length > 0,
        hasExcerpt: Boolean(doc.excerptDe),
      },
    ];

    const totalDone = locales.reduce((acc, l) => {
      const fields = [l.hasTitle, l.hasBody, l.hasExcerpt];
      return acc + fields.filter(Boolean).length;
    }, 0);
    const totalFields = 9; // 3 locales × 3 fields

    return (
      <Container padding={4}>
        <Stack space={5}>
          <Flex justify="space-between" align="center">
            <Heading as="h2" size={1}>
              翻译进度
            </Heading>
            <Text weight="semibold" size={2}>
              {totalDone}/{totalFields}
            </Text>
          </Flex>

          {locales.map((locale) => {
            const fields = [
              { label: '标题', done: locale.hasTitle },
              { label: '正文', done: locale.hasBody },
              { label: '摘要', done: locale.hasExcerpt },
            ];
            const doneCount = fields.filter((f) => f.done).length;
            const complete = doneCount === 3;
            const none = doneCount === 0;

            return (
              <Card
                key={locale.key}
                padding={4}
                radius={2}
                tone={complete ? 'positive' : none ? 'critical' : 'caution'}
              >
                <Stack space={3}>
                  <Flex justify="space-between" align="center">
                    <Heading as="h3" size={0}>
                      {locale.label}
                    </Heading>
                    <Text weight="semibold" size={1}>
                      {doneCount}/3
                    </Text>
                  </Flex>
                  <Flex gap={2} wrap="wrap">
                    {fields.map((field) => (
                      <Card key={field.label} padding={2} radius={1} tone={field.done ? 'positive' : 'transparent'}>
                        <Text size={0}>
                          {field.done ? '✅' : '⬜'} {field.label}
                        </Text>
                      </Card>
                    ))}
                  </Flex>
                </Stack>
              </Card>
            );
          })}

          <Card padding={4} radius={2} tone="default" border>
            <Heading as="h3" size={0} style={{ marginBottom: '0.5rem' }}>
              翻译指南
            </Heading>
            <Text size={1} muted>
              主语言为中文，英文和德文为可选翻译。翻译时建议意译而非直译，保持文章风格一致。
            </Text>
          </Card>
        </Stack>
      </Container>
    );
  },
};
