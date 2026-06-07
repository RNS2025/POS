import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const getInviteController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getInvite(req.params.token!);
  res.json(result);
});

export const acceptInviteController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.acceptInvite(req.params.token!, req.body);
  res.status(201).json(result);
});
