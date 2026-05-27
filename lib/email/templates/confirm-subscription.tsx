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
import { emailStyles } from './styles';
import type { AppLocale } from '@/lib/i18n/locales';

interface Props {
  email: string;
  locale?: AppLocale;
  subscriptionCount?: number;
  isAllContent?: boolean;
  unsubscribeUrl?: string;
}

const t = {
  zh: {
    preview: 'iceaxing - 请确认你的订阅',
    heading: '订阅确认',
    body: '我们收到了由这个邮箱发起的订阅请求。你已成功加入 iceaxing 的订阅列表。',
    allContent: '订阅范围：全部内容',
    customContent: '订阅范围：已选择 {count} 个分类/项目',
    footer: '如果你没有发起此请求，可以随时',
    unsubscribe: '退订',
    footerEnd: '。',
  },
  en: {
    preview: 'iceaxing - Confirm your subscription',
    heading: 'Subscription Confirmed',
    body: "We've received a subscription request for this email address. You've been added to iceaxing's mailing list.",
    allContent: 'Subscription scope: All content',
    customContent: 'Subscription scope: {count} selected',
    footer: "If you didn't request this, you can ",
    unsubscribe: 'unsubscribe',
    footerEnd: ' at any time.',
  },
  de: {
    preview: 'iceaxing - Bestätige dein Abonnement',
    heading: 'Abonnement bestätigt',
    body: 'Wir haben eine Abo-Anfrage für diese E-Mail-Adresse erhalten. Du wurdest in die Mailingliste von iceaxing aufgenommen.',
    allContent: 'Abo-Umfang: alle Inhalte',
    customContent: 'Abo-Umfang: {count} ausgewählt',
    footer: 'Falls du dies nicht angefordert hast, kannst du dich jederzeit ',
    unsubscribe: 'abmelden',
    footerEnd: '.',
  },
};

export function ConfirmSubscriptionEmail({
  email,
  locale = 'zh',
  subscriptionCount = 0,
  isAllContent = true,
  unsubscribeUrl,
}: Props) {
  const m = t[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.preview}</Preview>
      <Body style={emailStyles.body}>
        <Container>
          <Text style={emailStyles.heading}>{m.heading}</Text>
          <Text style={emailStyles.text}>{m.body}</Text>
          <Text style={emailStyles.mutedText}>{email}</Text>
          <Text style={emailStyles.mutedText}>
            {isAllContent
              ? m.allContent
              : m.customContent.replace('{count}', String(subscriptionCount))
            }
          </Text>
          <Hr style={emailStyles.divider} />
          <Text style={emailStyles.footer}>
            {m.footer}
            {unsubscribeUrl && <Link href={unsubscribeUrl}>{m.unsubscribe}</Link>}
            {m.footerEnd}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
