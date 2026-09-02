import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env files when a config file is present, so
// load the same env file the rest of the app uses before reading DATABASE_URL.
loadEnv({ path: process.env.ENV ?? ".env.development" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL
  }
});
