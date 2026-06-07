import 'dotenv/config';

function parseCorsOrigin(value: string | undefined): string | string[] {
  if (!value) {
    return 'http://localhost:4200';
  }
  if (value.includes(',')) {
    return value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://pos:pos@localhost:5432/pos',
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production',
  encryptionKey: process.env.ENCRYPTION_KEY ?? 'dev-encryption-key-32-bytes-min!!',
  apiPublicUrl:
    process.env.API_PUBLIC_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    'http://localhost:3000',
  appPublicUrl: process.env.APP_PUBLIC_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  verifoneApiUrl: process.env.VERIFONE_API_URL ?? 'https://cst2.test-gsc.vfims.com',
  verifoneSimulator: process.env.VERIFONE_SIMULATOR !== 'false',
};
