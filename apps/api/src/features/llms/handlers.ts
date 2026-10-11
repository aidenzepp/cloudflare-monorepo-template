import * as Effect from "effect/Effect";
import * as HttpServerRequest from "effect/http/HttpServerRequest";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "@api/app/api";
import { DocumentationPaths } from "@api/app/documentation";

/**
 * Serves project discovery with documentation links on the request's origin.
 * Effect's Web Request conversion retains the original Cloudflare request URL,
 * so local, preview, and production links need no configured hostname.
 * Endpoint contracts remain in the generated specification.
 *
 * @returns The handler layer for the discovery endpoint.
 * @see https://effect.website/docs/v4/api/effect/http/HttpServerRequest#toweb
 * @see https://llmstxt.org/
 */
export const makeLlmsHandlers = () =>
  HttpApiBuilder.group(Api, "llms", (handlers) =>
    handlers.handle("get", () =>
      Effect.gen(function* describeProject() {
        const incoming = yield* HttpServerRequest.HttpServerRequest;
        const request = yield* HttpServerRequest.toWeb(incoming).pipe(Effect.orDie);
        const { origin } = new URL(request.url);

        return `# Cloudflare Monorepo Template

> An application template with an Effect HTTP API and frontend assets served by a Cloudflare Worker.

Use the OpenAPI document for endpoint paths, request schemas, responses, errors, and authentication requirements.

## API documentation

- [OpenAPI JSON](${new URL(DocumentationPaths.openapiJson, origin).href}): Machine-readable API contract.
- [Interactive API reference](${new URL(DocumentationPaths.docs, origin).href}): Browse the API and try requests.

`;
      }).pipe(Effect.withSpan("llms.get")),
    ),
  );
