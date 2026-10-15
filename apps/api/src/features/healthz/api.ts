import * as Schema from "effect/Schema";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";

/**
 * The liveness response shared by the handler and HTTP consumers.
 */
export const HealthzResponse = Schema.Struct({
  ok: Schema.Literal(true),
  runtime: Schema.Literal("cloudflare"),
});

/**
 * Declares the liveness endpoint; it confirms execution, not dependency readiness.
 *
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/
 */
export const HealthzApi = HttpApiGroup.make("healthz").add(
  HttpApiEndpoint.get("get", "/api/healthz", { success: HealthzResponse }),
);
