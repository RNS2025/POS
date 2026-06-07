import { randomBytes } from 'node:crypto';

const ORDER_REF_LENGTH = 12;

export function generateQuickpayOrderRef(): string {
  return randomBytes(ORDER_REF_LENGTH / 2).toString('hex');
}
