import { buildTheme } from '@sanity/ui/theme';

const baseTheme = buildTheme();

export const iceaxingStudioTheme = buildTheme({
  radius: [0, 2, 4, 7, 10, 14],
  font: {
    code: {
      ...baseTheme.fonts.code,
      family: '"JetBrains Mono", "Cascadia Code", monospace',
    },
    heading: {
      ...baseTheme.fonts.heading,
      family: '"Noto Serif SC", "Songti SC", serif',
    },
    label: {
      ...baseTheme.fonts.label,
      family: '"Noto Serif SC", "PingFang SC", sans-serif',
    },
    text: {
      ...baseTheme.fonts.text,
      family: '"Noto Serif SC", "PingFang SC", sans-serif',
    },
  },
  color: {
    base: {
      default: {
        bg: ['gray/50', 'gray/950'],
        fg: ['gray/900', 'gray/100'],
        border: ['blue/200', 'gray/800'],
        focusRing: ['blue/600', 'yellow/500'],
        accent: { fg: ['blue/700', 'yellow/500'] },
        link: { fg: ['blue/700', 'yellow/400'] },
        muted: {
          bg: ['blue/50', 'gray/900'],
          fg: ['gray/600', 'gray/400'],
        },
        code: {
          bg: ['blue/50', 'gray/900'],
          fg: ['blue/900', 'yellow/200'],
        },
      },
    },
  },
});
