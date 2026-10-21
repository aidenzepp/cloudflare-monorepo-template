import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as HttpApiScalar from "effect/http-api/HttpApiScalar";
import { Api } from "@api/api";
import { DocumentationPaths } from "@api/documentation";
import { ValidationResponses } from "@platform/http/validation/middleware";
import { HealthzApiHandlers } from "@server/healthz/http";
import { LlmsApiHandlers } from "@server/llms/http";

/**
 * Registers the API handlers and the OpenAPI document.
 * Dependencies are provided on this layer, outside the group builders.
 *
 * @see https://effect.website/docs/v4/api/effect/http-api/HttpApiBuilder
 */
const ApiRoutes = HttpApiBuilder.layer(Api, {
  openapiPath: DocumentationPaths.openapiJson,
}).pipe(Layer.provide([HealthzApiHandlers, LlmsApiHandlers]));

/**
 * Serves Effect's bundled Scalar UI for the same contract.
 * Scalar embeds the generated specification.
 *
 * @see https://effect.website/docs/v4/api/effect/http-api/HttpApiScalar
 */
const DocsRoute = HttpApiScalar.layer(Api, {
  path: DocumentationPaths.openapiDocs,
  scalar: { withDefaultFonts: false },
});

/**
 * Merges validation responses, API routes, and the Scalar UI.
 * Production and local HTTP tests share this layer. Alchemy supplies platform
 * services when it builds the HTTP effect.
 *
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/
 */
export const HttpLayer = Layer.mergeAll(ValidationResponses, ApiRoutes, DocsRoute);
