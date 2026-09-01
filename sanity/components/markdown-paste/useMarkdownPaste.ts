import { useEffect, useRef } from 'react';
import { markdownToPortableText } from './markdownHandler';

type PtBlock = {
  _key: string;
  _type: string;
  style?: string;
  children?: Array<{ _key: string; _type: string; text: string; marks?: string[] }>;
  [key: string]: unknown;
};

function isMarkdown(text: string): boolean {
  return /(\*\*|__|~~|`|^#{1,3}\s|^[\-\*]\s|^\d+\.\s|^\>\s|^```|\[.*\]\(.*\)|^[-*_]{3,}|\|[^|]+\|)/m.test(text);
}

function findBlockElement(el: Node | null): Element | null {
  let current: Node | null = el;
  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const elem = current as Element;
      if (elem.getAttribute('data-block-key')) {
        return elem;
      }
    }
    current = current.parentElement;
  }
  return null;
}

export function useMarkdownPaste(
  containerRef: React.RefObject<HTMLDivElement | null>,
  value: PtBlock[],
  onChange: ((val: PtBlock[]) => void) | undefined,
) {
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const text = clipboardData.getData('text/plain');
      if (!text || !isMarkdown(text)) return;

      try {
        const newBlocks = markdownToPortableText(text);
        if (newBlocks.length === 0) return;

        e.preventDefault();
        e.stopPropagation();

        // Find the target block from the paste event
        const targetEl = e.target as Node;
        const blockEl = findBlockElement(targetEl);
        const blockKey = blockEl?.getAttribute('data-block-key') || '';

        const currentValue = valueRef.current;
        let insertIdx = currentValue.length;

        if (blockKey) {
          const idx = currentValue.findIndex((b) => b._key === blockKey);
          if (idx >= 0) {
            insertIdx = idx; // Insert before the target block
          }
        }

        const updatedBlocks = [
          ...currentValue.slice(0, insertIdx),
          ...newBlocks,
          ...currentValue.slice(insertIdx),
        ];

        onChange?.(updatedBlocks);
      } catch {
        // If parsing fails, let the default paste handler run
      }
    };

    container.addEventListener('paste', handlePaste, true);
    return () => container.removeEventListener('paste', handlePaste, true);
  }, [containerRef, onChange]);
}
