import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface Props {
  contentType: 'category' | 'project' | 'collection';
  contentName: string;
  contentDescription?: string;
  parentName?: string;
  contentUrl: string;
  locale?: 'zh' | 'en';
  isGlobal: boolean;
  unsubscribeUrl: string;
}

const typeLabels = {
  zh: { category: '分类', project: '项目', collection: '合集' },
  en: { category: 'Category', project: 'Project', collection: 'Collection' },
};

const content = {
  zh: {
    preview: (name: string) => `iceaxing 新增内容：${name}`,
    heading: 'iceaxing 内容更新',
    globalIntro: '你在 iceaxing 订阅了全部内容。以下新增内容的相关文章将自动推送给你：',
    targetedIntro: (parent: string) => `你在 iceaxing 订阅的"${parent}"下新增了内容：`,
    nameIntro: (type: string, name: string) => `新增${type}：${name}`,
    viewDetails: '查看详情',
    updatePrefs: '更新订阅偏好',
    prefsHint: '点击上方按钮，在订阅弹窗中勾选新增内容即可完成订阅。',
    footer: '不想再收到此类通知？',
    unsubscribe: '退订',
  },
  en: {
    preview: (name: string) => `iceaxing — New Content: ${name}`,
    heading: 'iceaxing Content Update',
    globalIntro: "You're subscribed to all content on iceaxing. New posts under the following addition will be sent to you automatically:",
    targetedIntro: (parent: string) => `New content has been added under "${parent}" in your iceaxing subscription:`,
    nameIntro: (type: string, name: string) => `New ${type}: ${name}`,
    viewDetails: 'View Details',
    updatePrefs: 'Update Preferences',
    prefsHint: 'Click the button above to add this to your subscription preferences.',
    footer: "Don't want these notifications?",
    unsubscribe: 'Unsubscribe',
  },
};

export function NewContentNotificationEmail({
  contentType,
  contentName,
  contentDescription,
  parentName,
  contentUrl,
  locale = 'zh',
  isGlobal,
  unsubscribeUrl,
}: Props) {
  const m = content[locale];
  const typeLabel = typeLabels[locale][contentType];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.preview(contentName)}</Preview>
      <Body style={bodyStyle}>
        <Container>
          <Text style={headingStyle}>{m.heading}</Text>

          {isGlobal ? (
            <Text style={textStyle}>{m.globalIntro}</Text>
          ) : (
            <Text style={textStyle}>{m.targetedIntro(parentName ?? '')}</Text>
          )}

          <Text style={textStyle}>
            {m.nameIntro(typeLabel, contentName)}
          </Text>

          {contentDescription && (
            <Text style={descStyle}>{contentDescription}</Text>
          )}

          <Link href={contentUrl} style={buttonStyle}>
            {isGlobal ? m.viewDetails : m.updatePrefs}
          </Link>

          {!isGlobal && (
            <Text style={hintStyle}>{m.prefsHint}</Text>
          )}

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            {m.footer} <Link href={unsubscribeUrl}>{m.unsubscribe}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, sans-serif',
  padding: '20px',
};

const headingStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const textStyle = {
  fontSize: '14px',
  color: '#333',
  marginBottom: '8px',
};

const descStyle = {
  fontSize: '13px',
  color: '#666',
  marginBottom: '12px',
  fontStyle: 'italic',
};

const buttonStyle = {
  display: 'inline-block',
  padding: '10px 20px',
  backgroundColor: '#18181b',
  color: '#ffffff',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  marginTop: '12px',
};

const hintStyle = {
  fontSize: '11px',
  color: '#999',
  marginTop: '8px',
};

const hrStyle = {
  marginTop: '24px',
  borderColor: '#e4e4e7',
};

const footerStyle = {
  fontSize: '11px',
  color: '#999',
  marginTop: '8px',
};
