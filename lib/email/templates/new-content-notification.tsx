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
  contentType: 'category' | 'project' | 'collection';
  contentName: string;
  contentDescription?: string;
  parentName?: string;
  contentUrl: string;
  locale?: AppLocale;
  isGlobal: boolean;
  unsubscribeUrl: string;
}

const typeLabels = {
  zh: { category: '分类', project: '项目', collection: '合集' },
  en: { category: 'Category', project: 'Project', collection: 'Collection' },
  de: { category: 'Kategorie', project: 'Projekt', collection: 'Sammlung' },
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
    preview: (name: string) => `iceaxing - New Content: ${name}`,
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
  de: {
    preview: (name: string) => `iceaxing - Neuer Inhalt: ${name}`,
    heading: 'iceaxing Inhaltsupdate',
    globalIntro: 'Du hast alle Inhalte auf iceaxing abonniert. Neue Artikel unter diesem Eintrag werden automatisch gesendet:',
    targetedIntro: (parent: string) => `Unter "${parent}" wurde neuer Inhalt in deinem iceaxing-Abonnement hinzugefügt:`,
    nameIntro: (type: string, name: string) => `Neue ${type}: ${name}`,
    viewDetails: 'Details ansehen',
    updatePrefs: 'Einstellungen aktualisieren',
    prefsHint: 'Klicke oben, um diesen Eintrag zu deinen Abo-Einstellungen hinzuzufügen.',
    footer: 'Du möchtest diese Benachrichtigungen nicht mehr erhalten?',
    unsubscribe: 'Abmelden',
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
      <Body style={emailStyles.body}>
        <Container>
          <Text style={emailStyles.heading}>{m.heading}</Text>

          {isGlobal ? (
            <Text style={emailStyles.text}>{m.globalIntro}</Text>
          ) : (
            <Text style={emailStyles.text}>{m.targetedIntro(parentName ?? '')}</Text>
          )}

          <Text style={emailStyles.text}>
            {m.nameIntro(typeLabel, contentName)}
          </Text>

          {contentDescription && (
            <Text style={emailStyles.description}>{contentDescription}</Text>
          )}

          <Link href={contentUrl} style={emailStyles.button}>
            {isGlobal ? m.viewDetails : m.updatePrefs}
          </Link>

          {!isGlobal && (
            <Text style={emailStyles.hint}>{m.prefsHint}</Text>
          )}

          <Hr style={emailStyles.divider} />
          <Text style={emailStyles.footer}>
            {m.footer} <Link href={unsubscribeUrl}>{m.unsubscribe}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
