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
    jsPlugins: ["./tools/lint-plugin.mjs", "@stylistic/eslint-plugin"],
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
                    "Use a configured @api/*, @infra/*, or @test/* alias instead of a relative source import.",
                  regex: "^\\.{1,2}/",
                },
              ],
            },
          ],
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
          prev: { selector: 'ExpressionStatement[expression.type="CallExpression"]' },
        },
        { blankLine: "always", next: "return", prev: "*" },
        { blankLine: "always", next: "*", prev: "if" },
        { blankLine: "always", next: "*", prev: effectLogStatement },
      ],
      // Effect adapters return existing promises without introducing async wrappers.
      "typescript/promise-function-async": "off",
      "workspace/no-built-in-try-catch": "error",
      "workspace/require-bucket-destroy-policy": "error",
    },
  },
});
