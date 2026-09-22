import { getHomePayload } from "@/lib/sanity/queries";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLocale } from "next-intl/server";
import { HomeDashboard, type HomeLabels } from "./home-dashboard";

function getHomeLabels(locale: string): HomeLabels {
  if (locale === "en") {
    return {
      heroTitle: ["Upward,", "and inward."],
      heroIntro: "Notes on technology, life, and everything along the way.",
      readNotes: "Read the notes",
      meetMe: "About me",
      dateLocale: "en-US",
      previousArticles: "Previous articles",
      nextArticles: "Next articles",
      previousChapter: "Previous chapter",
      nextChapter: "Next chapter",
      backToTop: "Back to base camp",
      moreCategories: "More categories",
      viewAll: "View all",
      refresh: "Shuffle",
      noPosts: "No posts to show yet.",
      featured: "Selected Notes",
      entryKinds: {
        log: "Log",
        about: "About",
        friends: "Friends",
        profile: "Profile",
      },
      skills: "Technical Stack",
      ongoingProjects: "In Progress",
      completedProjects: "Finished Works",
      ramblings: "Daily Ramblings",
      ramblingsTitleMode: "rotated",
      life: "Life",
      lifeRecent: "Lately,\\nhow is life",
      project: "Project",
      progress: "Progress",
      route: "Altitude route",
      dispatch: "Expedition dispatch",
      nextCamp: "Continue the ascent",
      fieldNotes: "Field notes",
      chapterNames: [
        "Base Camp",
        "Technical Ridge",
        "Snowfield Traverse",
        "Night Camp",
      ],
    };
  }

  if (locale === "de") {
    return {
      heroTitle: ["Hinauf.", "Und zu mir."],
      heroIntro: "Gedanken über Technik, das Leben und alles auf dem Weg.",
      readNotes: "Notizen lesen",
      meetMe: "Über mich",
      dateLocale: "de-DE",
      previousArticles: "Vorherige Beiträge",
      nextArticles: "Nächste Beiträge",
      previousChapter: "Vorheriges Kapitel",
      nextChapter: "Nächstes Kapitel",
      backToTop: "Zurück zum Basislager",
      moreCategories: "Weitere Kategorien",
      viewAll: "Alle ansehen",
      refresh: "Neu mischen",
      noPosts: "Noch keine Beitrage zum Anzeigen.",
      featured: "Ausgewahlte Notizen",
      entryKinds: {
        log: "Log",
        about: "Uber",
        friends: "Links",
        profile: "Profil",
      },
      skills: "Technischer Stack",
      ongoingProjects: "Laufende Projekte",
      completedProjects: "Abgeschlossene Arbeiten",
      ramblings: "Lose Gedanken",
      ramblingsTitleMode: "rotated",
      life: "Leben",
      lifeRecent: "In letzter Zeit,\\nwie geht es",
      project: "Projekt",
      progress: "Fortschritt",
      route: "Hohenroute",
      dispatch: "Expeditionsbericht",
      nextCamp: "Weiter aufsteigen",
      fieldNotes: "Feldnotizen",
      chapterNames: [
        "Basislager",
        "Technischer Grat",
        "Schneefeld",
        "Nachtlager",
      ],
    };
  }

  return {
    heroTitle: ["向上，", "也向内。"],
    heroIntro: "记录技术、生活与沿途所见。",
    readNotes: "阅读精选",
    meetMe: "认识我",
    dateLocale: "zh-CN",
    previousArticles: "上一篇精选",
    nextArticles: "下一篇精选",
    previousChapter: "上一章节",
    nextChapter: "下一章节",
    backToTop: "回到山脚",
    moreCategories: "更多分类",
    viewAll: "查看全部",
    refresh: "换一组",
    noPosts: "暂无可展示文章。",
    featured: "精选文章",
    entryKinds: {
      log: "日志",
      about: "关于",
      friends: "友链",
      profile: "简介",
    },
    skills: "技术栈",
    ongoingProjects: "仍在推进",
    completedProjects: "已经抵达",
    ramblings: "碎碎念",
    ramblingsTitleMode: "vertical",
    life: "生活切片",
    lifeRecent: "最近，\\n过得怎样",
    project: "项目",
    progress: "进度",
    route: "海拔路线",
    dispatch: "营地手记",
    nextCamp: "继续向上",
    fieldNotes: "野外笔记",
    chapterNames: ["山脚营地", "技术冰脊", "雪原横渡", "高山夜营"],
  };
}

export async function StaticHomePage() {
  const locale = await getLocale();
  const payload = await getHomePayload(locale);

  return (
    <HomeDashboard
      payload={payload}
      motto={payload.mottos[0]}
      labels={getHomeLabels(locale)}
      footer={<SiteFooter />}
    />
  );
}
