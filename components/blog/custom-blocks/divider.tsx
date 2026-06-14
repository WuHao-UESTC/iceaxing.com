interface DividerProps {
  style?: 'solid' | 'dashed' | 'dotted';
}

const borderStyles: Record<string, string> = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
};

export function Divider({ style = 'solid' }: DividerProps) {
  return (
    <hr
      className={`my-8 border-t border-zinc-300 ${borderStyles[style] || borderStyles.solid}`}
    />
  );
}
