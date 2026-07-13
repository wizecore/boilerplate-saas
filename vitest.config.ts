import { configDefaults, defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // `dollar/` is an untracked, reference-only product tree (its tests use a
    // different runner) and `generated/` holds the generated Prisma client.
    exclude: [...configDefaults.exclude, "dollar/**", "generated/**"]
  }
});
