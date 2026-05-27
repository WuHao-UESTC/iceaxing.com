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
  postTitle: string;
  postUrl: string;
  category: string;
  project?: string;
  postExcerpt?: string;
  locale?: AppLocale;
  unsubscribeUrl: string;
}

const content = {
  zh: {
    preview: (title: string) => `iceaxing 有新文章：${title}`,
    heading: 'iceaxing 更新通知',
    intro: '你在 iceaxing 订阅的内容有更新：',
    article: (title: string) => `新文章：《${title}》`,
    readNow: '立即阅读',
    footer: '不想再收到此类通知？',
    unsubscribe: '退订',
  },
  en: {
    preview: (title: string) => `iceaxing — New Post: ${title}`,
    heading: 'iceaxing Update',
    intro: 'New content from your iceaxing subscription:',
    article: (title: string) => `"${title}"`,
    readNow: 'Read Now',
    footer: "Don't want these notifications?",
    unsubscribe: 'Unsubscribe',
  },
  de: {
    preview: (title: string) => `iceaxing - Neuer Artikel: ${title}`,
    heading: 'iceaxing Update',
    intro: 'Neue Inhalte aus deinem iceaxing-Abonnement:',
    article: (title: string) => `"${title}"`,
    readNow: 'Jetzt lesen',
    footer: 'Du möchtest diese Benachrichtigungen nicht mehr erhalten?',
    unsubscribe: 'Abmelden',
  },
};

export function NewPostNotificationEmail({
  postTitle,
  postUrl,
  category,
  project,
  postExcerpt,
  locale = 'zh',
  unsubscribeUrl,
}: Props) {
  const m = content[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.preview(postTitle)}</Preview>
      <Body style={emailStyles.body}>
        <Container>
          <Text style={emailStyles.heading}>{m.heading}</Text>
          <Text style={emailStyles.text}>{m.intro}</Text>
          <Text style={emailStyles.text}>
            {project ? `${category} > ${project}` : category}
          </Text>
          <Text style={emailStyles.text}>
            {m.article(postTitle)}
          </Text>
          {postExcerpt && (
            <Text style={emailStyles.excerpt}>{postExcerpt}</Text>
          )}
          <Link href={postUrl} style={emailStyles.button}>
            {m.readNow}
          </Link>
          <Hr style={emailStyles.divider} />
          <Text style={emailStyles.footer}>
            {m.footer} <Link href={unsubscribeUrl}>{m.unsubscribe}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
