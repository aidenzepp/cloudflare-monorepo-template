import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Bun";
import { expect } from "bun:test";
import * as Effect from "effect/Effect";
import * as ConfigProvider from "effect/ConfigProvider";
import Stack from "@infra/stacks/integration";
import { IntegrationTestStage } from "@test/config";

/**
 * Validates the test process stage before registering deployment hooks.
 * Explicitly selects the process environment outside the Alchemy test harness
 * and Worker construction, so runtime provider overrides cannot change its source.
 */
const stage = Effect.runSync(IntegrationTestStage.parse(ConfigProvider.fromEnv()));

/**
 * Owns the Effect-aware Bun hooks for real Cloudflare integration tests.
 * This follows Alchemy tutorial part 3: deploy the stack once, obtain its outputs
 * lazily inside tests, and destroy the same isolated stage after every run.
 * Teardown is unconditional in local runs and CI, including failed assertions.
 * Unlike the tutorial, local runs do not retain cloud resources.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/
 */
const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  stage,
  state: Cloudflare.state(),
});

/**
 * Provides the deployed stack outputs through Alchemy's lazy Effect accessor.
 * beforeAll starts deployment once; yielding stack inside a test waits for it.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/#deploy-the-stack-before-tests
 */
const stack = beforeAll(
  Effect.gen(function* prepareIntegrationWorker() {
    yield* Effect.logInfo(`Cloud integration stage: ${stage}`);

    const outputs = yield* deploy(Stack);
    yield* Test.getWhenReady(`${outputs.url}/api/healthz`);

    return outputs;
  }),
);

afterAll(destroy(Stack));

/**
 * Verifies the deployed liveness contract over HTTP using the stack's actual URL.
 * Network and response-decoding failures enter Effect's typed error channel;
 * failed expectations fail the test; teardown releases the isolated test stack.
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
