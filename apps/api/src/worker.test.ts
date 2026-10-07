import { expect, test, afterAll } from "bun:test";
import * as Layer from "effect/Layer";
import * as OpenApi from "effect/http-api/OpenApi";
import * as HttpServer from "effect/http/HttpServer";
import * as HttpRouter from "effect/http/HttpRouter";
import { Api } from "./api";
import { makeHttpLayer } from "./http";

/**
 * Adapts the endpoint layers to web requests for fast in-process HTTP tests only.
 * Production uses the Alchemy Worker; deployed integration tests cover that adapter.
 */
const runtime = HttpRouter.toWebHandler(
  makeHttpLayer().pipe(Layer.provide(HttpServer.layerServices)),
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

test("OpenAPI route exposes the assembled API contract", async () => {
  const response = await runtime.handler(new Request("https://template.test/api/openapi.json"));
  expect(response.status).toBe(200);
  expect(await response.text()).toBe(JSON.stringify(OpenApi.fromApi(Api)));
});

test("Scalar documentation embeds the API and bundled interaction script", async () => {
  const response = await runtime.handler(new Request("https://template.test/api/openapi"));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");

  const html = await response.text();
  expect(html).toContain("Scalar.createApiReference");
  expect(html).toContain("/api/healthz");
  expect(/<script[^>]+src=/u.test(html)).toBe(false);
});
