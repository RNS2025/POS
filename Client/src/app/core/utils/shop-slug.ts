const RESERVED = new Set(['register', 'login', 'platform', 'api', 'invite']);

export function isValidShopSlug(slug: string): boolean {
  if (!slug.trim()) {
    return false;
  }
  if (slug.includes('{') || slug.includes('}')) {
    return false;
  }
  if (RESERVED.has(slug)) {
    return false;
  }
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function invalidShopSlugMessage(slug: string): string {
  if (slug.includes('{') || slug.includes('}')) {
    return (
      'This link uses a placeholder, not a real shop address. ' +
      'Use your shop link — e.g. localhost:4200/demo-shop/checkout (replace demo-shop with your shop name).'
    );
  }
  if (!slug.trim()) {
    return 'Shop web address is missing from the URL.';
  }
  return `We couldn't find a shop at "${slug}". Check the link — it should look like localhost:4200/your-shop-name/checkout.`;
}
