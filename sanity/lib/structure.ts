import { ControlsIcon, DocumentsIcon, FolderIcon, HomeIcon } from '@sanity/icons';
import type { StructureResolver } from 'sanity/structure';
import { ContentTreePane } from '../components/navigation/ContentTreePane';
import { TaxonomyManagerPane } from '../components/navigation/TaxonomyManagerPane';

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
        .id('taxonomy-manager')
        .title('分类管理')
        .icon(ControlsIcon)
        .child(
          S.component()
            .id('taxonomy-manager-pane')
            .title('分类管理')
            .component(TaxonomyManagerPane)
            .child((documentId, { params }) => {
              const documentType = params.documentType || 'category';

              return S.document()
                .id(`${documentType}-${documentId}`)
                .documentId(documentId)
                .schemaType(documentType);
            }),
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
