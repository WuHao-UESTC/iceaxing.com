import type { PortableTextBlock } from '@portabletext/react';

export interface CategoryDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  order?: number;
  icon?: SanityImage;
}

export interface ProjectDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  order?: number;
  category?: { title: string; slug: string };
}

export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  language: 'zh' | 'en';
  theme?: 'default' | 'terminal' | 'serif' | 'manga' | 'minimal';
  excerpt?: string;
  publishedAt: string;
  tags?: string[];
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
  description?: string;
  postCount: number;
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
  parentSlug?: string;
}
