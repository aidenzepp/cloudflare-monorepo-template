import * as Schema from "effect/Schema";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import * as OpenApi from "effect/http-api/OpenApi";

/**
 * The liveness response shared by the handler and HTTP consumers.
 */
export const HealthzResponse = Schema.Struct({
  ok: Schema.Literal(true),
  runtime: Schema.Literal("cloudflare"),
});

/**
 * Declares the liveness route under the `/api` prefix.
 * The route confirms Worker execution. It does not check dependency readiness.
 *
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/
 */
export class HealthzApi extends HttpApiGroup.make("healthz")
  .add(HttpApiEndpoint.get("get", "/healthz", { success: HealthzResponse }))
  .prefix("/api")
  .annotateMerge(
    OpenApi.annotations({
      description: "Confirms the Worker is executing. It does not check dependency readiness.",
      title: "Health",
    }),
  ) {}
