import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://pos:pos@localhost:5432/pos',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
};
