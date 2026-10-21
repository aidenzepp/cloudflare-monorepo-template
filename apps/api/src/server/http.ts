import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as HttpApiScalar from "effect/http-api/HttpApiScalar";
import { Api } from "@api/api";
import { DocumentationPaths } from "@api/documentation";
import { ValidationResponses } from "@platform/http/validation/middleware";
import { makeHealthzHandlers } from "@server/healthz/http";
import { makeLlmsHandlers } from "@server/llms/http";

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
    ValidationResponses,
    HttpApiBuilder.layer(Api, { openapiPath: DocumentationPaths.openapiJson }).pipe(
      Layer.provide([makeHealthzHandlers(), makeLlmsHandlers()]),
    ),
    HttpApiScalar.layer(Api, {
      path: DocumentationPaths.docs,
      scalar: { withDefaultFonts: false },
    }),
  );
