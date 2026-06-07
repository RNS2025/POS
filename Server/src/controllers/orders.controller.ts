import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { TenantRequest } from '../middleware/resolve-tenant.middleware.js';
import { orderActionsService } from '../services/order-actions.service.js';
import { ordersService } from '../services/orders.service.js';

export const listOrdersController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await ordersService.list(req.auth!, req.tenant!, {
      page,
      limit,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      channel: typeof req.query.channel === 'string' ? req.query.channel : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
    });
    res.json(result);
  },
);

export const getOrderDetailController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const result = await ordersService.getDetail(req.auth!, req.tenant!, req.params.orderId!);
    res.json(result);
  },
);

export const retryOrderController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const result = await orderActionsService.retry(req.auth!, req.tenant!, req.params.orderId!);
    res.json(result);
  },
);

export const refundOrderController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const idempotencyKey =
      typeof req.headers['idempotency-key'] === 'string' ? req.headers['idempotency-key'] : undefined;
    const result = await orderActionsService.refund(
      req.auth!,
      req.tenant!,
      req.params.orderId!,
      req.body,
      idempotencyKey,
    );
    res.json(result);
  },
);

export const voidOrderController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const result = await orderActionsService.voidSale(req.auth!, req.tenant!, req.params.orderId!);
    res.json(result);
  },
);

export const syncOrderStatusController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const result = await ordersService.syncStatus(req.auth!, req.tenant!, req.params.orderId!);
    res.json(result);
  },
);

export const abortKasseSaleController = asyncHandler(
  async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    const result = await orderActionsService.abortSale(req.auth!, req.tenant!, req.params.orderId!);
    res.json(result);
  },
);

export const markOrderCancelledController = asyncHandler(
  async (req: TenantRequest, res: Response) => {
    const result = await orderActionsService.markCancelled(req.tenant!.id, req.params.orderId!);
    res.json(result);
  },
);
