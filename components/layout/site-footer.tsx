import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { SubscribeDialog } from "@/components/subscribe/subscribe-dialog";

export async function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const t = await getTranslations("nav");

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link href="/" className="site-brand">
            iceaxing
          </Link>
          <p>&copy; {currentYear} · Above the snowline</p>
        </div>
        <nav aria-label={t("categories")}>
          <Link href="/about">{t("about")}</Link>
          <Link href="/profile">{t("profile")}</Link>
          <Link href="/log">{t("log")}</Link>
          <Link href="/friends">{t("friends")}</Link>
          <a href="/feed.xml">{t("rss")}</a>
          <SubscribeDialog />
        </nav>
      </div>
    </footer>
  );
}
