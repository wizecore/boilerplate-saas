import nextJest from "next/jest.js";
import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";
import { Config } from "jest";

const createJestConfig = nextJest({ dir: "./" });

/** FIXME: These should be automatically detected, be careful adding here - should be RegEx safe names */
const modulesToTransform = [
  "nanoid",
  "@octokit",
  "universal-user-agent",
  "before-after-hook",
  "universal-github-app-jwt"
];

const customJestConfig: Config = {
  preset: "ts-jest",
  rootDir: "./",
  testPathIgnorePatterns: [
    "<rootDir>/pages",
    "<rootDir>/node_modules",
    "<rootDir>/.next",
    "<rootDir>/.build"
  ],
  testMatch: ["**/?(*.)+(spec).[jt]s?(x)"],
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "<rootDir>/"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(" + modulesToTransform.join("|") + "))"
  ],
  passWithNoTests: true,
  clearMocks: true,
  testTimeout: 20000
};

const exportConfig = async () => {
  const config = await createJestConfig(customJestConfig)();
  return {
    ...config,
    transformIgnorePatterns: config.transformIgnorePatterns?.filter(
      // NextJS adds this pattern and all your patterns does not work afterwards
      pattern => pattern !== "/node_modules/"
    )
  };
};

export default exportConfig;
