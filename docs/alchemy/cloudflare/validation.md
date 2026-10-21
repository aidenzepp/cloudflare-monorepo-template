# Request validation responses

`apps/api/src/platform/http/validation/` owns the shared HTTP validation boundary. Application assembly installs `ValidationResponses` globally in `src/server/http.ts`; endpoint modules keep their input constraints in Effect schemas.

Request parameter, header, query, and payload schema failures return HTTP 400 with this contract:

```json
{
  "_tag": "RequestValidationError",
  "message": "Request validation failed.",
  "issues": [{ "path": ["id"], "message": "Expected a UUID." }]
}
```

The issue message above is illustrative. `issues` is the list returned by Effect's Standard Schema formatter. It preserves custom schema and check messages and supplies defaults when none are configured. Each path uses the formatter's property keys, so a field is a string and an array index is a number. An empty path indicates a failure of the whole value, such as malformed JSON. The boundary does not rename the list or rewrite the messages. Set `message` on a schema for type failures, set `message` on a check for constraint failures, and use `Schema.annotateKey({ messageMissingKey: "..." })` for missing required fields. HTTP tests verify all three override forms reach callers unchanged.

For endpoints with validated inputs, declare `RequestValidationError` in the endpoint's `error` schema alongside any feature errors. This makes the generated OpenAPI contract and typed clients describe the response emitted by the shared boundary. Health and discovery currently have no validated request fields; no demonstration endpoint is added to production.

Effect 4.0.1's `HttpApiBuilder` promotes recognized schema failures to defects. The middleware catches only `HttpApiSchemaError`, whose `kind` distinguishes request decoding from response encoding. `Body` and `ResponseHeaders` mean server response encoding failed: they are logged internally and return HTTP 500 with a curated message, without exposing schema details. Unrelated defects keep the router's existing handling. Recheck these kinds and the defect behavior when upgrading Effect.

Focused tests use test-only HTTP API endpoints to verify invalid params, headers, query values, payloads, malformed/empty JSON, valid input, response-body/header encoding failures, unrelated defects, and OpenAPI error declarations. Request validation failures do not execute the endpoint handler. The in-memory test adapter's filesystem stub is confined to tests; production uses Alchemy's Worker runtime.

References: [Alchemy Effect HTTP API](https://alchemy.run/cloudflare/apis/effect-http-api/), [Effect HttpApiError](https://effect.website/docs/v4/api/effect/http-api/HttpApiError), and [Effect SchemaIssue](https://effect.website/docs/v4/api/effect/SchemaIssue).
