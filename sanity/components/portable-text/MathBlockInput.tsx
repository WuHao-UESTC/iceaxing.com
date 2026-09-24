import { useDeferredValue, useMemo } from 'react';
import { Box, Card, Stack, Text } from '@sanity/ui';
import katex from 'katex';
import type { ObjectInputProps } from 'sanity';
import { normalizeMathFormula } from '../../../lib/math';

type MathBlockValue = {
  _key?: string;
  _type?: 'mathBlock';
  formula?: string;
};

export function MathBlockInput(props: ObjectInputProps<MathBlockValue>) {
  const formula = normalizeMathFormula(props.value?.formula ?? '');
  const deferredFormula = useDeferredValue(formula);
  const html = useMemo(
    () => deferredFormula
      ? katex.renderToString(deferredFormula, {
          displayMode: true,
          throwOnError: false,
          strict: false,
        })
      : '',
    [deferredFormula],
  );

  return (
    <Stack space={3}>
      {deferredFormula && (
        <Card border radius={2} padding={4} tone="transparent">
          <Stack space={3}>
            <Text muted size={1} weight="medium">
              公式预览
            </Text>
            <Box
              contentEditable={false}
              style={{ overflowX: 'auto', paddingBlock: 4 }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Stack>
        </Card>
      )}
      {props.renderDefault(props)}
    </Stack>
  );
}
