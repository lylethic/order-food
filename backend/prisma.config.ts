import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // DIRECT_URL is required for migrations (prisma migrate deploy).
    // During `prisma generate` (build time) this is not needed, so we
    // fall back to a placeholder so the config can be loaded without a real DB.
    url: process.env.DIRECT_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
