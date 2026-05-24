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
  ProfileDoc,
} from './types';

// ═══ Category ═══

const categoryFields = groq`{
  _id,
  title,
  "slug": slug.current,
  description,
  order,
  icon
}`;

export async function getAllCategories(): Promise<CategoryDoc[]> {
  return client.fetch(groq`*[_type == "category"] | order(order) ${categoryFields}`);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDoc | null> {
  return client.fetch(
    groq`*[_type == "category" && slug.current == $slug][0] ${categoryFields}`,
    { slug }
  );
}

// ═══ Project ═══

const projectFields = groq`{
  _id,
  title,
  "slug": slug.current,
  description,
  order,
  "category": category->{title, "slug": slug.current}
}`;

export async function getProjectsByCategory(categorySlug: string): Promise<ProjectDoc[]> {
  return client.fetch(
    groq`*[_type == "project" && category->slug.current == $categorySlug] | order(order) ${projectFields}`,
    { categorySlug }
  );
}

export async function getProjectBySlug(slug: string): Promise<ProjectDoc | null> {
  return client.fetch(
    groq`*[_type == "project" && slug.current == $slug][0] ${projectFields}`,
    { slug }
  );
}

// ═══ Blog ═══

const blogListFields = groq`{
  _id,
  title,
  "slug": slug.current,
  language,
  theme,
  excerpt,
  publishedAt,
  tags
}`;

export async function getBlogPostsByProject(projectSlug: string): Promise<BlogListItem[]> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && (!defined(collection) || collection == null)]
       | order(publishedAt desc) ${blogListFields}`,
    { projectSlug }
  );
}

export async function getBlogPostsByCollection(
  projectSlug: string,
  collectionSlug: string
): Promise<BlogListItem[]> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && collection->slug.current == $collectionSlug]
       | order(publishedAt desc) ${blogListFields}`,
    { projectSlug, collectionSlug }
  );
}

const blogFullFields = groq`{
  _id,
  title,
  "slug": slug.current,
  language,
  theme,
  body,
  excerpt,
  publishedAt,
  updatedAt,
  tags,
  "project": project->{title, "slug": slug.current},
  "category": project->category->{title, "slug": slug.current},
  "collection": collection->{title, "slug": slug.current}
}`;

export async function getBlogPost(
  projectSlug: string,
  blogSlug: string
): Promise<BlogFull | null> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && slug.current == $blogSlug
       && (!defined(collection) || collection == null)][0] ${blogFullFields}`,
    { projectSlug, blogSlug }
  );
}

export async function getBlogPostWithCollection(
  projectSlug: string,
  collectionSlug: string,
  blogSlug: string
): Promise<BlogFull | null> {
  return client.fetch(
    groq`*[_type == "blog" && project->slug.current == $projectSlug
       && collection->slug.current == $collectionSlug
       && slug.current == $blogSlug][0] ${blogFullFields}`,
    { projectSlug, collectionSlug, blogSlug }
  );
}

// ═══ Log ═══

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
  return client.fetch(
    groq`*[_type == "log"] | order(date desc) ${logFields}`
  );
}

export async function getLogBySlug(slug: string): Promise<LogDoc | null> {
  return client.fetch(
    groq`*[_type == "log" && slug.current == $slug][0] ${logFields}`,
    { slug }
  );
}

// ═══ Friend ═══

export async function getFriends(): Promise<FriendDoc[]> {
  return client.fetch(groq`*[_type == "friend"] | order(order) {
    _id, name, url, avatar, description, order
  }`);
}

// ═══ Profile ═══

export async function getProfile(): Promise<ProfileDoc | null> {
  return client.fetch(groq`*[_id == "site-profile"][0] {
    _id, name, avatar, bio, socialLinks
  }`);
}

// ═══ Search ═══

export interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  project: { title: string; slug: string };
  category: { title: string; slug: string };
}

export async function searchBlogs(
  query: string,
  categorySlug?: string,
): Promise<SearchResult[]> {
  const filter = categorySlug
    ? groq`*[_type == "blog" && project->category->slug.current == $categorySlug && (
      title match $q ||
      excerpt match $q ||
      pt::text(body) match $q
    )] | order(publishedAt desc) [0...10]`
    : groq`*[_type == "blog" && (
      title match $q ||
      excerpt match $q ||
      pt::text(body) match $q
    )] | order(publishedAt desc) [0...10]`;

  const params: Record<string, string> = { q: query };
  if (categorySlug) params.categorySlug = categorySlug;

  return client.fetch(
    groq`${filter} {
      _id, title, "slug": slug.current, excerpt, publishedAt,
      "project": project->{title, "slug": slug.current},
      "category": project->category->{title, "slug": slug.current}
    }`,
    params
  );
}

// ═══ Collections ═══

export async function getCollectionsByProject(projectSlug: string): Promise<CollectionDoc[]> {
  return client.fetch(
    groq`*[_type == "collection" && project->slug.current == $projectSlug] | order(order) {
      _id, title, "slug": slug.current, description,
      "postCount": count(*[_type == "blog" && references(^._id)])
    }`,
    { projectSlug }
  );
}
