/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import * as Schema from "effect/Schema";
import * as SchemaIssue from "effect/SchemaIssue";
import * as Predicate from "effect/Predicate";

/**
 * Exposes request validation issues using Effect's schema messages and field paths.
 */
export class RequestValidationError extends Schema.TaggedError<RequestValidationError>()(
  "RequestValidationError",
  {
    details: Schema.Array(
      Schema.Struct({ message: Schema.String, path: Schema.Array(Schema.String) }),
    ),
    message: Schema.String,
  },
  { httpApiStatus: 400 },
) {}

/**
 * Formats schema issues as the shared caller-facing request validation contract.
 *
 * @param issue Effect's structured schema issue.
 * @returns Custom schema messages or Effect defaults, with field paths in the public tagged error.
 */
export const requestValidationError = (issue: SchemaIssue.Issue) =>
  new RequestValidationError({
    details: SchemaIssue.makeFormatterStandardSchemaV1()(issue).issues.map((detail) => ({
      message: detail.message,
      path: (detail.path ?? []).map((segment) =>
        String(Predicate.isObject(segment) ? segment.key : segment),
      ),
    })),
    message: "Request validation failed.",
  });
