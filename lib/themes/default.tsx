export function DefaultTheme({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        '--blog-font-body': "'Noto Sans SC', sans-serif",
        '--blog-font-heading': "'Noto Sans SC', sans-serif",
        '--blog-line-height': '1.8',
        '--blog-link-color': '#2563eb',
        '--blog-blockquote-border': '#e4e4e7',
        '--blog-blockquote-color': '#71717a',
        color: '#18181b',
        backgroundColor: '#ffffff',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
