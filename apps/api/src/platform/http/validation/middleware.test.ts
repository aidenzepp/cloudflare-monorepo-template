import { expect } from "bun:test";
import * as Test from "alchemy/Test/Bun";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Schema from "effect/Schema";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Etag from "effect/http/Etag";
import * as HttpRouter from "effect/http/HttpRouter";
import * as HttpApi from "effect/http-api/HttpApi";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import * as HttpApiSchema from "effect/http-api/HttpApiSchema";
import * as OpenApi from "effect/http-api/OpenApi";
import { HttpPlatformStub } from "@api/app/worker";
import { RequestValidationError } from "@api/platform/http/validation/error";
import { ValidationResponses } from "@api/platform/http/validation/middleware";

/**
 * Runs focused HTTP boundary checks in Alchemy's Effect-aware local harness.
 */
const { test } = Test.make({ dev: true, providers: Layer.empty });

/**
 * Exercises request decoding and response encoding without adding public routes.
 */
const FixtureApi = HttpApi.make("validation-test").add(
  HttpApiGroup.make("fixture").add(
    HttpApiEndpoint.post("input", "/items/:id", {
      error: RequestValidationError,
      headers: { "x-mode": Schema.Literal("active") },
      params: { id: Schema.String.check(Schema.isUUID()) },
      payload: Schema.Struct({
        name: Schema.String.annotate({ message: "Name must be text." })
          .check(Schema.isMinLength(3, { message: "Enter a name with at least 3 characters." }))
          .pipe(Schema.annotateKey({ messageMissingKey: "Provide a name." })),
      }),
      query: { count: Schema.NumberFromString.check(Schema.isGreaterThan(0)) },
      success: Schema.String,
    }),
    HttpApiEndpoint.get("body", "/invalid-body", { success: Schema.NonEmptyString }),
    HttpApiEndpoint.get("headers", "/invalid-headers", {
      success: HttpApiSchema.WithHeaders(Schema.String, { "x-result": Schema.NonEmptyString }),
    }),
    HttpApiEndpoint.get("defect", "/defect", { success: Schema.String }),
  ),
);

/**
 * Creates a disposable HTTP fixture and counts calls past request validation.
 * Filesystem emulation is limited to this in-memory test adapter; production
 * continues using Alchemy's Worker runtime and asset bindings.
 *
 * @returns A scoped web handler and its successful input-handler call counter.
 */
const makeFixture = Effect.fnUntraced(function* makeFixture() {
  const calls = yield* Ref.make(0);
  const handlers = HttpApiBuilder.group(FixtureApi, "fixture", (group) =>
    group
      .handle("input", () => Ref.update(calls, (count) => count + 1).pipe(Effect.as("accepted")))
      .handle("body", () => Effect.succeed(""))
      .handle("headers", () =>
        Effect.succeed(HttpApiSchema.withHeaders({ body: "ok", headers: { "x-result": "" } })),
      )
      .handle("defect", () => Effect.die(new Error("Private diagnostic must not reach callers"))),
  );
  const app = yield* Effect.acquireRelease(
    Effect.sync(() =>
      HttpRouter.toWebHandler(
        Layer.mergeAll(
          HttpApiBuilder.layer(FixtureApi).pipe(Layer.provide(handlers)),
          ValidationResponses,
        ).pipe(Layer.provide([HttpPlatformStub, Etag.layer, Path.layer, FileSystem.layerNoop({})])),
        { disableLogger: true },
      ),
    ),
    (handler) => Effect.promise(() => handler.dispose()),
  );

  return { app, calls };
});

test(
  "request validation explains params, headers, query and payload before handlers run",
  Effect.gen(function* verifyRequests() {
    const { app, calls } = yield* makeFixture();
    const validId = "123e4567-e89b-42d3-a456-426614174000";
    const cases = [
      { body: '{"name":"valid"}', count: "1", id: "abc", mode: "active", path: ["id"] },
      { body: '{"name":"valid"}', count: "1", id: validId, mode: "invalid", path: ["x-mode"] },
      { body: '{"name":"valid"}', count: "0", id: validId, mode: "active", path: ["count"] },
      { body: '{"name":""}', count: "1", id: validId, mode: "active", path: ["name"] },
      { body: "{", count: "1", id: validId, mode: "active", path: [] },
      { body: "", count: "1", id: validId, mode: "active", path: [] },
    ];

    for (const input of cases) {
      const response = yield* Effect.tryPromise(() =>
        app.handler(
          new Request(`http://localhost/items/${input.id}?count=${input.count}`, {
            body: input.body,
            headers: { "content-type": "application/json", "x-mode": input.mode },
            method: "POST",
          }),
        ),
      );
      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");

      const body = yield* Effect.tryPromise(() => response.json());
      const error = yield* Schema.decodeUnknownEffect(RequestValidationError)(body);
      expect(error._tag).toBe("RequestValidationError");
      expect(error.message).toBe("Request validation failed.");
      expect(error.details[0].path).toEqual(input.path);
      expect(error.details[0].message.length).toBeGreaterThan(0);
    }

    expect(yield* Ref.get(calls)).toBe(0);

    const response = yield* Effect.tryPromise(() =>
      app.handler(
        new Request(`http://localhost/items/${validId}?count=1`, {
          body: '{"name":"valid"}',
          headers: { "content-type": "application/json", "x-mode": "active" },
          method: "POST",
        }),
      ),
    );
    expect(response.status).toBe(200);
    expect(yield* Effect.tryPromise(() => response.json())).toBe("accepted");
    expect(yield* Ref.get(calls)).toBe(1);
  }).pipe(Effect.scoped),
);

test(
  "custom schema messages reach callers unchanged with their field paths",
  Effect.gen(function* verifyCustomMessages() {
    const { app } = yield* makeFixture();
    const cases = [
      { body: '{"name":"ab"}', message: "Enter a name with at least 3 characters." },
      { body: '{"name":123}', message: "Name must be text." },
      { body: "{}", message: "Provide a name." },
    ];

    for (const input of cases) {
      const response = yield* Effect.tryPromise(() =>
        app.handler(
          new Request("http://localhost/items/123e4567-e89b-42d3-a456-426614174000?count=1", {
            body: input.body,
            headers: { "content-type": "application/json", "x-mode": "active" },
            method: "POST",
          }),
        ),
      );
      expect(response.status).toBe(400);

      const body = yield* Effect.tryPromise(() => response.json());
      const error = yield* Schema.decodeUnknownEffect(RequestValidationError)(body);
      expect(error.details).toEqual([{ message: input.message, path: ["name"] }]);
    }
  }).pipe(Effect.scoped),
);

test(
  "response encoding failures and unrelated defects remain server errors",
  Effect.gen(function* verifyServerFailures() {
    const { app } = yield* makeFixture();

    for (const path of ["/invalid-body", "/invalid-headers", "/defect"]) {
      const response = yield* Effect.tryPromise(() =>
        app.handler(new Request(`http://localhost${path}`)),
      );
      expect(response.status).toBe(500);

      const text = yield* Effect.tryPromise(() => response.text());
      expect(text).not.toContain("RequestValidationError");
      expect(text).not.toContain("Private diagnostic");

      if (path !== "/defect") {
        expect(JSON.parse(text)).toEqual({ message: "The server could not encode its response." });
      }
    }
  }).pipe(Effect.scoped),
);

test(
  "validated endpoint contracts expose the caller error in OpenAPI",
  Effect.sync(() => {
    const spec = OpenApi.fromApi(FixtureApi);
    const response = spec.paths["/items/{id}"].post?.responses["400"];
    expect(response?.content?.["application/json"]?.schema).toEqual({
      $ref: "#/components/schemas/RequestValidationErrorEncoded",
    });
    expect(spec.components.schemas.RequestValidationErrorEncoded.required).toContain("details");
  }),
);
