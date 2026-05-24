export function TerminalTheme({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="theme-terminal"
      style={{
        '--blog-font-body': "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        '--blog-font-heading': "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        '--blog-line-height': '1.7',
        '--blog-link-color': '#38bdf8',
        '--blog-blockquote-border': '#22c55e',
        '--blog-blockquote-color': '#4ade80',
        color: '#22c55e',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        padding: '1rem',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
