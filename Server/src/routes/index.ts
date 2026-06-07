import type { Express } from 'express';
import { healthController } from '../controllers/health.controller.js';

export function registerRoutes(app: Express) {
  app.get('/api/health', healthController);
}
