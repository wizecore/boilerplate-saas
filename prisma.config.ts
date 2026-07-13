import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * The connection URL lives here (no longer in `schema.prisma`). The runtime Prisma
 * Client connects through the `@prisma/adapter-pg` driver adapter (see `lib/db.ts`);
 * the Migrate CLI uses the `datasource.url` below.
 *
 * `DATABASE_URL` is injected by the `dotenv -e .env.development` wrapper in the
 * `migrate` npm scripts (and by the real environment in production). It is read from
 * `process.env` directly — rather than via the `env()` helper, which throws when the
 * variable is missing — so `prisma generate` (which needs no database) never fails.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL as string
  }
});
