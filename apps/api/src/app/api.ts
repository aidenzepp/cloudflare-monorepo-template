import * as HttpApi from "effect/http-api/HttpApi";
import { HealthzApi } from "@api/features/healthz/api";
import { LlmsApi } from "@api/features/llms/api";

/**
 * Composes the feature contracts exposed by this Worker.
 * Add each feature group here and provide its matching handler layer in the Worker.
 * The identifier "api" names this contract, independently of deployment identity
 * and endpoint paths; it does not need to change when the template is renamed.
 */
export const Api = HttpApi.make("api").add(HealthzApi).add(LlmsApi);
