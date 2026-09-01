import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type InputProps, set } from 'sanity';
import { CommandMenu } from './CommandMenu';
import { filterCommands, type SlashCommand } from './commands';
import { useMarkdownPaste } from '../markdown-paste/useMarkdownPaste';

type PtBlock = {
  _key: string;
  _type: string;
  style?: string;
  level?: number;
  listItem?: string;
  children?: Array<{ _key: string; _type: string; text: string; marks?: string[] }>;
  [key: string]: unknown;
};

function generateKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Walk the DOM upward from a node to find the closest PTE block element.
 * In @portabletext/editor v6+, blocks are identified by `data-block-key` attribute.
 */
function findBlockInfo(el: Node | null): { blockKey: string; text: string } | null {
  let current: Node | null = el;
  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const blockKey = (current as Element).getAttribute('data-block-key');
      if (blockKey) {
        return { blockKey, text: current.textContent || '' };
      }
    }
    current = current.parentElement;
  }
  return null;
}

export function SlashCommandInput(props: InputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [targetBlock, setTargetBlock] = useState<PtBlock | null>(null);
  const pendingBlockRef = useRef<PtBlock | null>(null);

  const value = (props.value as PtBlock[]) || [];
  const filtered = useMemo(() => filterCommands(query), [query]);

  // Keep a ref in sync so event handlers always read the latest block
  useEffect(() => {
    pendingBlockRef.current = targetBlock;
  }, [targetBlock]);

  const executeCommand = useCallback(
    (cmd: SlashCommand) => {
      const block = pendingBlockRef.current;
      if (!block) {
        setMenuOpen(false);
        return;
      }

      const blocks = [...(props.value as PtBlock[])];
      const idx = blocks.findIndex((b) => b._key === block._key);
      if (idx < 0) {
        setMenuOpen(false);
        return;
      }

      if (cmd.isCustomBlock) {
        const newBlock: PtBlock = {
          _key: generateKey(),
          _type: cmd.blockType,
          ...(cmd.defaultProps || {}),
        };
        // Remove the slash-text block and insert the new custom block in its place
        blocks.splice(idx, 1, newBlock);
      } else if (cmd.style) {
        // Change the style of the existing block and strip the slash command text
        const existing = blocks[idx];
        blocks[idx] = {
          ...existing,
          style: cmd.style,
          children: existing.children?.map((child) => ({
            ...child,
            text: child.text.replace(/^\/\S*\s*/, ''),
          })),
        };
      }

      props.onChange?.(set(blocks) as never);
      setMenuOpen(false);
      setQuery('');
      setSelectedIndex(0);
      setTargetBlock(null);
    },
    [props],
  );

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setQuery('');
    setTargetBlock(null);
  }, []);

  // Markdown paste handler
  const handlePasteBlocks = useCallback(
    (blocks: PtBlock[]) => {
      props.onChange?.(set(blocks) as never);
    },
    [props],
  );
  useMarkdownPaste(containerRef, value, handlePasteBlocks);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // We listen in capture phase so we see events before the PTE handles them.
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the menu is open, handle navigation keys
      if (menuOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeMenu();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((prev) => (prev - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
          return;
        }
        if (e.key === 'Enter') {
          const cmd = filtered[selectedIndex];
          if (cmd) {
            e.preventDefault();
            e.stopPropagation();
            executeCommand(cmd);
            return;
          }
          // If no command selected, just close
          closeMenu();
          return;
        }
        // Let regular character keys and Backspace pass through —
        // the `input` handler will update the query and close if needed.
        return;
      }

      // Detect `/` at the start of a block
      if (e.key === '/') {
        setTimeout(() => {
          const sel = window.getSelection();
          const anchorNode = sel?.anchorNode as Node | null;
          const blockInfo = findBlockInfo(anchorNode);
          if (!blockInfo) return;

          // Check if the `/` is at the very start of the block
          const trimmed = blockInfo.text.trimStart();
          if (trimmed === '/' || trimmed.startsWith('/ ')) {
            const blocks = (props.value as PtBlock[]) || [];
            const block = blocks.find((b) => b._key === blockInfo.blockKey);
            if (block && block._type === 'block') {
              setTargetBlock(block);
              setQuery('');
              setSelectedIndex(0);
              setAnchorEl(anchorNode as HTMLElement);
              setMenuOpen(true);
            }
          }
        }, 80);
      }
    };

    const handleInput = () => {
      if (!menuOpen) return;

      setTimeout(() => {
        const sel = window.getSelection();
        const anchorNode = sel?.anchorNode as Node | null;
        const blockInfo = findBlockInfo(anchorNode);
        if (!blockInfo) {
          closeMenu();
          return;
        }
        const text = blockInfo.text || '';
        const slashIdx = text.indexOf('/');
        if (slashIdx < 0) {
          closeMenu();
          return;
        }
        const after = text.slice(slashIdx + 1).split(/\s/)[0] || '';
        if (after.length > 30) {
          closeMenu();
          return;
        }
        setQuery(after);
        setSelectedIndex(0);
      }, 50);
    };

    const handleClick = () => {
      if (!menuOpen) return;
      setTimeout(() => {
        const sel = window.getSelection();
        const anchorNode = sel?.anchorNode as Node | null;
        const blockInfo = findBlockInfo(anchorNode);
        if (!blockInfo) {
          closeMenu();
          return;
        }
        const text = blockInfo.text || '';
        if (!text.startsWith('/')) {
          closeMenu();
        }
      }, 100);
    };

    container.addEventListener('keydown', handleKeyDown, true);
    container.addEventListener('input', handleInput, false);
    container.addEventListener('click', handleClick, false);

    return () => {
      container.removeEventListener('keydown', handleKeyDown, true);
      container.removeEventListener('input', handleInput, false);
      container.removeEventListener('click', handleClick, false);
    };
  }, [menuOpen, filtered, selectedIndex, executeCommand, closeMenu, props.value]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {props.renderDefault(props)}
      {menuOpen && (
        <CommandMenu
          commands={filtered}
          selectedIndex={selectedIndex}
          referenceElement={anchorEl}
          onSelect={executeCommand}
        />
      )}
    </div>
  );
}
