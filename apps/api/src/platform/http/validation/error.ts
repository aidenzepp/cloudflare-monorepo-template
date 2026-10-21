/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import * as SchemaIssue from "effect/SchemaIssue";

/**
 * One entry from Effect's Standard Schema V1 failure list.
 * `path` keeps the formatter's property keys, including numeric array indexes.
 * An empty path means the whole value failed.
 */
const ValidationIssue = Schema.Struct({
  message: Schema.String,
  path: Schema.Array(Schema.PropertyKey),
});

/**
 * Exposes a request validation failure as Effect's Standard Schema issue list.
 * `SchemaIssue.makeFormatterStandardSchemaV1` returns `{ issues }`, and the HTTP body keeps that
 * field.
 *
 * @see https://effect.website/docs/v4/api/effect/SchemaIssue
 * @see https://github.com/Effect-TS/effect/blob/effect%404.0.1/packages/effect/src/SchemaIssue.ts#L1270-L1276
 */
export class RequestValidationError extends Schema.TaggedError<RequestValidationError>()(
  "RequestValidationError",
  {
    issues: Schema.Array(ValidationIssue),
    message: Schema.String,
  },
  { httpApiStatus: 400 },
) {}

/**
 * Reads a Standard Schema path segment as the property key Effect's formatter stores.
 *
 * @param segment A property key, or a Standard Schema segment that wraps one.
 * @returns The property key callers use to locate the failure.
 */
const propertyKey = (segment: PropertyKey | { readonly key: PropertyKey }): PropertyKey =>
  Predicate.isObject(segment) ? segment.key : segment;

/**
 * Formats a schema issue as the shared caller-facing request validation contract.
 * The formatter's declared path may be absent or wrapped as `{ key }`. The response stores the
 * property key, and an omitted path becomes an empty path for the whole value.
 *
 * @param issue Effect's structured schema issue.
 * @returns The formatter's issue list with the shared validation message.
 */
export const requestValidationError = (issue: SchemaIssue.Issue) =>
  new RequestValidationError({
    issues: SchemaIssue.makeFormatterStandardSchemaV1()(issue).issues.map((item) => ({
      message: item.message,
      path: (item.path ?? []).map(propertyKey),
    })),
    message: "Request validation failed.",
  });
