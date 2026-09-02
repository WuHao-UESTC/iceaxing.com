import type { PortableTextBlock } from '@portabletext/react';

export interface CategoryDoc {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  order?: number;
  icon?: SanityImage;
  tags?: string[];
  createdAt?: string;
  coverImage?: HomeImage;
}

export interface ProjectDoc {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  order?: number;
  category?: { title: string; slug: string };
  tags?: string[];
  status?: 'ongoing' | 'completed' | 'planned';
  progress?: number;
  createdAt?: string;
  coverImage?: HomeImage;
  postCount?: number;
  collectionCount?: number;
  latestPosts?: BlogListItem[];
  latestCollections?: CollectionPreview[];
}

export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  language: 'zh' | 'en' | 'de';
  theme?: 'default' | 'terminal' | 'serif' | 'manga' | 'minimal';
  excerpt?: string;
  bodyText?: string;
  publishedAt: string;
  tags?: string[];
  authorName?: string;
  coverImage?: HomeImage;
  project?: { title: string; slug: string };
  category?: { title: string; slug: string };
  collection?: { title: string; slug: string };
}

export type SpecialBlogItem = BlogListItem;

export interface SpecialCategorySection extends CategoryDoc {
  specialPosts: SpecialBlogItem[];
}

export interface BlogFull extends BlogListItem {
  body: PortableTextBlock[];
  bodyText?: string;
  updatedAt?: string;
  project?: { title: string; slug: string };
  category?: { title: string; slug: string };
  collection?: { title: string; slug: string };
}

export interface LogDoc {
  _id: string;
  date: string;
  title: string;
  slug: string;
  description?: string;
  body: PortableTextBlock[];
  category: 'site' | 'content' | 'other';
}

export interface CollectionDoc {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
  coverImage?: HomeImage;
  postCount: number;
  latestPosts?: BlogListItem[];
}

export interface CollectionPreview {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  tags?: string[];
  postCount?: number;
}

export interface HomeCollectionEntry {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  postCount: number;
}

export interface HomeProjectEntry {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  collections: HomeCollectionEntry[];
}

export interface HomeEntryGroup extends CategoryDoc {
  projects: HomeProjectEntry[];
}

export interface FriendDoc {
  _id: string;
  name: string;
  url: string;
  avatar?: SanityImage;
  description?: string;
  order?: number;
}

export interface ProfileDoc {
  _id: string;
  name: string;
  avatar?: SanityImage;
  bio: PortableTextBlock[];
  socialLinks?: { label: string; url: string }[];
}

export interface AboutDoc {
  _id: string;
  title: string;
  intro: string;
  body?: PortableTextBlock[];
}

export interface MottoDoc {
  _id: string;
  text: string;
  source?: string;
}

export interface HomeImage {
  url?: string;
  alt?: string;
  lqip?: string;
}

export interface HomeProjectCard {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  status?: 'ongoing' | 'completed' | 'planned';
  progress?: number;
  createdAt?: string;
  category?: { title: string; slug: string };
  coverImage?: HomeImage;
}

export interface HomeCategoryCard {
  _id: string;
  title: string;
  slug: string;
  intro?: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
  coverImage?: HomeImage;
}

export interface HomeEntryCard {
  _id: string;
  title: string;
  href: string;
  intro?: string;
  kind: 'log' | 'about' | 'friends' | 'profile';
}

export interface HomePayload {
  siteIntro?: string;
  mottos: MottoDoc[];
  specialPosts: SpecialBlogItem[];
  entryCards: HomeEntryCard[];
  skillCategories: HomeCategoryCard[];
  ongoingProjects: HomeProjectCard[];
  completedProjects: HomeProjectCard[];
  ramblingPosts: SpecialBlogItem[];
  lifeCategories: HomeCategoryCard[];
  lifeRecentPosts: SpecialBlogItem[];
}

export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  caption?: string;
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export interface SubscriptionOption {
  type: 'category' | 'project' | 'collection';
  slug: string;
  title: string;
  intro?: string;
  parentSlug?: string;
}
