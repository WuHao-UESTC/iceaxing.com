import { AsteriskIcon } from '@sanity/icons';
import { defineField } from 'sanity';
import { InlineMathDecorator } from '../components/portable-text/InlineMathDecorator';

export function portableTextBlock() {
  return {
    type: 'block',
    marks: {
      decorators: [
        { title: 'Strong', value: 'strong' },
        { title: 'Emphasis', value: 'em' },
        { title: 'Code', value: 'code' },
        { title: 'Underline', value: 'underline' },
        { title: 'Strike', value: 'strike-through' },
        {
          title: 'Inline formula',
          value: 'inlineMath',
          icon: AsteriskIcon,
          component: InlineMathDecorator,
        },
      ],
      annotations: [
        {
          name: 'link',
          title: 'Link',
          type: 'object',
          fields: [
            defineField({
              name: 'href',
              title: 'URL',
              type: 'url',
              validation: (Rule) =>
                Rule.uri({
                  allowRelative: true,
                  scheme: ['http', 'https', 'mailto', 'tel'],
                }),
            }),
          ],
        },
      ],
    },
  };
}
