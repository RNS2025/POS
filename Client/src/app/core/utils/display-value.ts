/** Placeholder for optional text fields in admin UI. */
export function displayText(value: string | null | undefined, emptyLabel = 'Not set'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : emptyLabel;
}

/** Placeholder for optional payment/status labels. */
export function displayOptional(value: string | null | undefined): string {
  return displayText(value, '—');
}
