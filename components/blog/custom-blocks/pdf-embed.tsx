'use client';

import { useTranslations } from 'next-intl';

interface Props {
  file: {
    asset: {
      _ref: string;
    };
  };
  caption?: string;
}

export function PdfEmbed({ file, caption }: Props) {
  const t = useTranslations('pdf');

  if (!file?.asset?._ref) return null;
  const [, id, extension] = file.asset._ref.split('-');
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const fileUrl = `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${extension}`;

  return (
    <figure className="my-8">
      {caption && (
        <figcaption className="text-sm text-zinc-500 text-center mb-2">
          {caption}
        </figcaption>
      )}
      <iframe
        src={fileUrl}
        className="w-full h-[600px] max-sm:h-[400px] border rounded-lg"
        title={caption || t('defaultTitle')}
      />
      <div className="text-center mt-2">
        <a
          href={fileUrl}
          download
          className="text-sm text-[var(--color-blue-soft)] hover:text-[var(--color-sand)]"
        >
          {t('download')}
        </a>
      </div>
    </figure>
  );
}
