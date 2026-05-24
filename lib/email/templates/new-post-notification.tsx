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
  postTitle: string;
  postUrl: string;
  category: string;
  project: string;
  locale?: 'zh' | 'en';
}

const content = {
  zh: {
    preview: (title: string) => `iceaxing 有新文章：${title}`,
    heading: 'iceaxing 更新通知',
    intro: '你在 iceaxing 订阅的内容有更新：',
    article: (title: string) => `新文章：《${title}》`,
    readNow: '立即阅读',
    footer: '不想再收到此类通知？点击邮件底部的退订链接即可。',
  },
  en: {
    preview: (title: string) => `iceaxing — New Post: ${title}`,
    heading: 'iceaxing Update',
    intro: 'New content from your iceaxing subscription:',
    article: (title: string) => `"${title}"`,
    readNow: 'Read Now',
    footer: "Don't want these notifications? Click the unsubscribe link at the bottom of this email.",
  },
};

export function NewPostNotificationEmail({
  postTitle,
  postUrl,
  category,
  project,
  locale = 'zh',
}: Props) {
  const m = content[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.preview(postTitle)}</Preview>
      <Body style={bodyStyle}>
        <Container>
          <Text style={headingStyle}>{m.heading}</Text>
          <Text style={textStyle}>{m.intro}</Text>
          <Text style={textStyle}>
            {category} &gt; {project}
          </Text>
          <Text style={textStyle}>
            {m.article(postTitle)}
          </Text>
          <Link href={postUrl} style={buttonStyle}>
            {m.readNow}
          </Link>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>{m.footer}</Text>
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

const hrStyle = {
  marginTop: '24px',
  borderColor: '#e4e4e7',
};

const footerStyle = {
  fontSize: '11px',
  color: '#999',
  marginTop: '8px',
};
