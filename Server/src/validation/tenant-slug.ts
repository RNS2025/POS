import { z } from 'zod';

export const RESERVED_SLUGS = new Set(['register', 'login', 'platform', 'api', 'invite']);

export const slugSchema = z
  .string()
  .min(2, 'Must be at least 2 characters (e.g. acme-bakery)')
  .max(64, 'Must be 64 characters or fewer')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use only lowercase letters, numbers, and hyphens (e.g. acme-bakery)',
  );

export function assertSlugAllowed(slug: string): void {
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`"${slug}" cannot be used as a shop web address. Choose another name (e.g. acme-bakery).`);
  }
}
