import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { PageMotionItem } from "@/components/layout/page-transition";
import { SmithChartTool } from "@/components/tools/smith-chart/smith-chart-tool";
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
  const t = await getTranslations({ locale, namespace: "smithChart" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getStaticAlternates(locale, "/tools/smith-chart"),
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: localizedUrl(locale, "/tools/smith-chart"),
    },
    twitter: {
      card: "summary" as const,
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function SmithChartPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "smithChart" });
  const toolsT = await getTranslations({ locale, namespace: "tools" });
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("title"),
    description: t("metaDescription"),
    url: localizedUrl(locale, "/tools/smith-chart"),
    inLanguage: htmlLocale(locale),
    applicationCategory: "EngineeringApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="smith-page">
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
        <header className="smith-page-header">
          <div>
            <span className="tools-kicker">RF ENGINEERING / 02</span>
            <h1>{t("title")}</h1>
          </div>
          <p>{t("description")}</p>
        </header>
      </PageMotionItem>

      <PageMotionItem step={2}>
        <SmithChartTool />
      </PageMotionItem>
    </div>
  );
}
