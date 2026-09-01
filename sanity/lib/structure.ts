import type { StructureResolver } from 'sanity/structure';
import { AddDocumentIcon } from '@sanity/icons';

interface CatRef {
  _id: string;
  title: string;
  slug: { current: string };
}

interface ProjRef {
  _id: string;
  title: string;
  slug: { current: string };
}

interface ColRef {
  _id: string;
  title: string;
  slug: { current: string };
}

function newPostTemplateItems(
  scope: string,
  S: ReturnType<StructureResolver> extends Promise<infer T> ? never : Parameters<StructureResolver>[0],
  refs?: { project?: string; category?: string; collection?: string },
) {
  const params = {
    project: refs?.project,
    category: refs?.category,
    collection: refs?.collection,
  };
  return [
    S.listItem()
      .id(`${scope}-new-blank`)
      .title('空白文章')
      .icon(AddDocumentIcon)
      .child(
        S.editor()
          .id(`${scope}-new-blank-editor`)
          .schemaType('blog')
          .initialValueTemplate('blog-blank', params),
      ),
    S.listItem()
      .id(`${scope}-new-tutorial`)
      .title('技术教程')
      .icon(AddDocumentIcon)
      .child(
        S.editor()
          .id(`${scope}-new-tutorial-editor`)
          .schemaType('blog')
          .initialValueTemplate('blog-tech-tutorial', params),
      ),
    S.listItem()
      .id(`${scope}-new-reading`)
      .title('读书笔记')
      .icon(AddDocumentIcon)
      .child(
        S.editor()
          .id(`${scope}-new-reading-editor`)
          .schemaType('blog')
          .initialValueTemplate('blog-reading-note', params),
      ),
    S.listItem()
      .id(`${scope}-new-retro`)
      .title('复盘总结')
      .icon(AddDocumentIcon)
      .child(
        S.editor()
          .id(`${scope}-new-retro-editor`)
          .schemaType('blog')
          .initialValueTemplate('blog-retrospective', params),
      ),
  ];
}

export const deskStructure: StructureResolver = async (S, context) => {
  const client = context.getClient({ apiVersion: '2024-01-01' });

  const categories = await client.fetch<CatRef[]>(
    `*[_type == "category"] | order(title asc) { _id, title, slug }`,
  );

  const categoryItems = categories.map((cat: CatRef) => {
    return S.listItem()
      .id(cat.slug.current)
      .title(cat.title)
      .child(async () => {
        const projects = await client.fetch<ProjRef[]>(
          `*[_type == "project" && category._ref == $catId] | order(title asc) { _id, title, slug }`,
          { catId: cat._id },
        );

        const projectItems = projects.map((proj: ProjRef) =>
          S.listItem()
            .id(proj.slug.current)
            .title(`📂 ${proj.title}`)
            .child(async () => {
              const collections = await client.fetch<ColRef[]>(
                `*[_type == "collection" && project._ref == $projId] | order(title asc) { _id, title, slug }`,
                { projId: proj._id },
              );

              const colItems = collections.map((col: ColRef) =>
                S.listItem()
                  .id(col.slug.current)
                  .title(`📂 ${col.title}`)
                  .child(
                    S.documentList()
                      .id(`${col.slug.current}-posts-list`)
                      .title(`${col.title} · 文章`)
                      .schemaType('blog')
                      .filter(
                        '_type == "blog" && collection._ref == $colId',
                      )
                      .params({ colId: col._id })
                      .defaultOrdering([
                        { field: 'publishedAt', direction: 'desc' },
                      ]),
                  ),
              );

              const hasCollections = colItems.length > 0;

              return S.list()
                .id(`${proj.slug.current}-panel`)
                .title(proj.title)
                .items([
                  ...(hasCollections
                    ? [
                        ...colItems,
                        S.listItem()
                          .id(`${proj.slug.current}-new-collection`)
                          .title('➕ 新建合集')
                          .icon(AddDocumentIcon)
                          .child(
                            S.editor()
                              .id(`${proj.slug.current}-new-collection-editor`)
                              .schemaType('collection'),
                          ),
                      ]
                    : []),
                  S.listItem()
                    .id(`${proj.slug.current}-orphan-posts`)
                    .title('📄 独立文章')
                    .child(
                      S.documentList()
                        .id(`${proj.slug.current}-orphan-posts-list`)
                        .title(`${proj.title} · 独立文章`)
                        .schemaType('blog')
                        .filter(
                          '_type == "blog" && project._ref == $projId && !defined(collection)',
                        )
                        .params({ projId: proj._id })
                        .defaultOrdering([
                          { field: 'publishedAt', direction: 'desc' },
                        ]),
                    ),
                  S.divider(),
                  S.listItem()
                    .id(`${proj.slug.current}-new-post`)
                    .title('➕ 新建文章')
                    .child(
                      S.list()
                        .id(`${proj.slug.current}-new-post-templates`)
                        .title('选择模板')
                        .items(
                          newPostTemplateItems(
                            proj.slug.current,
                            S,
                            { project: proj._id, category: cat._id },
                          ),
                        ),
                    ),
                  ...(!hasCollections
                    ? [
                        S.divider(),
                        S.listItem()
                          .id(`${proj.slug.current}-new-collection`)
                          .title('➕ 新建合集')
                          .icon(AddDocumentIcon)
                          .child(
                            S.editor()
                              .id(`${proj.slug.current}-new-collection-editor`)
                              .schemaType('collection'),
                          ),
                      ]
                    : []),
                ]);
            }),
        );

        return S.list()
          .id(`${cat.slug.current}-panel`)
          .title(cat.title)
          .items([
            ...projectItems,
            S.listItem()
              .id(`${cat.slug.current}-direct-posts`)
              .title('📄 独立文章')
              .child(
                S.documentList()
                  .id(`${cat.slug.current}-direct-posts-list`)
                  .title('独立文章')
                  .schemaType('blog')
                  .filter(
                    '_type == "blog" && category._ref == $catId && !defined(project)',
                  )
                  .params({ catId: cat._id })
                  .defaultOrdering([
                    { field: 'publishedAt', direction: 'desc' },
                  ]),
              ),
            S.divider(),
            S.listItem()
              .id(`${cat.slug.current}-new-project`)
              .title('➕ 新建项目')
              .icon(AddDocumentIcon)
              .child(
                S.editor()
                  .id(`${cat.slug.current}-new-project-editor`)
                  .schemaType('project')
                  .initialValueTemplate('project-blank', { category: cat._id }),
              ),
            S.listItem()
              .id(`${cat.slug.current}-new-direct-post`)
              .title('➕ 新建独立文章')
              .child(
                S.list()
                  .id(`${cat.slug.current}-new-direct-post-templates`)
                  .title('选择模板')
                  .items(
                    newPostTemplateItems(
                      `${cat.slug.current}-direct`,
                      S,
                    ),
                  ),
              ),
          ]);
      });
  });

  const pageItems = [
    S.listItem()
      .id('site-settings')
      .title('站点设置')
      .child(
        S.documentList()
          .id('site-settings-list')
          .title('站点设置')
          .schemaType('siteSettings')
          .filter('_type == "siteSettings"'),
      ),
    S.listItem()
      .id('about')
      .title('关于')
      .child(
        S.documentList()
          .id('about-list')
          .title('关于')
          .schemaType('about')
          .filter('_type == "about"'),
      ),
    S.listItem()
      .id('profile')
      .title('个人简介')
      .child(
        S.documentList()
          .id('profile-list')
          .title('个人简介')
          .schemaType('profile')
          .filter('_type == "profile"'),
      ),
    S.listItem()
      .id('friends')
      .title('友情链接')
      .child(
        S.documentList()
          .id('friends-list')
          .title('友情链接')
          .schemaType('friend')
          .filter('_type == "friend"'),
      ),
  ];

  return S.list()
    .id('iceaxing-blog-root')
    .title('iceaxing Blog')
    .items([
      S.listItem()
        .id('content-management')
        .title('📁 内容管理')
        .child(
          S.list()
            .id('content-management-panel')
            .title('内容管理')
            .items([
              ...categoryItems,
              S.divider(),
              S.listItem()
                .id('new-category')
                .title('➕ 新建分类')
                .icon(AddDocumentIcon)
                .child(
                  S.editor()
                    .id('new-category-editor')
                    .schemaType('category'),
                ),
              S.divider(),
              S.listItem()
                .id('all-posts')
                .title('📄 全部文章')
                .child(
                  S.documentList()
                    .id('all-posts-list')
                    .title('全部文章')
                    .schemaType('blog')
                    .filter('_type == "blog"')
                    .defaultOrdering([
                      { field: 'publishedAt', direction: 'desc' },
                    ]),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .id('page-management')
        .title('🏠 页面管理')
        .child(
          S.list()
            .id('page-management-panel')
            .title('页面管理')
            .items(pageItems),
        ),
      S.divider(),
      S.listItem()
        .id('site-logs')
        .title('📋 站点日志')
        .child(
          S.documentList()
            .id('site-logs-list')
            .title('站点日志')
            .schemaType('log')
            .filter('_type == "log"')
            .defaultOrdering([{ field: 'date', direction: 'desc' }]),
        ),
      S.listItem()
        .id('mottos')
        .title('📝 格言')
        .child(
          S.documentList()
            .id('mottos-list')
            .title('格言')
            .schemaType('motto')
            .filter('_type == "motto"'),
        ),
    ]);
};
