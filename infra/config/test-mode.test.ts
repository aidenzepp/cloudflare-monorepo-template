import { expect } from "bun:test";
import * as Test from "alchemy/Test/Bun";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Exercises suite startup without deploying resources or starting local Workers.
 */
const { test } = Test.make({ dev: true, providers: Layer.empty });

/**
 * Imports a real suite with Alchemy setup intercepted before hook registration.
 *
 * @param suite The local Worker or cloud integration suite to load.
 * @param override The isolated Alchemy test-mode override, or undefined to omit it.
 * @returns Captured process output and exit status without provisioning resources.
 */
const startSuite = (suite: string, override: string | undefined) =>
  Bun.spawnSync([process.execPath, "--preload", "./test/fixtures/test-mode-preload.ts", suite], {
    env: {
      ...process.env,
      ALCHEMY_DEV: "true",
      ALCHEMY_TEST_DEV: override,
      ALCHEMY_TEST_STAGE: "test-mode-guard",
    },
    stderr: "pipe",
    stdout: "pipe",
  });

test(
  "conflicting or invalid mode overrides stop real suites before Alchemy setup",
  Effect.sync(() => {
    for (const [suite, override] of [
      ["./apps/api/tests/worker.test.ts", "false"],
      ["./apps/api/tests/worker.test.ts", "0"],
      ["./test/integration.test.ts", "true"],
      ["./test/integration.test.ts", "1"],
      ["./apps/api/tests/worker.test.ts", "invalid"],
      ["./test/integration.test.ts", "invalid"],
    ] as const) {
      const result = startSuite(suite, override);
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout.toString()).toBe("");
      expect(result.stderr.toString()).toContain("ALCHEMY_TEST_DEV");
      expect(result.stderr.toString()).not.toContain("Test setup intercepted");
    }
  }),
  { timeout: 30_000 },
);

test(
  "absent, empty and matching overrides preserve each suite's explicit mode",
  Effect.sync(() => {
    for (const [suite, override, expected] of [
      ["./apps/api/tests/worker.test.ts", undefined, '{"dev":true}\n'],
      ["./apps/api/tests/worker.test.ts", "", '{"dev":true}\n'],
      ["./apps/api/tests/worker.test.ts", "true", '{"dev":true}\n'],
      ["./apps/api/tests/worker.test.ts", "1", '{"dev":true}\n'],
      ["./test/integration.test.ts", undefined, '{"dev":false}\n'],
      ["./test/integration.test.ts", "", '{"dev":false}\n'],
      ["./test/integration.test.ts", "false", '{"dev":false}\n'],
      ["./test/integration.test.ts", "0", '{"dev":false}\n'],
    ] as const) {
      const result = startSuite(suite, override);
      expect(result.stdout.toString()).toBe(expected);
      expect(result.stderr.toString()).toContain("Test setup intercepted");
    }
  }),
  { timeout: 30_000 },
);
