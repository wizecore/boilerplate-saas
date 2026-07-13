import nextConfig from "eslint-config-next";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import stylisticPlugin from "@stylistic/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";
import localRules from "./eslint-local-rules.cjs";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".build/**",
      "components/ui/**",
      "postcss.config.js",
      "server.js",
      "tailwind.config.js",
      "node_modules/**",
      ".next/**",
      "dollar/**",
      "generated/**"
    ]
  },
  // Next.js config already in flat format
  ...nextConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "unused-imports": unusedImports,
      "@stylistic": stylisticPlugin,
      "local-rules": localRules,
      prettier: prettierPlugin
    },

    // eslint-plugin-react 7.37.5 (pulled in by eslint-config-next) has not yet
    // shipped ESLint 10 support: its "detect" version path calls the removed
    // context.getFilename() API and crashes. Pin the React version explicitly to
    // skip that detection until the plugin publishes an ESLint 10 compatible release.
    settings: {
      react: {
        version: "19.2"
      }
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    rules: {
      // TypeScript recommended rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true // handler && handler()
        }
      ],

      // Max length
      "max-len": [
        "error",
        {
          code: 95,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true
        }
      ],

      // Disable nag to use next/image
      "@next/next/no-img-element": "off",

      // Unused imports
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],

      // No unused expressions
      "no-unused-expressions": "off",

      // No console
      "no-console": "error",

      // Quotes - avoids conflict with prettier, for const s = '{ a: "dsadas" }'
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],

      // Local rules
      "local-rules/disallow-prisma-client-import": "error",
      "local-rules/file-naming-convention": "error",
      "local-rules/process-env": [
        "error",
        "components/**/*.{ts,tsx}",
        "pages/**/*.{ts,tsx}!!pages/api/**/*.{ts,tsx}",
        "lib/utils.ts"
      ],
      "local-rules/local-use-session": "error",

      // React Compiler diagnostics shipped in eslint-plugin-react-hooks v7's
      // recommended config. This project has not adopted the React Compiler, so
      // these advisory rules are disabled (matching the existing set-state-in-effect
      // opt-out) rather than refactoring functionally-correct code to satisfy them.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",

      // Restricted globals
      "no-restricted-globals": [
        "error",
        "event",
        // Vite does not support global, so we use globalThis instead
        "global"
      ],

      // Prettier rules (must be last to override other formatting rules)
      ...prettierConfig.rules,
      "prettier/prettier": "error",

      // Curly braces
      curly: ["error", "all"]
    }
  }
];

export default eslintConfig;
