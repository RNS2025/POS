import type { Express } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { registerAuthRoutes, registerSetupRoutes } from './auth.routes.js';
import { registerCheckoutRoutes } from './checkout.routes.js';
import { registerKasseRoutes } from './kasse.routes.js';
import { registerOrdersRoutes } from './orders.routes.js';
import { registerPlatformRoutes } from './platform.routes.js';
import { registerCatalogRoutes } from './catalog.routes.js';
import { registerKioskRoutes } from './kiosk.routes.js';
import { registerKasseRegisterRoutes } from './kasse-register.routes.js';
import { registerStaffRoutes } from './staff.routes.js';
import { registerAdminUsersRoutes } from './admin-users.routes.js';
import { registerWebhookRoutes } from './webhook.routes.js';

export function registerRoutes(app: Express) {
  app.get('/api/health', healthController);
  registerAuthRoutes(app);
  registerSetupRoutes(app);
  registerCheckoutRoutes(app);
  registerKasseRoutes(app);
  registerOrdersRoutes(app);
  registerPlatformRoutes(app);
  registerCatalogRoutes(app);
  registerKioskRoutes(app);
  registerKasseRegisterRoutes(app);
  registerStaffRoutes(app);
  registerAdminUsersRoutes(app);
}
