import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../infra/app-error.js';
import { formatZodError } from '../infra/zod-errors.js';

function prismaErrorMessage(err: unknown): string | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2022') {
      return 'Database schema is out of date. Run npm run db:migrate in Server and restart the API.';
    }
    if (err.code === 'P2021') {
      return 'A required database table is missing. Run npm run db:migrate in Server and restart the API.';
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return 'Database client is out of sync with the schema. Run npm run db:generate and npm run db:migrate in Server, then restart the API.';
  }

  return null;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, ...err.payload });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: formatZodError(err) });
    return;
  }

  const prismaMessage = prismaErrorMessage(err);
  if (prismaMessage) {
    console.error(err);
    res.status(503).json({ error: prismaMessage });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: 'Something went wrong on our side. Try again in a moment, or contact RNS-Apps support if it keeps happening.',
  });
};
