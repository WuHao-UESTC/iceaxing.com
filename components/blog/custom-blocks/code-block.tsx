import hljs from 'highlight.js/lib/common';

interface Props {
  code: string;
  language: string;
  filename?: string;
}

export function CodeBlock({ code, language, filename }: Props) {
  const highlighted = hljs.highlight(code ?? '', {
    language: hljs.getLanguage(language) ? language : 'plaintext',
  }).value;

  return (
    <figure className="my-6 rounded-lg overflow-hidden border border-zinc-200">
      {filename && (
        <figcaption className="px-4 py-2 bg-zinc-100 text-zinc-500 text-sm font-mono border-b border-zinc-200">
          {filename}
        </figcaption>
      )}
      <pre className="overflow-x-auto">
        <code
          className={`language-${language} hljs block px-4 py-4 text-sm leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </figure>
  );
}
