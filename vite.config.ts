import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";
import core from "ultracite/oxlint/core";
import antiSlop from "ultracite/oxlint/anti-slop";

export default defineConfig({
  fmt: {
    ignorePatterns: [".agents/**", "bun.lock"],
    jsdoc: { commentLineStrategy: "multiline", lineWrappingStyle: "balance" },
  },
  lint: {
    extends: [core, antiSlop],
    ignorePatterns: ["dist/**", ".agents/**"],
    jsPlugins: ["./tools/lint-plugin.mjs"],
    rules: {
      // Effect adapters return existing promises without introducing async wrappers.
      "typescript/promise-function-async": "off",
      "workspace/no-built-in-try-catch": "error",
    },
  },
  plugins: [cloudflare()],
});
