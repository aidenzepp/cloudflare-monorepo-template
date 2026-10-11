import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as HttpApiScalar from "effect/http-api/HttpApiScalar";
import { Api } from "@api/app/api";
import { makeHealthzHandlers } from "@api/features/healthz/handlers";

/**
 * Registers API handlers, the OpenAPI document, and Effect's bundled Scalar UI.
 * Production and local HTTP tests share this layer so documentation routes stay
 * covered by the same contract. Scalar embeds the generated specification.
 *
 * @returns The router layer requiring the hosting runtime's platform services.
 * @see https://effect.website/docs/v4/api/effect/http-api/HttpApiScalar
 * @see https://effect.website/docs/v4/api/effect/http-api/HttpApiBuilder
 */
export const makeHttpLayer = () =>
  Layer.mergeAll(
    HttpApiBuilder.layer(Api, { openapiPath: "/api/openapi.json" }).pipe(
      Layer.provide(makeHealthzHandlers()),
    ),
    HttpApiScalar.layer(Api, { path: "/api/openapi", scalar: { withDefaultFonts: false } }),
  );
