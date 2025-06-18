"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

/** @type {import('eslint').Rule.RuleModule} */
const rulePrismaClientImport = {
  meta: {
    docs: {
      description: "Disallow importing from @prisma/client",
      recommended: true
    },
    schema: []
  },
  create: function (context) {
    return {
      ImportDeclaration: function (node) {
        if (node.source.value === "@prisma/client") {
          const nonPrismaSpecifiers = node.specifiers.filter(
            specifier => specifier.imported.name !== "Prisma"
          );

          if (nonPrismaSpecifiers.length === 0) {
            return;
          }

          context.report({
            node: node,
            message: "Never import definitions @prisma/client directly"
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

module.exports = {
  "disallow-prisma-client-import": rulePrismaClientImport,
  "file-naming-convention": ruleNamingConvention
};
