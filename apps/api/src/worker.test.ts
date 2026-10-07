import { expect, test } from "bun:test";
import worker from "./worker";

test("health endpoint", async () => {
  const response = await worker.fetch(new Request("https://template.test/api/healthz"));
  expect(response.status).toBe(200);
  expect(await response.text()).toBe(JSON.stringify({ ok: true, runtime: "cloudflare" }));
});

test.each([
  new Request("https://template.test/api/missing"),
  new Request("https://template.test/api/healthz", { method: "POST" }),
])("unsupported request returns 404: %s", async (request) => {
  const response = await worker.fetch(request);
  expect(response.status).toBe(404);
  expect(await response.text()).toBe("");
});
