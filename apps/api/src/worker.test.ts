import { expect, test, afterAll } from "bun:test";
import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as HttpServer from "effect/http/HttpServer";
import * as HttpRouter from "effect/http/HttpRouter";
import { Api } from "./api";
import { makeHealthzHandlers } from "./healthz/handlers";

/**
 * Adapts the endpoint layers to web requests for fast in-process HTTP tests only.
 * Production uses the Alchemy Worker; deployed integration tests cover that adapter.
 */
const runtime = HttpRouter.toWebHandler(
  HttpApiBuilder.layer(Api).pipe(
    Layer.provide(makeHealthzHandlers()),
    Layer.provide(HttpServer.layerServices),
  ),
);

afterAll(() => runtime.dispose());

test("health endpoint", async () => {
  const response = await runtime.handler(new Request("https://template.test/api/healthz"));
  expect(response.status).toBe(200);
  expect(await response.text()).toBe(JSON.stringify({ ok: true, runtime: "cloudflare" }));
});

test.each([
  new Request("https://template.test/api/missing"),
  new Request("https://template.test/api/healthz", { method: "POST" }),
])("unsupported request returns 404: %s", async (request) => {
  const response = await runtime.handler(request);
  expect(response.status).toBe(404);
  expect(await response.text()).toBe("");
});
