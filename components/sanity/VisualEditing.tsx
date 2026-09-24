'use client';

import { useEffect, useState } from 'react';

let LoadedVisualEditing: typeof import('@sanity/visual-editing/react').VisualEditing | null = null;

export function VisualEditing() {
  const [isLoaded, setIsLoaded] = useState(Boolean(LoadedVisualEditing));

  useEffect(() => {
    let active = true;

    async function loadWhenPreviewing() {
      try {
        const response = await fetch('/api/draft/status', { cache: 'no-store' });
        if (!response.ok) return;
        const status = await response.json() as { isEnabled?: boolean };
        if (!status.isEnabled) return;

        const visualEditingModule = await import('@sanity/visual-editing/react');
        if (active) {
          LoadedVisualEditing = visualEditingModule.VisualEditing;
          setIsLoaded(true);
        }
      } catch {
        // Visual editing is optional and must never delay the public site.
      }
    }

    void loadWhenPreviewing();
    return () => {
      active = false;
    };
  }, []);

  const Editor = isLoaded ? LoadedVisualEditing : null;
  return Editor ? <Editor portal /> : null;
}
