import * as HttpApi from "effect/http-api/HttpApi";
import * as OpenApi from "effect/http-api/OpenApi";
import { HealthzApi } from "@api/healthz";
import { LlmsApi } from "@api/llms";

/**
 * Composes the contracts exposed by this Worker.
 * Add each group here and provide its handler layer from the server router.
 * The identifier "api" names this contract, independently of deployment identity
 * and endpoint paths.
 *
 * @see https://effect.website/docs/v4/api/effect/http-api/HttpApi
 */
export class Api extends HttpApi.make("api")
  .add(HealthzApi)
  .add(LlmsApi)
  .annotateMerge(
    OpenApi.annotations({
      title: "Cloudflare Monorepo Template",
    }),
  ) {}
