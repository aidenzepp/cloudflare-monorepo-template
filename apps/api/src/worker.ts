import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as HttpApiError from "effect/http-api/HttpApiError";
import * as Etag from "effect/http/Etag";
import * as HttpPlatform from "effect/http/HttpPlatform";
import * as HttpRouter from "effect/http/HttpRouter";
import { Api } from "./api";
import { HealthzHandlers } from "./healthz/handlers";

/**
 * Supplies HTTP encoding services without granting access to a server filesystem.
 * This Worker returns JSON; frontend files are served by Cloudflare's asset binding.
 * The no-op filesystem fails unsupported file operations rather than emulating disk.
 *
 * @see https://github.com/Effect-TS/effect/blob/v4.0.1/packages/effect/src/http/HttpPlatform.ts
 */
const HttpServices = Layer.mergeAll(HttpPlatform.layer, Path.layer, Etag.layerWeak).pipe(
  Layer.provideMerge(FileSystem.layerNoop({})),
);

/**
 * Fails unmatched API requests through Effect's built-in HTTP 404 error.
 * NotFound implements the HTTP response protocol, producing an empty 404 response.
 * Feature-specific errors belong in endpoint error schemas and use Effect.fail.
 *
 * @see https://github.com/Effect-TS/effect/blob/v4.0.1/packages/effect/src/http-api/HttpApiError.ts
 */
const NotFoundRoute = HttpRouter.add("*", "/*", Effect.fail(new HttpApiError.NotFound()));

/**
 * Registers the API and its implementations, then adds the unmatched-route fallback.
 */
const Routes = Layer.mergeAll(
  HttpApiBuilder.layer(Api).pipe(Layer.provide(HealthzHandlers), Layer.provide(HttpServices)),
  NotFoundRoute,
);

/**
 * Adapts Effect's HTTP router to the web-standard Request/Response boundary.
 * Keep this runtime at module scope so requests reuse its layer initialization.
 *
 * @see https://github.com/Effect-TS/effect/blob/v4.0.1/packages/effect/src/http/HttpRouter.ts
 */
const runtime = HttpRouter.toWebHandler(Routes);

export default {
  /**
   * Dispatch the request through the typed API and HTTP error handling.
   *
   * @param request The incoming Cloudflare HTTP request.
   * @returns The encoded success or HTTP failure response.
   */
  fetch(request: Request) {
    return runtime.handler(request);
  },
} satisfies ExportedHandler;
