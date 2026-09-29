import { normalizeHtmlAnchorId } from '@/lib/html-anchor';

export function AnchorBlock({ id }: { id?: string }) {
  const anchorId = normalizeHtmlAnchorId(id);
  if (!anchorId) return null;

  return <span id={anchorId} className="block scroll-mt-24" aria-hidden="true" />;
}
