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
}

export function NewPostNotificationEmail({
  postTitle,
  postUrl,
  category,
  project,
}: Props) {
  return (
    <Html lang="zh">
      <Head />
      <Preview>iceaxing 有新文章：{postTitle}</Preview>
      <Body style={bodyStyle}>
        <Container>
          <Text style={headingStyle}>iceaxing 更新通知</Text>
          <Text style={textStyle}>
            你在 iceaxing 订阅的内容有更新：
          </Text>
          <Text style={textStyle}>
            分类：{category} &gt; {project}
          </Text>
          <Text style={textStyle}>
            新文章：《{postTitle}》
          </Text>
          <Link href={postUrl} style={buttonStyle}>
            立即阅读
          </Link>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            不想再收到此类通知？点击邮件底部的退订链接即可。
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
