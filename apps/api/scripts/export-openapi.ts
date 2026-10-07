import * as Effect from "effect/Effect";
import * as OpenApi from "effect/http-api/OpenApi";
import { Api } from "../src/api";

/**
 * Exports the assembled API contract for documentation and downstream generators.
 * Run from the repository root; generated output is ignored and uploaded by CI.
 * Importing the contract does not provision resources or connect to Cloudflare.
 *
 * @see https://effect.website/docs/v4/api/effect/http-api/OpenApi
 */
const exportOpenApi = Effect.tryPromise(() =>
  Bun.write("generated/openapi.json", `${JSON.stringify(OpenApi.fromApi(Api), null, 2)}\n`),
);

await Effect.runPromise(exportOpenApi);
