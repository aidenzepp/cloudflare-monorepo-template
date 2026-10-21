import * as Effect from "effect/Effect";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "@api/api";

/**
 * Returns the liveness response without reading external dependencies.
 *
 * @returns The schema-checked status identifying the Cloudflare runtime.
 */
export const getHealthz = Effect.fn("healthz.get")(
  function* getHealthz() {
    yield* Effect.logDebug("Liveness check completed");

    return { ok: true, runtime: "cloudflare" } as const;
  },
  Effect.annotateLogs({ endpoint: "healthz" }),
);

/**
 * Registers the liveness handler on the healthz group.
 * The group builder runs when the router layer is constructed. `getHealthz`
 * owns the `healthz.get` span for each request.
 *
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/
 * @see https://alchemy.run/cloudflare/tutorial/part-6/#add-structured-logging
 */
export const HealthzApiHandlers = HttpApiBuilder.group(Api, "healthz", (handlers) =>
  handlers.handle("get", getHealthz),
);
