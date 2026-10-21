import { expect, test } from "bun:test";
import apiSourceRoles, { apiSourceRoleViolations } from "./api-source-roles.mjs";

test("allows the API source roles", () => {
  expect(apiSourceRoleViolations("apps/api/src/api/healthz.ts")).toEqual([]);
  expect(apiSourceRoleViolations("apps/api/src/server/healthz/http.ts")).toEqual([]);
  expect(
    apiSourceRoleViolations("apps/api/src/platform/http/validation/middleware.test.ts"),
  ).toEqual([]);
  expect(apiSourceRoleViolations("apps/api/src/domain/user.ts")).toEqual([]);
});

test("reports a directory that is not a role", () => {
  expect(apiSourceRoleViolations("apps/api/src/features/healthz/http.ts")).toEqual(["features"]);
  expect(apiSourceRoleViolations("apps/api/src/app/worker.ts")).toEqual(["app"]);
});

test("reports a file placed directly in src", () => {
  expect(apiSourceRoleViolations("apps/api/src/worker.ts")).toEqual(["worker.ts"]);
});

test("points the repair at the local ruling and Effect's guide", () => {
  expect(apiSourceRoles.meta.messages.apiSourceRole).toBe(
    "Move {{segment}} under api, server, platform, or domain. This repo's Effect source layout and its exceptions are in .agents/skills/effect-design/SKILL.md, which follows node_modules/effect/AGENTS.md.",
  );
});

test("ignores paths outside apps/api/src", () => {
  expect(apiSourceRoleViolations("apps/api/tests/worker.test.ts")).toEqual([]);
  expect(apiSourceRoleViolations("apps/api/scripts/export-openapi.ts")).toEqual([]);
  expect(apiSourceRoleViolations("apps/web/src/main.ts")).toEqual([]);
  expect(apiSourceRoleViolations("infra/stacks/integration.ts")).toEqual([]);
  expect(apiSourceRoleViolations("<input>")).toEqual([]);
  expect(apiSourceRoleViolations("")).toEqual([]);
});
