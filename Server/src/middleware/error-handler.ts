import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../infra/app-error.js';
import { formatZodError } from '../infra/zod-errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, ...err.payload });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: formatZodError(err) });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: 'Something went wrong on our side. Try again in a moment, or contact RNS-Apps support if it keeps happening.',
  });
};
