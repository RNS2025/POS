import { prisma } from '../infra/db.js';

export interface IPaymentWebhookEventRepository {
  exists(paymentId: string, operationId: number): Promise<boolean>;
  create(paymentId: string, operationId: number, eventType: string): Promise<void>;
}

export class PaymentWebhookEventRepository implements IPaymentWebhookEventRepository {
  exists(paymentId: string, operationId: number) {
    return prisma.paymentWebhookEvent
      .findUnique({
        where: { paymentId_operationId: { paymentId, operationId } },
        select: { id: true },
      })
      .then((row) => row !== null);
  }

  create(paymentId: string, operationId: number, eventType: string) {
    return prisma.paymentWebhookEvent
      .create({
        data: { paymentId, operationId, eventType },
      })
      .then(() => undefined);
  }
}

export const paymentWebhookEventRepository = new PaymentWebhookEventRepository();
