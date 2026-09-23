import { AddDocumentIcon, DocumentsIcon, FolderIcon, HomeIcon } from '@sanity/icons';
import type { StructureResolver } from 'sanity/structure';
import { ContentTreePane } from '../components/navigation/ContentTreePane';

export const deskStructure: StructureResolver = (S) => {
  const pageItems = [
    ['siteSettings', '站点设置'],
    ['about', '关于'],
    ['profile', '个人简介'],
    ['friend', '友情链接'],
  ] as const;

  return S.list()
    .id('iceaxing-blog-root')
    .title('iceaxing Blog')
    .items([
      S.listItem()
        .id('content-tree')
        .title('内容目录')
        .icon(FolderIcon)
        .child(
          S.component()
            .id('content-tree-pane')
            .title('内容目录')
            .component(ContentTreePane)
            .child((documentId, { params }) => {
              const documentType = params.documentType || 'blog';

              return S.document()
                .id(`${documentType}-${documentId}`)
                .documentId(documentId)
                .schemaType(documentType);
            }),
        ),
      S.listItem()
        .id('create-content')
        .title('新建内容')
        .icon(AddDocumentIcon)
        .child(
          S.list()
            .id('create-content-list')
            .title('新建内容')
            .items([
              S.listItem()
                .id('new-blank-post')
                .title('空白文章')
                .child(
                  S.editor()
                    .id('new-blank-post-editor')
                    .schemaType('blog')
                    .initialValueTemplate('blog-blank'),
                ),
              S.listItem()
                .id('new-tutorial-post')
                .title('技术教程')
                .child(
                  S.editor()
                    .id('new-tutorial-post-editor')
                    .schemaType('blog')
                    .initialValueTemplate('blog-tech-tutorial'),
                ),
              S.listItem()
                .id('new-reading-post')
                .title('读书笔记')
                .child(
                  S.editor()
                    .id('new-reading-post-editor')
                    .schemaType('blog')
                    .initialValueTemplate('blog-reading-note'),
                ),
              S.listItem()
                .id('new-retrospective-post')
                .title('复盘总结')
                .child(
                  S.editor()
                    .id('new-retrospective-post-editor')
                    .schemaType('blog')
                    .initialValueTemplate('blog-retrospective'),
                ),
              S.divider(),
              S.listItem()
                .id('new-category')
                .title('分类')
                .child(S.editor().id('new-category-editor').schemaType('category')),
              S.listItem()
                .id('new-project')
                .title('项目')
                .child(S.editor().id('new-project-editor').schemaType('project')),
              S.listItem()
                .id('new-collection')
                .title('合集')
                .child(S.editor().id('new-collection-editor').schemaType('collection')),
            ]),
        ),
      S.listItem()
        .id('all-posts')
        .title('全部文章')
        .icon(DocumentsIcon)
        .child(
          S.documentList()
            .id('all-posts-list')
            .title('全部文章')
            .schemaType('blog')
            .filter('_type == "blog"')
            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
        ),
      S.divider(),
      S.listItem()
        .id('page-management')
        .title('页面管理')
        .icon(HomeIcon)
        .child(
          S.list()
            .id('page-management-list')
            .title('页面管理')
            .items(
              pageItems.map(([schemaType, title]) =>
                S.listItem()
                  .id(schemaType)
                  .title(title)
                  .child(
                    S.documentList()
                      .id(`${schemaType}-list`)
                      .title(title)
                      .schemaType(schemaType)
                      .filter(`_type == "${schemaType}"`),
                  ),
              ),
            ),
        ),
      S.listItem()
        .id('site-logs')
        .title('站点日志')
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
        .title('格言')
        .child(
          S.documentList()
            .id('mottos-list')
            .title('格言')
            .schemaType('motto')
            .filter('_type == "motto"'),
        ),
    ]);
};
