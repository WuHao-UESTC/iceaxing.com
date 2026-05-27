'use client';

import { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

interface Props {
  data: string;
  caption?: string;
}

export function MindMap({ data, caption }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = svgRef.current;
    svg.innerHTML = '';
    const transformer = new Transformer();
    const { root } = transformer.transform(data);

    const mm = Markmap.create(svg, undefined, root);
    mm.fit();

    return () => {
      svg.innerHTML = '';
    };
  }, [data]);

  return (
    <figure className="my-8">
      {caption && (
        <figcaption className="text-sm text-[var(--color-text-faint)] text-center mb-2">
          {caption}
        </figcaption>
      )}
      <svg ref={svgRef} className="mindmap-svg w-full h-[400px] max-sm:h-[250px] border rounded-lg" />
    </figure>
  );
}
