import { groq } from 'next-sanity';
import { client } from './client';
import type {
  CategoryDoc,
  ProjectDoc,
  BlogListItem,
  BlogFull,
  LogDoc,
  CollectionDoc,
  FriendDoc,
  HomeEntryGroup,
  ProfileDoc,
  SubscriptionOption,
  SpecialCategorySection,
} from './types';

function localizedString(field: string) {
  return groq`coalesce(select($locale == "de" => ${field}De, $locale == "en" => ${field}En), ${field})`;
}

function localizedBlocks(field: string) {
  return groq`coalesce(select($locale == "de" => ${field}De, $locale == "en" => ${field}En), ${field})`;
}

const localizedBlogLanguage = groq`select(
  $locale == "de" && (defined(titleDe) || defined(excerptDe) || defined(bodyDe)) => "de",
  $locale == "en" && (defined(titleEn) || defined(excerptEn) || defined(bodyEn)) => "en",
  language
)`;

const categoryProjection = groq`{
  _id,
  "title": ${localizedString('title')},
  "slug": slug.current,
  "intro": ${localizedString('intro')},
  "description": ${localizedString('description')},
  order,
  icon
}`;

export async function getAllCategories(locale = 'zh'): Promise<CategoryDoc[]> {
  return client.fetch(groq`*[_type == "category"] | order(order) ${categoryProjection}`, { locale });
}

export async function getSpecialBlogsByCategory(locale = 'zh'): Promise<SpecialCategorySection[]> {
  return client.fetch(groq`
    *[_type == "category"] | order(order) {
      _id,
      "title": ${localizedString('title')},
      "slug": slug.current,
      "intro": ${localizedString('intro')},
      "description": ${localizedString('description')},
      order,
      icon,
      "specialPosts": *[
        _type == "blog" &&
        "special" in tags[] &&
        (
          category._ref == ^._id ||
          project->category._ref == ^._id
        )
      ] | order(publishedAt desc)[0...6] {
        _id,
        "title": ${localizedString('title')},
        "slug": slug.current,
        "language": ${localizedBlogLanguage},
        theme,
        "excerpt": ${localizedString('excerpt')},
        publishedAt,
        tags,
        "project": project->{"title": ${localizedString('title')}, "slug": slug.current},
        "category": coalesce(
          category->{"title": ${localizedString('title')}, "slug": slug.current},
          project->category->{"title": ${localizedString('title')}, "slug": slug.current}
        ),
        "collection": collection->{"title": ${localizedString('title')}, "slug": slug.current}
      }
    }[count(specialPosts) > 0]
  `, { locale });
}

export async function getCategoryBySlug(slug: string, locale = 'zh'): Promise<CategoryDoc | null> {
  return client.fetch(
    groq`*[_type == "category" && slug.current == $slug][0] ${categoryProjection}`,
    { slug, locale }
  );
}

const projectProjection = groq`{
  _id,
  "title": ${localizedString('title')},
  "slug": slug.current,
  "intro": ${localizedString('intro')},
  "description": ${localizedString('description')},
  order,
  "category": category->{"title": ${localizedString('title')}, "slug": slug.current}
}`;

export async function getProjectsByCategory(categorySlug: string, locale = 'zh'): Promise<ProjectDoc[]> {
  return client.fetch(
    groq`*[_type == "project" && category->slug.current == $categorySlug] | order(order) ${projectProjection}`,
    { categorySlug, locale }
  );
}

export async function getProjectBySlug(slug: string, locale = 'zh'): Promise<ProjectDoc | null> {
  return client.fetch(
    groq`*[_type == "project" && slug.current == $slug][0] ${projectProjection}`,
    { slug, locale }
  );
}

const blogListProjection = groq`{
  _id,
  "title": ${localizedString('title')},
  "slug": slug.current,
  "language": ${localizedBlogLanguage},
  theme,
  "excerpt": ${localizedString('excerpt')},
  publishedAt,
  tags,
  "project": project->{"title": ${localizedString('title')}, "slug": slug.current},
  "category": coalesce(
    category->{"title": ${localizedString('title')}, "slug": slug.current},
    project->category->{"title": ${localizedString('title')}, "slug": slug.current}
  ),
  "collection": collection->{"title": ${localizedString('title')}, "slug": slug.current}
}`;

export async function getBlogPostsByProject(projectSlug: string, locale = 'zh'): Promise<BlogListItem[]> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && (!defined(collection) || collection == null)]
       | order(publishedAt desc) ${blogListProjection}`,
    { projectSlug, locale }
  );
}

export async function getBlogPostsByCollection(
  projectSlug: string,
  collectionSlug: string,
  locale = 'zh'
): Promise<BlogListItem[]> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && collection->slug.current == $collectionSlug]
       | order(publishedAt desc) ${blogListProjection}`,
    { projectSlug, collectionSlug, locale }
  );
}

export async function getDirectBlogPostsByCategory(categorySlug: string, locale = 'zh'): Promise<BlogListItem[]> {
  return client.fetch(
    groq`*[_type == "blog" && category->slug.current == $categorySlug
       && (!defined(project) || project == null)]
       | order(publishedAt desc) ${blogListProjection}`,
    { categorySlug, locale }
  );
}

const localizedBody = localizedBlocks('body');
const blogFullProjection = groq`{
  _id,
  "title": ${localizedString('title')},
  "slug": slug.current,
  "language": ${localizedBlogLanguage},
  theme,
  "body": ${localizedBody},
  "bodyText": pt::text(${localizedBody}),
  "excerpt": ${localizedString('excerpt')},
  publishedAt,
  updatedAt,
  tags,
  "project": project->{"title": ${localizedString('title')}, "slug": slug.current},
  "category": coalesce(
    category->{"title": ${localizedString('title')}, "slug": slug.current},
    project->category->{"title": ${localizedString('title')}, "slug": slug.current}
  ),
  "collection": collection->{"title": ${localizedString('title')}, "slug": slug.current}
}`;

export async function getBlogPost(
  projectSlug: string,
  blogSlug: string,
  locale = 'zh'
): Promise<BlogFull | null> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && slug.current == $blogSlug
       && (!defined(collection) || collection == null)][0] ${blogFullProjection}`,
    { projectSlug, blogSlug, locale }
  );
}

export async function getDirectBlogPostByCategory(
  categorySlug: string,
  blogSlug: string,
  locale = 'zh'
): Promise<BlogFull | null> {
  return client.fetch(
    groq`*[_type == "blog" && category->slug.current == $categorySlug
       && slug.current == $blogSlug
       && (!defined(project) || project == null)][0] ${blogFullProjection}`,
    { categorySlug, blogSlug, locale }
  );
}

export async function getBlogPostWithCollection(
  projectSlug: string,
  collectionSlug: string,
  blogSlug: string,
  locale = 'zh'
): Promise<BlogFull | null> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && collection->slug.current == $collectionSlug
       && slug.current == $blogSlug][0] ${blogFullProjection}`,
    { projectSlug, collectionSlug, blogSlug, locale }
  );
}

const logFields = groq`{
  _id,
  date,
  title,
  "slug": slug.current,
  description,
  body,
  category
}`;

export async function getAllLogs(): Promise<LogDoc[]> {
  return client.fetch(groq`*[_type == "log"] | order(date desc) ${logFields}`);
}

export async function getLogBySlug(slug: string): Promise<LogDoc | null> {
  return client.fetch(
    groq`*[_type == "log" && slug.current == $slug][0] ${logFields}`,
    { slug }
  );
}

export async function getFriends(): Promise<FriendDoc[]> {
  return client.fetch(groq`*[_type == "friend"] | order(order) {
    _id, name, url, avatar, description, order
  }`);
}

export async function getProfile(): Promise<ProfileDoc | null> {
  return client.fetch(groq`*[_id == "site-profile"][0] {
    _id, name, avatar, bio, socialLinks
  }`);
}

export interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  project?: { title: string; slug: string };
  category: { title: string; slug: string };
}

export async function searchBlogs(
  query: string,
  categorySlug?: string,
  locale = 'zh',
): Promise<SearchResult[]> {
  const localizedTitle = localizedString('title');
  const localizedExcerpt = localizedString('excerpt');
  const localizedSearchBody = localizedBlocks('body');
  const filter = categorySlug
    ? groq`*[_type == "blog" && (
      category->slug.current == $categorySlug ||
      project->category->slug.current == $categorySlug
    ) && (
      ${localizedTitle} match $q ||
      ${localizedExcerpt} match $q ||
      pt::text(${localizedSearchBody}) match $q
    )] | order(publishedAt desc) [0...10]`
    : groq`*[_type == "blog" && (
      ${localizedTitle} match $q ||
      ${localizedExcerpt} match $q ||
      pt::text(${localizedSearchBody}) match $q
    )] | order(publishedAt desc) [0...10]`;

  const params: Record<string, string> = { q: query, locale };
  if (categorySlug) params.categorySlug = categorySlug;

  return client.fetch(
    groq`${filter} {
      _id,
      "title": ${localizedString('title')},
      "slug": slug.current,
      "excerpt": ${localizedString('excerpt')},
      publishedAt,
      "project": project->{"title": ${localizedString('title')}, "slug": slug.current},
      "category": coalesce(
        category->{"title": ${localizedString('title')}, "slug": slug.current},
        project->category->{"title": ${localizedString('title')}, "slug": slug.current}
      )
    }`,
    params
  );
}

export async function getCollectionsByProject(projectSlug: string, locale = 'zh'): Promise<CollectionDoc[]> {
  return client.fetch(
    groq`*[_type == "collection" && project->slug.current == $projectSlug] | order(order) {
      _id,
      "title": ${localizedString('title')},
      "slug": slug.current,
      "intro": ${localizedString('intro')},
      "description": ${localizedString('description')},
      "postCount": count(*[_type == "blog" && references(^._id)])
    }`,
    { projectSlug, locale }
  );
}

export async function getHomeEntryGroups(locale = 'zh'): Promise<HomeEntryGroup[]> {
  return client.fetch(groq`
    *[_type == "category"] | order(order) {
      _id,
      "title": ${localizedString('title')},
      "slug": slug.current,
      "intro": ${localizedString('intro')},
      "description": ${localizedString('description')},
      order,
      icon,
      "projects": *[_type == "project" && category._ref == ^._id] | order(order) {
        _id,
        "title": ${localizedString('title')},
        "slug": slug.current,
        "intro": ${localizedString('intro')},
        "description": ${localizedString('description')},
        "collections": *[_type == "collection" && project._ref == ^._id] | order(order) {
          _id,
          "title": ${localizedString('title')},
          "slug": slug.current,
          "intro": ${localizedString('intro')},
          "description": ${localizedString('description')},
          "postCount": count(*[_type == "blog" && references(^._id)])
        }
      }
    }
  `, { locale });
}

export async function getSubscriptionOptions(locale = 'zh'): Promise<SubscriptionOption[]> {
  const categories = await client.fetch(
    groq`*[_type == "category"] | order(order) {
      "type": "category",
      "slug": slug.current,
      "title": ${localizedString('title')},
      "intro": coalesce(${localizedString('intro')}, ${localizedString('description')})
    }`,
    { locale }
  );
  const projects = await client.fetch(
    groq`*[_type == "project"] | order(order) {
      "type": "project",
      "slug": slug.current,
      "title": ${localizedString('title')},
      "intro": coalesce(${localizedString('intro')}, ${localizedString('description')}),
      "parentSlug": category->slug.current
    }`,
    { locale }
  );
  const collections = await client.fetch(
    groq`*[_type == "collection"] | order(order) {
      "type": "collection",
      "slug": slug.current,
      "title": ${localizedString('title')},
      "intro": coalesce(${localizedString('intro')}, ${localizedString('description')}),
      "parentSlug": project->slug.current
    }`,
    { locale }
  );
  return [...categories, ...projects, ...collections] as SubscriptionOption[];
}
