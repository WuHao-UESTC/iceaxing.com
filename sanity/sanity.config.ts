// sanity/sanity.config.ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { schemaTypes } from './schema';
import { deskStructure } from './lib/structure';
import { blogTemplates } from './templates/blog-templates';
import { projectTemplates } from './templates/project-templates';
import { TranslationInspector } from './components/translation/TranslationInspector';
import { translationBadgesPlugin } from './components/translation/TranslationBadgePlugin';
import { WritingAssistantInspector } from './components/writing-assistant/WritingAssistantInspector';
import { blogActionsPlugin } from './components/document-actions/BlogActionsPlugin';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'fa79h3qq';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://iceaxing.com');

export default defineConfig({
  name: 'iceaxing-blog',
  title: 'iceaxing Blog',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    presentationTool({
      previewUrl: {
        origin: baseUrl,
        draftMode: {
          enable: '/api/draft',
        },
      },
      resolve: {
        locations: {
          blog: {
            select: {
              title: 'title',
              slug: 'slug.current',
              catSlug: 'category->slug.current',
              projSlug: 'project->slug.current',
            },
            resolve: (doc) => {
              if (!doc?.slug || !doc?.catSlug || !doc?.projSlug) return null;
              return {
                locations: [
                  {
                    title: doc.title || doc.slug,
                    href: `/zh/${doc.catSlug}/${doc.projSlug}/${doc.slug}`,
                  },
                ],
              };
            },
          },
          category: {
            select: { title: 'title', slug: 'slug.current' },
            resolve: (doc) => {
              if (!doc?.slug) return null;
              return {
                locations: [
                  { title: doc.title || doc.slug, href: `/zh/${doc.slug}` },
                ],
              };
            },
          },
          project: {
            select: {
              title: 'title',
              slug: 'slug.current',
              catSlug: 'category->slug.current',
            },
            resolve: (doc) => {
              if (!doc?.slug || !doc?.catSlug) return null;
              return {
                locations: [
                  {
                    title: doc.title || doc.slug,
                    href: `/zh/${doc.catSlug}/${doc.slug}`,
                  },
                ],
              };
            },
          },
          about: {
            select: {},
            resolve: () => ({
              locations: [{ title: '关于', href: '/zh/about' }],
            }),
          },
          profile: {
            select: {},
            resolve: () => ({
              locations: [{ title: '个人简介', href: '/zh/profile' }],
            }),
          },
          friend: {
            select: {},
            resolve: () => ({
              locations: [{ title: '友情链接', href: '/zh/friends' }],
            }),
          },
          log: {
            select: {},
            resolve: () => ({
              locations: [{ title: '站点日志', href: '/zh/logs' }],
            }),
          },
          siteSettings: {
            select: {},
            resolve: () => ({
              locations: [{ title: '首页', href: '/zh' }],
            }),
          },
        },
      },
    }),
    translationBadgesPlugin(),
    blogActionsPlugin(),
  ],
  schema: {
    types: schemaTypes,
    templates: [...blogTemplates, ...projectTemplates],
  },
  document: {
    inspectors: [TranslationInspector as never, WritingAssistantInspector as never],
  },
});
