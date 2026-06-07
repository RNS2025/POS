import type { ZodError } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  shopName: 'Shop name',
  slug: 'Shop web address',
  email: 'Email',
  password: 'Password',
  tenantSlug: 'Shop web address',
  merchantId: 'Merchant number',
  privateKey: 'Private key',
  apiKey: 'Payment window key',
};

export function formatZodError(err: ZodError): string {
  const issue = err.issues[0];
  if (!issue) {
    return 'Please check the form and try again.';
  }

  const fieldKey = issue.path[0];
  const label =
    fieldKey !== undefined && FIELD_LABELS[String(fieldKey)]
      ? `${FIELD_LABELS[String(fieldKey)]}: `
      : '';

  return `${label}${issue.message}`;
}
