"use strict";

const path = require("node:path");
const { globSync } = require("glob");

/**
 * Matches patterns but also allows ignore specified via !!
 *
 * @param patterns {string[]}
 * @param cwd {string}
 * @returns {string[]}
 */
const globFiles = (patterns, cwd) => {
  if (patterns === undefined || patterns.length === 0) {
    throw new Error("Specify glob file patterns in check options");
  }

  if (cwd === undefined) {
    throw new Error("Specify cwd in check options");
  }

  const files = patterns
    .map(o => {
      let ignore = undefined;
      if (o.indexOf("!!") > 0) {
        ignore = o.substring(o.indexOf("!!") + 2);
        o = o.substring(0, o.indexOf("!!"));
      }
      return globSync(o, {
        cwd,
        ignore
      });
    })
    .flat(1);

  return files;
};

/** @type {import('eslint').Rule.RuleModule} */
const rulePrismaClientImport = {
  meta: {
    docs: {
      description: "Disallow importing the generated Prisma client/models directly",
      recommended: true
    },
    schema: []
  },
  create: function (context) {
    return {
      ImportDeclaration: function (node) {
        const source = node.source.value;
        const isPrismaClient =
          source === "@prisma/client" ||
          (typeof source === "string" && source.includes("generated/prisma"));

        if (isPrismaClient) {
          // Importing only the `Prisma` namespace (input/query helper types) is allowed.
          const nonPrismaSpecifiers = node.specifiers.filter(
            specifier =>
              specifier.type !== "ImportSpecifier" || specifier.imported.name !== "Prisma"
          );

          if (nonPrismaSpecifiers.length === 0) {
            return;
          }

          context.report({
            node: node,
            message: "Import the Prisma client from @/lib/db and model types from @/types"
          });
        }
      }
    };
  }
};

/** @type {import('eslint').Rule.RuleModule} */
const ruleNamingConvention = {
  meta: {
    docs: {
      description: "Enforce file naming conventions for components and lib files",
      recommended: true
    },
    schema: [],
    type: "problem"
  },
  create: function (context) {
    const filename = context.filename;
    const cwd = context.cwd;

    // Helper functions to check naming conventions
    const isPascalCase = str => {
      return /^[A-Z][a-zA-Z0-9]*$/.test(str);
    };

    const isCamelCase = str => {
      return /^[a-z][a-zA-Z0-9]*$/.test(str);
    };

    return {
      Program: function (node) {
        if (!filename.startsWith(cwd)) {
          throw new Error("Not in current working directory: " + filename);
        }

        const relativeName = filename.substring(cwd.length + 1);
        const baseName = path.basename(relativeName);
        let fileName =
          baseName.indexOf(".") > 0
            ? baseName.substring(0, baseName.lastIndexOf("."))
            : baseName;

        if (fileName.endsWith(".stories")) {
          // For stories, enforce PascalCase only for the story name
          fileName = fileName.substring(0, fileName.lastIndexOf("."));
        }

        const extension =
          baseName.lastIndexOf(".") > 0
            ? baseName.substring(baseName.lastIndexOf(".") + 1)
            : "";

        // Skip index files
        if (fileName === "index" || fileName.endsWith("/index")) {
          return;
        }

        // Check if file is in components directory, but not shadcn ui
        if (
          relativeName.startsWith("components/") &&
          !relativeName.startsWith("components/ui")
        ) {
          // For .tsx files in components, enforce PascalCase
          if (extension === "tsx") {
            if (!isPascalCase(fileName) && !fileName.startsWith("use")) {
              context.report({
                node,
                message: `Component files (.tsx) in components directory must use PascalCase. Rename '${fileName}' to '${fileName.charAt(0).toUpperCase()}${fileName.slice(1)}'`
              });
            }
          }
          // For .ts files in components, enforce camelCase
          else if (extension === "ts") {
            if (!isCamelCase(fileName)) {
              context.report({
                node,
                message: `Utility files (.ts) in components directory must use camelCase. Rename '${fileName}' to '${fileName.charAt(0).toLowerCase()}${fileName.slice(1)}'`
              });
            }
          }
        }
        // Check if file is in lib directory
        else if (relativeName.startsWith("lib/")) {
          if (!isCamelCase(fileName)) {
            context.report({
              node,
              message: `Files in lib directory must use camelCase. Rename '${fileName}' to '${fileName.charAt(0).toLowerCase()}${fileName.slice(1)}'`
            });
          }
        }
      }
    };
  }
};

/**
 * @param node {import('estree').MemberExpression}
 */
const isProcessEnvNode = node => {
  return (
    node.object &&
    node.object.type === "MemberExpression" &&
    node.object.object &&
    node.object.object.name === "process" &&
    node.object.property &&
    node.object.property.name === "env"
  );
};

/** @type {string[] | undefined} */
let cachedFiles = undefined;

/** @type {import('eslint').Rule.RuleModule} */
const ruleProcessEnv = {
  meta: {
    type: "problem",
    docs: {
      description: "Check against using non-NEXT_PUBLIC_ env variables in client-side code",
      category: "Possible Problems",
      recommended: true
    },
    schema: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  create: context => {
    /** @type {string[]} */
    let files = cachedFiles;
    if (!cachedFiles) {
      files = globFiles(context.options, context.cwd);
      cachedFiles = files;
    }

    const checkName = name => {
      // NODE_ENV is the one non-public var Next.js statically inlines into the
      // client bundle, so branching on it client-side is safe (not a secret leak).
      return name === "NODE_ENV" || name.startsWith("NEXT_PUBLIC_");
    };

    return {
      MemberExpression: node => {
        if (!isProcessEnvNode(node)) {
          return;
        }

        let f = context.filename;
        if (f.startsWith(context.cwd)) {
          f = f.substring(context.cwd.length + 1);
        }

        if (node.property && files.includes(f)) {
          const property = node.property;

          if (property.type === "Identifier") {
            const name = property.name;
            if (!checkName(name)) {
              context.report({
                node: property,
                message: `process.env.${name} is not allowed in frontend components. Use NEXT_PUBLIC_ prefixed variables instead.`
              });
            }
          } else if (property.type === "Literal") {
            const name = property.value;
            if (!checkName(name)) {
              context.report({
                node: property,
                message: `process.env[${property.raw}] is not allowed in frontend components. Use NEXT_PUBLIC_ prefixed variables instead.`
              });
            }
          }
        }
      }
    };
  }
};

/** @type {import('eslint').Rule.RuleModule} */
const ruleLocalUseSession = {
  meta: {
    docs: {
      description:
        "Prefer using local useSession and SessionProvider instead of next-auth/react",
      recommended: true
    },
    schema: [],
    type: "problem"
  },
  create: function (context) {
    return {
      ImportDeclaration: function (node) {
        if (node.source.value === "next-auth/react") {
          const sessionSpecifiers = node.specifiers.filter(
            specifier =>
              specifier.type === "ImportSpecifier" &&
              (specifier.imported.name === "SessionProvider" ||
                specifier.imported.name === "useSession")
          );

          if (sessionSpecifiers.length > 0) {
            const specifierNames = sessionSpecifiers.map(s => s.imported.name).join(", ");
            context.report({
              node: node,
              message: `Import ${specifierNames} from "@/components/useSession" instead of "next-auth/react"`
            });
          }
        }
      }
    };
  }
};

module.exports = {
  rules: {
    "disallow-prisma-client-import": rulePrismaClientImport,
    "file-naming-convention": ruleNamingConvention,
    "process-env": ruleProcessEnv,
    "local-use-session": ruleLocalUseSession
  }
};
