import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";
import core from "ultracite/oxlint/core";
import antiSlop from "ultracite/oxlint/anti-slop";

/**
 * Matches declarations owned by the module without spacing local variables.
 */
const topLevelDeclaration = {
  selector:
    "Program > :matches(ExportNamedDeclaration, ExportDefaultDeclaration, FunctionDeclaration, ClassDeclaration, TSTypeAliasDeclaration, TSInterfaceDeclaration, TSEnumDeclaration, TSModuleDeclaration, VariableDeclaration)",
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
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", next: topLevelDeclaration, prev: "*" },
        { blankLine: "always", next: "*", prev: topLevelDeclaration },
        { blankLine: "always", next: "return", prev: "*" },
        { blankLine: "always", next: "*", prev: "if" },
        { blankLine: "always", next: "*", prev: effectLogStatement },
      ],
      // Effect adapters return existing promises without introducing async wrappers.
      "typescript/promise-function-async": "off",
      "workspace/no-built-in-try-catch": "error",
    },
  },
  plugins: [cloudflare()],
});
