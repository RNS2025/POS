import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface JwtPayload {
  sub: string;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
