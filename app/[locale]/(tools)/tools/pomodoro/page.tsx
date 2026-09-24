import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { PageMotionItem } from "@/components/layout/page-transition";
import { PomodoroTimer } from "@/components/tools/pomodoro/pomodoro-timer";
import {
  SITE_NAME,
  getStaticAlternates,
  jsonLd,
  localizedUrl,
} from "@/lib/seo";
import { htmlLocale } from "@/lib/i18n/locales";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pomodoro" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getStaticAlternates(locale, "/tools/pomodoro"),
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: localizedUrl(locale, "/tools/pomodoro"),
    },
    twitter: {
      card: "summary" as const,
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function PomodoroPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pomodoro" });
  const toolsT = await getTranslations({ locale, namespace: "tools" });
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("title"),
    description: t("metaDescription"),
    url: localizedUrl(locale, "/tools/pomodoro"),
    inLanguage: htmlLocale(locale),
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <div className="pomodoro-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(appJsonLd) }}
      />

      <PageMotionItem step={0}>
        <nav className="tools-breadcrumb" aria-label={toolsT("breadcrumbLabel")}>
          <Link href="/">{toolsT("home")}</Link>
          <span aria-hidden="true">/</span>
          <Link href="/tools">{toolsT("title")}</Link>
          <span aria-hidden="true">/</span>
          <span>{t("title")}</span>
        </nav>
      </PageMotionItem>

      <PageMotionItem step={1}>
        <header className="pomodoro-page-header">
          <div>
            <span className="tools-kicker">FOCUS ROUTE / 01</span>
            <h1>{t("title")}</h1>
          </div>
          <p>{t("description")}</p>
        </header>
      </PageMotionItem>

      <PageMotionItem step={2}>
        <PomodoroTimer />
      </PageMotionItem>
    </div>
  );
}
