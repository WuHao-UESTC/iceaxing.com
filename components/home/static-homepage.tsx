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
      entryKinds: { log: 'Log', about: 'About', friends: 'Friends', profile: 'Profile' },
      skills: 'Technical Stack',
      ongoingProjects: 'In Progress',
      completedProjects: 'Finished Works',
      ramblings: 'Daily Ramblings',
      ramblingsTitleMode: 'rotated',
      life: 'Life',
      lifeRecent: 'Lately,\\nhow is life',
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
      noPosts: 'Noch keine Beitrage zum Anzeigen.',
      featured: 'Ausgewahlte Notizen',
      entryKinds: { log: 'Log', about: 'Uber', friends: 'Links', profile: 'Profil' },
      skills: 'Technischer Stack',
      ongoingProjects: 'Laufende Projekte',
      completedProjects: 'Abgeschlossene Arbeiten',
      ramblings: 'Lose Gedanken',
      ramblingsTitleMode: 'rotated',
      life: 'Leben',
      lifeRecent: 'In letzter Zeit,\\nwie geht es',
      project: 'Projekt',
      progress: 'Fortschritt',
      route: 'Hohenroute',
      dispatch: 'Expeditionsbericht',
      nextCamp: 'Weiter aufsteigen',
      fieldNotes: 'Feldnotizen',
      chapterNames: ['Basislager', 'Technischer Grat', 'Schneefeld', 'Nachtlager'],
    };
  }

  return {
    dateLocale: 'zh-CN',
    viewAll: '查看全部',
    refresh: '换一组',
    noPosts: '暂无可展示文章。',
    featured: '精选文章',
    entryKinds: { log: '日志', about: '关于', friends: '友链', profile: '简介' },
    skills: '技术栈',
    ongoingProjects: '仍在推进',
    completedProjects: '已经抵达',
    ramblings: '碎碎念',
    ramblingsTitleMode: 'vertical',
    life: '生活切片',
    lifeRecent: '最近，\\n过得怎样',
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

  return <HomeDashboard payload={payload} motto={payload.mottos[0]} labels={getHomeLabels(locale)} />;
}
