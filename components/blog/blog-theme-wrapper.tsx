import { DefaultTheme } from '@/lib/themes/default';
import { TerminalTheme } from '@/lib/themes/terminal';

const themeMap: Record<string, React.ComponentType<{ children: React.ReactNode }>> = {
  default: DefaultTheme,
  terminal: TerminalTheme,
};

interface Props {
  theme: string;
  children: React.ReactNode;
}

export function BlogThemeWrapper({ theme, children }: Props) {
  const Component = themeMap[theme] ?? themeMap.default;
  if (!themeMap[theme] && theme !== 'default') {
    console.warn(`[blog-theme] Unknown theme "${theme}", falling back to default`);
  }
  return <Component>{children}</Component>;
}
