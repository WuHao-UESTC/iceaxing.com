import { getHomePayload } from '@/lib/sanity/queries';
import { getLocale } from 'next-intl/server';
import { HomeDashboard, type HomeLabels } from './home-dashboard';

function getHomeLabels(locale: string): HomeLabels {
  if (locale === 'en') {
    return {
      dateLocale: 'en-US',
      viewAll: 'View all',
      refresh: 'Shuffle',
      noPosts: 'No posts to show yet.',
      featured: 'Selected Notes',
      postsOnDate: 'Written on',
      calendar: 'Blog Calendar',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      weekDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      entryKinds: {
        log: 'Log',
        about: 'About',
        friends: 'Friends',
        profile: 'Profile',
      },
      skills: 'Technical Stack',
      ongoingProjects: 'In Progress',
      completedProjects: 'Finished Works',
      ramblings: 'Daily Ramblings',
      ramblingsTitleMode: 'rotated',
      life: 'Life',
      lifeRecent: 'Lately,\nhow is life',
      project: 'Project',
      progress: 'Progress',
      route: 'Altitude route',
      dispatch: 'Expedition dispatch',
      nextCamp: 'Continue the ascent',
      fieldNotes: 'Field notes',
      chapterNames: ['Base Camp', 'Technical Ridge', 'Snowfield Traverse', 'Night Camp'],
    };
  }

  if (locale === 'de') {
    return {
      dateLocale: 'de-DE',
      viewAll: 'Alle ansehen',
      refresh: 'Neu mischen',
      noPosts: 'Noch keine Beiträge zum Anzeigen.',
      featured: 'Ausgewählte Notizen',
      postsOnDate: 'Geschrieben am',
      calendar: 'Blogkalender',
      previousMonth: 'Vorheriger Monat',
      nextMonth: 'Nächster Monat',
      weekDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      entryKinds: {
        log: 'Log',
        about: 'Über',
        friends: 'Links',
        profile: 'Profil',
      },
      skills: 'Technischer Stack',
      ongoingProjects: 'Laufende Projekte',
      completedProjects: 'Abgeschlossene Arbeiten',
      ramblings: 'Lose Gedanken',
      ramblingsTitleMode: 'rotated',
      life: 'Leben',
      lifeRecent: 'In letzter Zeit,\nwie geht es',
      project: 'Projekt',
      progress: 'Fortschritt',
      route: 'Höhenroute',
      dispatch: 'Expeditionsbericht',
      nextCamp: 'Weiter aufsteigen',
      fieldNotes: 'Feldnotizen',
      chapterNames: ['Basislager', 'Technischer Grat', 'Schneefeld', 'Nachtlager'],
    };
  }

  return {
    dateLocale: 'zh-CN',
    viewAll: '查看所有',
    refresh: '换一组',
    noPosts: '暂无可展示文章。',
    featured: '拾光选章',
    postsOnDate: '这一天写下',
    calendar: '博客日历',
    previousMonth: '上个月',
    nextMonth: '下个月',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    entryKinds: {
      log: '日志',
      about: '关于',
      friends: '友链',
      profile: '简介',
    },
    skills: '技术栈',
    ongoingProjects: '仍在推进',
    completedProjects: '已经抵达',
    ramblings: '碎碎念',
    ramblingsTitleMode: 'vertical',
    life: '生活切片',
    lifeRecent: '最近，\n过得咋样',
    project: '项目',
    progress: '进度',
    route: '海拔路线',
    dispatch: '营地手记',
    nextCamp: '继续向上',
    fieldNotes: '野外笔记',
    chapterNames: ['山脚营地', '技术冰脊', '雪原横渡', '高山夜营'],
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
    />
  );
}
