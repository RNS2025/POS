import { createHmac, timingSafeEqual } from 'node:crypto';

export function computeQuickpayChecksum(rawBody: string, privateKey: string): string {
  return createHmac('sha256', privateKey).update(rawBody, 'utf8').digest('hex');
}

export function verifyQuickpayChecksum(
  rawBody: string,
  privateKey: string,
  checksumHeader: string | undefined,
): boolean {
  if (!checksumHeader?.trim()) {
    return false;
  }

  const expected = computeQuickpayChecksum(rawBody, privateKey);
  const received = checksumHeader.trim().toLowerCase();
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(received, 'utf8');

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, receivedBuf);
}
