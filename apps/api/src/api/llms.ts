import * as Schema from "effect/Schema";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import * as HttpApiSchema from "effect/http-api/HttpApiSchema";
import * as OpenApi from "effect/http-api/OpenApi";
import { DocumentationPaths } from "@api/documentation";

/**
 * Exposes a Markdown discovery document at {@link DocumentationPaths.llms}.
 *
 * The endpoint path is `/` so `HttpRouter.prefixPath` uses the group prefix as
 * the whole route. A longer path is appended and would miss the discovery URL.
 *
 * @see https://llmstxt.org/
 */
export class LlmsApi extends HttpApiGroup.make("llms")
  .add(
    HttpApiEndpoint.get("get", "/", {
      success: Schema.String.pipe(HttpApiSchema.asText()),
    }),
  )
  .prefix(DocumentationPaths.llms)
  .annotateMerge(
    OpenApi.annotations({
      description: "Project discovery for humans and agents.",
      title: "Discovery",
    }),
  ) {}
