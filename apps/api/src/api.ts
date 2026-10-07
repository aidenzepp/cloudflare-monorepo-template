import * as HttpApi from "effect/http-api/HttpApi";
import { HealthzApi } from "./healthz/api";

/**
 * Composes the feature contracts exposed by this Worker.
 * Add each feature group here and provide its matching handler layer in the Worker.
 */
export const Api = HttpApi.make("api").add(HealthzApi);
