import type { RequestHandler } from 'express';
import { checkDatabaseConnection } from '../infra/db.js';

export const healthController: RequestHandler = async (_req, res) => {
  const dbConnected = await checkDatabaseConnection();

  res.json({
    status: 'ok',
    db: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};
