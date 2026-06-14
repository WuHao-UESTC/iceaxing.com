'use client';

import { useState } from 'react';
import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import { nestedComponents } from './nested-components';

interface ToggleProps {
  title?: string;
  open?: boolean;
  body?: PortableTextBlock[];
}

export function Toggle({ title = '折叠块', open = false, body }: ToggleProps) {
  const [isOpen, setIsOpen] = useState(open);

  return (
    <div className="my-4 rounded-lg border border-zinc-200 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm font-medium bg-zinc-50 hover:bg-zinc-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs transition-transform" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        <span>{title}</span>
      </button>
      {isOpen && body && body.length > 0 && (
        <div className="px-4 py-2 text-sm leading-relaxed">
          <PortableText value={body} components={nestedComponents} />
        </div>
      )}
    </div>
  );
}
