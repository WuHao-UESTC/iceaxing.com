import { useEffect, useRef } from 'react';

type PtBlock = {
  _key: string;
  _type: string;
  style?: string;
  children?: Array<{ _key: string; _type: string; text: string; marks?: string[] }>;
  [key: string]: unknown;
};

let markdownParserPromise: Promise<typeof import('./markdownHandler')> | null = null;

function loadMarkdownParser() {
  markdownParserPromise ??= import('./markdownHandler');
  return markdownParserPromise;
}

function looksLikeMarkdown(text: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|```|>\s)|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\$\$[\s\S]+?\$\$/.test(
    text,
  );
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

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleHandle = idleWindow.requestIdleCallback?.(
      () => void loadMarkdownParser(),
      { timeout: 2500 },
    );

    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const text = clipboardData.getData('text/plain');
      if (!text || !looksLikeMarkdown(text)) return;

      const targetEl = e.target as Node;
      const blockEl = findBlockElement(targetEl);
      const blockKey = blockEl?.getAttribute('data-block-key') || '';

      e.preventDefault();
      e.stopPropagation();

      try {
        const { markdownToPortableText } = await loadMarkdownParser();
        const newBlocks = markdownToPortableText(text);
        if (newBlocks.length === 0) {
          document.execCommand('insertText', false, text);
          return;
        }

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
        // Preserve the pasted content if the optional parser chunk cannot load.
        document.execCommand('insertText', false, text);
      }
    };

    container.addEventListener('paste', handlePaste, true);
    return () => {
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      container.removeEventListener('paste', handlePaste, true);
    };
  }, [containerRef, onChange]);
}
