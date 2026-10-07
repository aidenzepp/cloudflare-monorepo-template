import * as Effect from "effect/Effect";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "../api";

/**
 * Implements the liveness contract with a schema-checked successful response.
 * HttpApiBuilder checks endpoint coverage and the handler's success/error types.
 *
 * @returns The handler layer constructed during the Worker construction phase.
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/
 */
export const makeHealthzHandlers = () =>
  HttpApiBuilder.group(Api, "healthz", (handlers) =>
    handlers.handle("get", () => Effect.succeed({ ok: true, runtime: "cloudflare" })),
  );
