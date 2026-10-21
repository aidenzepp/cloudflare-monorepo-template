import { expect, test } from "bun:test";
import { kebabCaseViolations } from "./kebab-case-paths.mjs";

test("allows kebab-case directories", () => {
  expect(kebabCaseViolations("apps/api/src/server/healthz/http.ts")).toEqual([]);
  expect(kebabCaseViolations("apps/api/src/platform/http/validation/middleware.test.ts")).toEqual(
    [],
  );
  expect(kebabCaseViolations("alchemy.run.ts")).toEqual([]);
  expect(kebabCaseViolations("tools/no-built-in-try-catch.mjs")).toEqual([]);
});

test("reports PascalCase, camelCase, and snake_case directories", () => {
  expect(kebabCaseViolations("apps/api/src/server/Users/http.ts")).toEqual(["Users"]);
  expect(kebabCaseViolations("apps/api/src/server/httpHandlers/http.ts")).toEqual(["httpHandlers"]);
  expect(kebabCaseViolations("apps/api/src/health_check/http.ts")).toEqual(["health_check"]);
});

test("leaves filenames to unicorn/filename-case", () => {
  expect(kebabCaseViolations("apps/api/src/api/HealthzApi.ts")).toEqual([]);
  expect(kebabCaseViolations("apps/api/src/server/httpHandlers.ts")).toEqual([]);
});

test("ignores dependency and virtual paths", () => {
  expect(kebabCaseViolations("node_modules/effect/AGENTS.md")).toEqual([]);
  expect(kebabCaseViolations("<input>")).toEqual([]);
  expect(kebabCaseViolations("")).toEqual([]);
});
