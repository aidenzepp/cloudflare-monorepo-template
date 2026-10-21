import * as Schema from "effect/Schema";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import * as HttpApiSchema from "effect/http-api/HttpApiSchema";
import { DocumentationPaths } from "@api/documentation";

/**
 * Exposes a Markdown discovery document using the API's text response encoding.
 *
 * @see https://llmstxt.org/
 */
export const LlmsApi = HttpApiGroup.make("llms").add(
  HttpApiEndpoint.get("get", DocumentationPaths.llms, {
    success: Schema.String.pipe(HttpApiSchema.asText()),
  }),
);
