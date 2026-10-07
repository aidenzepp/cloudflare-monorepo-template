import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Bun";
import { expect } from "bun:test";
import * as Effect from "effect/Effect";
import * as ConfigProvider from "effect/ConfigProvider";
import Stack from "../alchemy.run.ts";
import { Ci } from "./config";

/**
 * Validates the test process cleanup flag before registering deployment hooks.
 * Effect's default config provider is empty; explicitly read environment values
 * here, outside the Alchemy test harness and Worker construction.
 */
const isCi = Effect.runSync(Ci.parse(ConfigProvider.fromEnv()));

/**
 * Owns the Effect-aware Bun hooks for real Cloudflare integration tests.
 * This follows Alchemy tutorial part 3: deploy the stack once, obtain its outputs
 * lazily inside tests, and destroy the same isolated stage on CI.
 * Local runs retain resources for inspection and reuse, matching the tutorial.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/
 */
const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: Cloudflare.state(),
});

/**
 * Provides the deployed stack outputs through Alchemy's lazy Effect accessor.
 * beforeAll starts deployment once; yielding stack inside a test waits for it.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/#deploy-the-stack-before-tests
 */
const stack = beforeAll(deploy(Stack));

// Retain local test resources for reuse; CI tears down its isolated stage.
// https://alchemy.run/cloudflare/tutorial/part-3/#destroy-after-tests-on-ci
afterAll.skipIf(!isCi)(destroy(Stack));

/**
 * Verifies the deployed liveness contract over HTTP using the stack's actual URL.
 * Network and response-decoding failures enter Effect's typed error channel;
 * failed expectations fail the test; CI cleanup releases the test stack.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/#add-http-assertions
 */
const verifyHealth = Effect.gen(function* verifyHealthEndpoint() {
  const outputs = yield* stack;
  const response = yield* Effect.tryPromise(() => fetch(`${outputs.url}/api/healthz`));
  expect(response.status).toBe(200);

  const body = yield* Effect.tryPromise(() => response.json());
  expect(body).toEqual({ ok: true, runtime: "cloudflare" });
});

test("deployed health endpoint", verifyHealth);
