'use client';

import GiscusReact from '@giscus/react';

interface Props {
  locale?: string;
}

export function GiscusComments({ locale = 'zh' }: Props) {
  const giscusLang = locale === 'zh' ? 'zh-CN' : locale === 'de' ? 'de' : 'en';

  if (
    !process.env.NEXT_PUBLIC_GISCUS_REPO ||
    !process.env.NEXT_PUBLIC_GISCUS_REPO_ID ||
    !process.env.NEXT_PUBLIC_GISCUS_CATEGORY ||
    !process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID
  ) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t">
      <GiscusReact
        repo={process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}`}
        repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID}
        category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY}
        categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID}
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        lang={giscusLang}
        loading="lazy"
      />
    </div>
  );
}
