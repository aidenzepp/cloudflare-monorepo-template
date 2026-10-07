import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Bun";
import { expect } from "bun:test";
import * as Effect from "effect/Effect";
import * as State from "alchemy/State";
import Stack from "../alchemy.run.ts";

/**
 * Owns deployment and cleanup for the explicitly invoked cloud test.
 */
const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: State.localState(),
});

/**
 * Provides the isolated stack outputs after deployment.
 */
const stack = beforeAll(deploy(Stack));

afterAll(destroy(Stack));

test(
  "deployed health endpoint",
  Effect.gen(function* verifyHealth() {
    const outputs = yield* stack;
    const response = yield* Effect.tryPromise(() => fetch(`${outputs.url}/api/health`));
    expect(response.status).toBe(200);

    const body = yield* Effect.tryPromise(() => response.json());
    expect(body).toEqual({ ok: true, runtime: "cloudflare" });
  }),
);
