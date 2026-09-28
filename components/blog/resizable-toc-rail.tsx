'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'iceaxing:article-toc-width';
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const KEYBOARD_STEP = 20;

type DragState = {
  pointerId: number;
  startX: number;
  startWidth: number;
  maxWidth: number;
};

function clampWidth(value: number, availableWidth = MAX_WIDTH) {
  const upperBound = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, availableWidth));
  return Math.min(upperBound, Math.max(MIN_WIDTH, value));
}

export function ResizableTocRail({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const widthRef = useRef(DEFAULT_WIDTH);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const bodyStyleRef = useRef<{ cursor: string; userSelect: string } | null>(null);

  const resizeLabel = locale === 'de'
    ? 'Breite des Inhaltsverzeichnisses ändern'
    : locale === 'en'
      ? 'Resize table of contents'
      : '调整文章大纲宽度';

  const updateWidth = (nextWidth: number, availableWidth = MAX_WIDTH) => {
    const clamped = clampWidth(nextWidth, availableWidth);
    widthRef.current = clamped;
    if (containerRef.current) containerRef.current.style.width = `${clamped}px`;
    handleRef.current?.setAttribute('aria-valuenow', String(Math.round(clamped)));
  };

  const availableWidth = () => (
    containerRef.current?.parentElement?.getBoundingClientRect().width ?? MAX_WIDTH
  );

  const saveWidth = () => {
    window.localStorage.setItem(STORAGE_KEY, String(Math.round(widthRef.current)));
  };

  const restoreBodyStyles = () => {
    if (!bodyStyleRef.current) return;
    document.body.style.cursor = bodyStyleRef.current.cursor;
    document.body.style.userSelect = bodyStyleRef.current.userSelect;
    bodyStyleRef.current = null;
  };

  useEffect(() => {
    const storedWidth = Number(window.localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(storedWidth) && storedWidth > 0) updateWidth(storedWidth);
    return restoreBodyStyles;
  }, []);

  if (!children) return null;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const renderedWidth = containerRef.current?.getBoundingClientRect().width ?? widthRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: renderedWidth,
      maxWidth: availableWidth(),
    };
    widthRef.current = renderedWidth;
    event.currentTarget.setPointerCapture(event.pointerId);
    bodyStyleRef.current = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    updateWidth(drag.startWidth + event.clientX - drag.startX, drag.maxWidth);
  };

  const finishPointerResize = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    restoreBodyStyles();
    saveWidth();
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextWidth = widthRef.current;
    if (event.key === 'ArrowRight') nextWidth += KEYBOARD_STEP;
    else if (event.key === 'ArrowLeft') nextWidth -= KEYBOARD_STEP;
    else if (event.key === 'Home') nextWidth = MIN_WIDTH;
    else if (event.key === 'End') nextWidth = availableWidth();
    else return;

    event.preventDefault();
    updateWidth(nextWidth, availableWidth());
    saveWidth();
  };

  const resetWidth = () => {
    updateWidth(DEFAULT_WIDTH, availableWidth());
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div
      ref={containerRef}
      className="blog-toc-resizable"
      style={{ width: `${DEFAULT_WIDTH}px` }}
    >
      {children}
      <div
        ref={handleRef}
        aria-label={resizeLabel}
        aria-orientation="vertical"
        aria-valuemax={MAX_WIDTH}
        aria-valuemin={MIN_WIDTH}
        aria-valuenow={DEFAULT_WIDTH}
        className="blog-toc-resize-handle"
        role="separator"
        tabIndex={0}
        title={resizeLabel}
        onDoubleClick={resetWidth}
        onKeyDown={handleKeyboard}
        onPointerCancel={finishPointerResize}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerResize}
      />
    </div>
  );
}
