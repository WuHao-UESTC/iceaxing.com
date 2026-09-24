import { AddIcon } from '@sanity/icons';
import { useIntentLink } from 'sanity/router';

type Props = {
  className?: string;
  label: string;
  schemaType: string;
  template?: string;
  templateParameters?: Record<string, unknown>;
};

export function CreateDocumentLink({
  className,
  label,
  schemaType,
  template,
  templateParameters,
}: Props) {
  const link = useIntentLink({
    intent: 'create',
    params: templateParameters
      ? [{ type: schemaType, ...(template ? { template } : {}) }, templateParameters]
      : { type: schemaType, ...(template ? { template } : {}) },
  });

  return (
    <a className={className} href={link.href} onClick={link.onClick}>
      <AddIcon aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
