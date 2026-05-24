import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Hr,
} from '@react-email/components';

interface Props {
  email: string;
  locale?: 'zh' | 'en';
}

const t = {
  zh: {
    preview: 'iceaxing — 请确认你的订阅',
    heading: '订阅确认',
    body: '我们收到了你的邮箱发起的订阅请求。你已成功加入 iceaxing 的订阅列表。',
    footer: '如果你没有发起此请求，请忽略此邮件。之后你收到的任何通知邮件底部都会有退订链接。',
  },
  en: {
    preview: 'iceaxing — Confirm your subscription',
    heading: 'Subscription Confirmed',
    body: "We've received a subscription request for this email address. You've been added to iceaxing's mailing list.",
    footer: "If you didn't request this, please ignore this email. Any future notification emails will include an unsubscribe link.",
  },
};

export function ConfirmSubscriptionEmail({ email, locale = 'zh' }: Props) {
  const m = t[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.preview}</Preview>
      <Body style={bodyStyle}>
        <Container>
          <Text style={headingStyle}>{m.heading}</Text>
          <Text style={textStyle}>{m.body}</Text>
          <Text style={subStyle}>{email}</Text>
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

const subStyle = {
  fontSize: '13px',
  color: '#666',
  marginBottom: '8px',
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
