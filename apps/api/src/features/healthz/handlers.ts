import * as Effect from "effect/Effect";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "@api/app/api";

/**
 * Implements the liveness contract with a schema-checked successful response.
 * The healthz.get span demonstrates native tracing without changing the response.
 * Its debug log stays below the default info threshold to avoid noisy health polls.
 * HttpApiBuilder checks endpoint coverage and the handler's success/error types.
 *
 * @returns The handler layer constructed during the Worker construction phase.
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/
 * @see https://alchemy.run/cloudflare/tutorial/part-6/#add-structured-logging
 */
export const makeHealthzHandlers = () =>
  HttpApiBuilder.group(Api, "healthz", (handlers) =>
    handlers.handle("get", () =>
      Effect.gen(function* checkLiveness() {
        yield* Effect.logDebug("Liveness check completed").pipe(
          Effect.annotateLogs({ endpoint: "healthz" }),
        );

        return { ok: true, runtime: "cloudflare" } as const;
      }).pipe(Effect.withSpan("healthz.get")),
    ),
  );
