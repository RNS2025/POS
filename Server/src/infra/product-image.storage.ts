import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function saveProductImage(
  tenantId: string,
  productId: string,
  file: Express.Multer.File,
): Promise<string> {
  if (!ALLOWED.has(file.mimetype)) {
    throw new Error('Image must be JPEG, PNG, or WebP.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be at most 2 MB.');
  }
  const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
  const key = `tenants/${tenantId}/products/${productId}.${ext}`;
  const fullPath = path.join(UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, file.buffer);
  return key;
}

export async function deleteProductImage(imageKey: string | null | undefined): Promise<void> {
  if (!imageKey) {
    return;
  }
  try {
    await fs.unlink(path.join(UPLOAD_DIR, imageKey));
  } catch {
    /* missing file */
  }
}

export async function readProductImage(imageKey: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(UPLOAD_DIR, imageKey));
  } catch {
    return null;
  }
}

export function imageContentType(imageKey: string): string {
  if (imageKey.endsWith('.png')) return 'image/png';
  if (imageKey.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export function newProductId(): string {
  return randomUUID();
}
