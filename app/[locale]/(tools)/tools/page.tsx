import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { PageMotionItem } from "@/components/layout/page-transition";
import { getVisibleTools } from "@/components/tools/tool-catalog";
import { ToolsHub } from "@/components/tools/tools-hub";
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
  const t = await getTranslations({ locale, namespace: "tools" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getStaticAlternates(locale, "/tools"),
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: localizedUrl(locale, "/tools"),
    },
    twitter: {
      card: "summary" as const,
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function ToolsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools" });
  const catalog = getVisibleTools();
  const tools = catalog.map((tool) => ({
    ...tool,
    title: t(`items.${tool.slug}.title`),
    description: t(`items.${tool.slug}.description`),
    category: t(`categories.${tool.category}`),
    status: t(`statuses.${tool.status}`),
    action: t("openTool"),
    featureLabels: [
      t(`items.${tool.slug}.features.custom`),
      t(`items.${tool.slug}.features.local`),
      t(`items.${tool.slug}.features.precise`),
    ],
  }));
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("metaDescription"),
    url: localizedUrl(locale, "/tools"),
    inLanguage: htmlLocale(locale),
    hasPart: tools.map((tool) => ({
      "@type": "WebApplication",
      name: tool.title,
      url: localizedUrl(locale, tool.href),
      applicationCategory: "ProductivityApplication",
    })),
  };

  return (
    <div className="tools-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(collectionJsonLd) }}
      />

      <PageMotionItem step={0}>
        <nav className="tools-breadcrumb" aria-label={t("breadcrumbLabel")}>
          <Link href="/">{t("home")}</Link>
          <span aria-hidden="true">/</span>
          <span>{t("title")}</span>
        </nav>
      </PageMotionItem>

      <PageMotionItem step={1}>
        <header className="tools-hero">
          <div className="tools-hero-copy">
            <span className="tools-kicker">ICEAXING / BASECAMP UTILITIES</span>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
            <div className="tools-hero-meta">
              <span>{t("toolCount", { count: tools.length })}</span>
              <span>{t("browserReady")}</span>
              <span>{t("noAccount")}</span>
            </div>
          </div>

          <div className="tools-hero-map" aria-hidden="true">
            <svg viewBox="0 0 520 280" role="presentation">
              <path className="tools-map-contour" d="M-20 252C86 205 92 67 205 43s127 107 188 83 71-88 153-95" />
              <path className="tools-map-contour tools-map-contour-secondary" d="M-15 278C103 235 126 107 220 81s128 91 188 64 78-72 143-78" />
              <path className="tools-map-route" d="M48 246c71-31 99-102 161-130 66-30 113 69 180 29 35-21 53-50 91-73" />
              <circle className="tools-map-node" cx="209" cy="116" r="5" />
              <circle className="tools-map-node tools-map-node-small" cx="389" cy="145" r="4" />
              <path className="tools-map-flag" d="M209 116V65l38 12-38 13" />
            </svg>
            <span className="tools-map-label tools-map-label-start">01 / START</span>
            <span className="tools-map-label tools-map-label-peak">TOOLS / READY</span>
          </div>
        </header>
      </PageMotionItem>

      <PageMotionItem step={2}>
        <ToolsHub
          tools={tools}
          availableLabel={t("available")}
          localLabel={t("featureListLabel")}
          privacyTitle={t("privacyTitle")}
          privacyDescription={t("privacyDescription")}
        />
      </PageMotionItem>
    </div>
  );
}
