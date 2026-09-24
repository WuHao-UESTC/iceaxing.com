import { Link } from "@/lib/i18n/navigation";
import { getAllCategories } from "@/lib/sanity/queries";
import { SearchDialog } from "@/components/ui/search-dialog";
import { SubscribeDialog } from "@/components/subscribe/subscribe-dialog";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { getLocale, getTranslations } from "next-intl/server";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const locale = await getLocale();
  const categories = await getAllCategories(locale);
  const t = await getTranslations("nav");
  const skillCategories = categories.filter((cat) =>
    cat.tags?.includes("skill"),
  );
  const lifeCategories = categories.filter((cat) => cat.tags?.includes("life"));
  const sectionLinks = [
    {
      href: `/${categories.find((cat) => cat.tags?.includes("skill"))?.slug ?? "skill"}`,
      label: t("techStack"),
      categories: skillCategories,
    },
    {
      href: `/${categories.find((cat) => cat.tags?.includes("life"))?.slug ?? "life"}`,
      label: t("lifeSlices"),
      categories: lifeCategories,
    },
    {
      href: `/${categories.find((cat) => cat.tags?.includes("daily-ramblings"))?.slug ?? "daily-ramblings"}`,
      label: t("ramblings"),
      categories: [],
    },
    {
      href: "/tools",
      label: t("tools"),
      categories: [],
    },
  ];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          <svg viewBox="0 0 36 28" fill="none" aria-hidden="true">
            <path
              d="M2 24C9 21 13 12 19 4C23 14 27 16 34 20M9 24C17 24 21 18 25 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          iceaxing
        </Link>

        <nav className="site-desktop-nav text-[var(--color-text-muted)]">
          {sectionLinks.map((link) =>
            link.categories.length > 0 ? (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  {link.label}
                </Link>
                <div className="absolute top-full left-0 mt-2 min-w-[180px] rounded-lg border border-[color:var(--line)] bg-[var(--color-panel)] py-1 shadow-xl shadow-black/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                  {link.categories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/${cat.slug}`}
                      className="block px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-panel-soft)] hover:text-[var(--color-text)]"
                    >
                      {cat.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-[var(--color-text)] transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            href="/about"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            {t("about")}
          </Link>

          <div className="site-nav-tools">
            <SearchDialog categories={categories} />
            <SubscribeDialog />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </nav>

        <div className="site-mobile-tools">
          <SearchDialog categories={categories} />
          <SubscribeDialog />
          <LanguageSwitcher />
          <ThemeToggle />
          <MobileNav sectionLinks={sectionLinks} />
        </div>
      </div>
    </header>
  );
}
