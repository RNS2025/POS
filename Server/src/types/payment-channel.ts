export type PaymentChannel = 'online' | 'terminal';

export const PAYMENT_CHANNELS: PaymentChannel[] = ['online', 'terminal'];

export function isPaymentChannel(value: string): value is PaymentChannel {
  return (PAYMENT_CHANNELS as string[]).includes(value);
}
