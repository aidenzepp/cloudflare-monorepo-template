import { defineConfig } from "vite-plus";
import core from "ultracite/oxlint/core";
import antiSlop from "ultracite/oxlint/anti-slop";

/**
 * Matches module declarations and calls without spacing local call groups.
 */
const topLevelUnit = {
  selector:
    'Program > :matches(ExportNamedDeclaration, ExportDefaultDeclaration, FunctionDeclaration, ClassDeclaration, TSTypeAliasDeclaration, TSInterfaceDeclaration, TSEnumDeclaration, TSModuleDeclaration, VariableDeclaration, ExpressionStatement[expression.type="CallExpression"])',
};

/**
 * Matches direct and yielded Effect logs, including piped log annotations.
 */
const effectLogStatement = {
  selector:
    'ExpressionStatement:matches([expression.type="CallExpression"], [expression.type="YieldExpression"]):has(CallExpression[callee.type="MemberExpression"][callee.object.name="Effect"][callee.property.name=/^log(Trace|Debug|Info|Warning|Error|Fatal)?$/])',
};

export default defineConfig({
  fmt: {
    ignorePatterns: [".agents/**", "bun.lock"],
    jsdoc: { commentLineStrategy: "multiline", lineWrappingStyle: "balance" },
  },
  lint: {
    extends: [core, antiSlop],
    ignorePatterns: ["dist/**", ".agents/**"],
    jsPlugins: ["./tools/lint/plugin.mjs", "@stylistic/eslint-plugin"],
    // Keep application and infrastructure imports stable when files move.
    // Node-loaded lint plugins retain relative .mjs imports because Node does not use TS paths.
    // https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-restricted-imports
    overrides: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  message:
                    "Use a configured @api/*, @server/*, @platform/*, @infra/*, or @test/* alias instead of a relative source import.",
                  regex: "^\\.{1,2}/",
                },
              ],
            },
          ],
        },
      },
      {
        // This test imports bun:test from plain JavaScript. The type-aware checker
        // does not load those types for an .mjs file; the assertions still run under bun test.
        files: ["tools/**/*.test.mjs"],
        rules: {
          "typescript/no-unsafe-argument": "off",
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-call": "off",
          "typescript/no-unsafe-member-access": "off",
          "typescript/no-unsafe-return": "off",
        },
      },
    ],
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", next: topLevelUnit, prev: "*" },
        { blankLine: "always", next: "*", prev: topLevelUnit },
        {
          blankLine: "always",
          next: "const",
          // Effect generator calls are wrapped in yield expressions.
          prev: {
            selector:
              'ExpressionStatement:matches([expression.type="CallExpression"], [expression.type="YieldExpression"][expression.argument.type="CallExpression"])',
          },
        },
        { blankLine: "always", next: "return", prev: "*" },
        { blankLine: "always", next: "*", prev: "if" },
        { blankLine: "always", next: "*", prev: effectLogStatement },
      ],
      // Related Effect schemas and errors form one cohesive module.
      "max-classes-per-file": "off",
      // Effect adapters return existing promises without introducing async wrappers.
      "typescript/promise-function-async": "off",
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      // Every apps/<name>/src is checked. Opt an app out in optedOutApps.
      "workspace/api-source-roles": "error",
      "workspace/kebab-case-paths": "error",
      "workspace/no-built-in-try-catch": "error",
      "workspace/require-bucket-destroy-policy": "error",
    },
  },
});
