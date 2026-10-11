import { expect } from "bun:test";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Bun";
import * as Effect from "effect/Effect";
import * as OpenApi from "effect/http-api/OpenApi";
import * as HttpClient from "effect/http/HttpClient";
import { Api } from "./api";
import ApiWorker from "./worker";

/**
 * Runs the actual Worker locally with isolated state and no cloud deployment.
 * The explicit dev mode selects Alchemy's local workerd providers; the test stack
 * and stage keep test cleanup separate from application development resources.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/
 * @see https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/src/Test/Core.ts
 */
const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  dev: true,
  providers: Cloudflare.providers(),
  stage: "test-local",
  state: Alchemy.localState(),
});

/**
 * Hosts the production Worker definition in a separate local test stack.
 */
const TestStack = Alchemy.Stack(
  "cloudflare-monorepo-template-api-tests",
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* provisionTestStack() {
    const worker = yield* ApiWorker;

    return { url: worker.url };
  }),
);

/**
 * Starts workerd once and waits for HTTP readiness before exposing its URL.
 * A resource URL can resolve before cold request startup finishes; readiness
 * belongs in setup so startup does not consume the first assertion's timeout.
 *
 * @see https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/src/Test/Http.ts
 */
const stack = beforeAll(
  Effect.gen(function* prepareWorker() {
    const outputs = yield* deploy(TestStack);
    yield* Test.getWhenReady(`${outputs.url}/api/healthz`);

    return outputs;
  }),
);

afterAll(destroy(TestStack));

test(
  "health endpoint",
  Effect.gen(function* verifyHealth() {
    const outputs = yield* stack;
    const response = yield* HttpClient.get(`${outputs.url}/api/healthz`);
    expect(response.status).toBe(200);
    expect(yield* response.json).toEqual({ ok: true, runtime: "cloudflare" });
  }),
);

test(
  "unsupported requests return empty 404 responses",
  Effect.gen(function* verifyUnsupported() {
    const outputs = yield* stack;
    const missing = yield* HttpClient.get(`${outputs.url}/api/missing`);
    expect(missing.status).toBe(404);
    expect(yield* missing.text).toBe("");

    const unsupported = yield* HttpClient.post(`${outputs.url}/api/healthz`);
    expect(unsupported.status).toBe(404);
    expect(yield* unsupported.text).toBe("");
  }),
);

test(
  "OpenAPI route exposes the assembled API contract",
  Effect.gen(function* verifyOpenApi() {
    const outputs = yield* stack;
    const response = yield* HttpClient.get(`${outputs.url}/api/openapi.json`);
    expect(response.status).toBe(200);
    expect(yield* response.text).toBe(JSON.stringify(OpenApi.fromApi(Api)));
  }),
);

test(
  "Scalar documentation embeds the API and bundled interaction script",
  Effect.gen(function* verifyScalar() {
    const outputs = yield* stack;
    const response = yield* HttpClient.get(`${outputs.url}/api/openapi`);
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");

    const html = yield* response.text;
    expect(html).toContain("Scalar.createApiReference");
    expect(html).toContain("/api/healthz");
    expect(/<script[^>]+src=/u.test(html)).toBe(false);
  }),
);

test(
  "Worker serves the built frontend assets",
  Effect.gen(function* verifyAssets() {
    const outputs = yield* stack;
    const response = yield* HttpClient.get(`${outputs.url}/`);
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(yield* response.text).toContain("<h1>Cloudflare Monorepo Template</h1>");
  }),
);
