import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { registerRoutes } from './routes/index.js';
import { config } from './infra/config.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
    }),
  );
  app.use(express.json());

  registerRoutes(app);

  app.use(errorHandler);

  return app;
}
