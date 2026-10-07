import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as Etag from "effect/http/Etag";
import * as HttpPlatform from "effect/http/HttpPlatform";
import * as HttpRouter from "effect/http/HttpRouter";
import { Api } from "./api";
import { makeHealthzHandlers } from "./healthz/handlers";

/**
 * Supplies the JSON-only platform stub used by Alchemy's HTTP API guide.
 * This JSON API does not use Effect filesystem response helpers; Cloudflare assets
 * remain available through the Worker assets binding.
 * Effect 4.0.1 also requires platform and compression fields; these match the
 * stub in Alchemy 2.0.0-beta.81's Cloudflare/StateStore/Api.ts.
 *
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/#3c-return-fetch
 */
export const HttpPlatformStub = Layer.succeed(HttpPlatform.HttpPlatform, {
  compression: {
    algorithms: new Set<HttpPlatform.CompressionAlgorithm>(),
    compressResponse: (response) => Effect.succeed(response),
  },
  fileResponse: () => Effect.die("HttpPlatform.fileResponse not supported"),
  fileWebResponse: () => Effect.die("HttpPlatform.fileWebResponse not supported"),
  platform: "web",
});

/**
 * Declares the API as an Alchemy Effect-native Worker.
 * Construction creates handler layers; Alchemy supplies platform services when
 * building the HTTP effect, matching its installed StateStore implementation. Request
 * work remains inside endpoint handlers. Alchemy owns the Cloudflare fetch adapter.
 *
 * Cloudflare.Telemetry forwards Effect spans into native Workers traces. Alchemy
 * enables Worker logs by default; the telemetry layer enables traces and requires
 * a compatibility date at or after 2026-07-28.
 *
 * @see https://alchemy.run/cloudflare/observability/workers-tracing/
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/#3-build-the-worker
 */
export default Cloudflare.Worker(
  "Api",
  {
    assets: { directory: "./dist", runWorkerFirst: ["/api/*"] },
    compatibility: { date: "2026-10-06" },
    main: import.meta.url,
  },
  Effect.sync(() => {
    const healthzHandlers = makeHealthzHandlers();

    return {
      fetch: HttpRouter.toHttpEffect(
        HttpApiBuilder.layer(Api).pipe(
          Layer.provide(healthzHandlers),
          Layer.provide([Etag.layer, HttpPlatformStub, Path.layer]),
        ),
      ),
    };
  }).pipe(Effect.provide(Cloudflare.Telemetry())),
);
