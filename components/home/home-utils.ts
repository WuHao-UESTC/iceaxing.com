import type { SpecialBlogItem } from "@/lib/sanity/types";

export function postHref(post: SpecialBlogItem) {
  const category = post.category?.slug;
  const project = post.project?.slug;
  if (!category) return "/";
  if (project && post.collection?.slug)
    return `/${category}/${project}/${post.collection.slug}/${post.slug}`;
  if (project) return `/${category}/${project}/${post.slug}`;
  return `/${category}/${post.slug}`;
}

export function formatDate(date: string | undefined, locale: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
