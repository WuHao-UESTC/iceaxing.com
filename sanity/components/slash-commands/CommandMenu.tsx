import { Box, Menu, MenuItem, Popover, Portal, Label, useLayer } from '@sanity/ui';
import { type SlashCommand } from './commands';
import { type ComponentType } from 'react';

interface CommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (cmd: SlashCommand) => void;
  referenceElement: HTMLElement | null;
}

export function CommandMenu({
  commands,
  selectedIndex,
  onSelect,
  referenceElement,
}: CommandMenuProps) {
  const { isTopLayer } = useLayer();

  if (!referenceElement || commands.length === 0) return null;

  const popover = (
    <Popover
      content={
        <Menu padding={1} space={1}>
          {commands.map((cmd, idx) => (
            <MenuItem
              key={cmd.id}
              text={cmd.label}
              icon={cmd.icon as ComponentType}
              padding={3}
              pressed={idx === selectedIndex}
              onClick={() => onSelect(cmd)}
              tone={idx === selectedIndex ? 'primary' : undefined}
            >
              <Box flex={1} paddingRight={4}>
                <Label size={0} muted>
                  {cmd.description}
                </Label>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      }
      open
      placement="bottom-start"
      referenceElement={referenceElement}
      portal
      constrainSize
      matchReferenceWidth
    >
      <div />
    </Popover>
  );

  if (isTopLayer) return popover;
  return <Portal>{popover}</Portal>;
}
