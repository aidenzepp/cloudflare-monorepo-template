/* oxlint-disable anti-slop/no-unknown-parameters -- The defect boundary must accept unknown and narrow with HttpApiSchemaError.is. */
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as HttpRouter from "effect/http/HttpRouter";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import * as HttpApiError from "effect/http-api/HttpApiError";
import {
  RequestValidationError,
  requestValidationError,
} from "@api/platform/http/validation/error";

/**
 * Encodes the public validation contract before producing an HTTP response.
 */
const encodeValidationError = Schema.encodeUnknownEffect(RequestValidationError);

/**
 * Converts recognized request schema defects into the validated public contract.
 *
 * @param error The defect raised by the HTTP API builder.
 * @returns A validation response, server-error response, or the original defect.
 */
// oxlint-disable-next-line promise/prefer-await-to-callbacks, anti-slop/no-unknown-parameters -- Effect generators are native; defects arrive as unknown and are narrowed before use.
const renderValidationFailure = Effect.fnUntraced(function* renderValidationFailure(
  error: unknown,
) {
  if (!HttpApiError.HttpApiSchemaError.is(error)) {
    return yield* Effect.die(error);
  }

  if (error.kind === "Body" || error.kind === "ResponseHeaders") {
    yield* Effect.logError(error);

    return yield* HttpServerResponse.json(
      { message: "The server could not encode its response." },
      { status: 500 },
    );
  }

  const body = yield* encodeValidationError(requestValidationError(error.cause.issue)).pipe(
    Effect.orDie,
  );

  return yield* HttpServerResponse.json(body, { status: 400 });
});

/**
 * Gives every router request the same schema-validation response boundary.
 * HttpApiBuilder in Effect 4.0.1 promotes schema failures to defects; catch only
 * that recognized defect here. Body and ResponseHeaders denote response encoding
 * failures and remain server errors. Other defects retain their original handling.
 *
 * @see https://effect.website/docs/v4/api/effect/http/HttpRouter
 * @see https://github.com/Effect-TS/effect/blob/effect%404.0.1/packages/effect/src/http-api/HttpApiBuilder.ts#L865-L910
 */
export const ValidationResponses = HttpRouter.middleware(
  (httpEffect) => httpEffect.pipe(Effect.catchDefect(renderValidationFailure)),
  { global: true },
);
