import { expect } from "bun:test";
import * as Test from "alchemy/Test/Bun";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { Project } from "@infra/config/project";
import {
  deploymentStage,
  makePreviewStage,
  PreviewPullRequest,
  PreviewStage,
} from "@infra/config/stages";

/**
 * Runs stage-boundary checks without credentials or cloud resources.
 */
const { test } = Test.make({ dev: true, providers: Layer.empty });

/**
 * Executes the same stage selector invoked by GitHub Actions.
 *
 * @param mode - Selects deployment output or the stricter cleanup gate.
 * @param eventName - Supplies the GitHub event context independently of the host environment.
 * @param pullRequest - Supplies the PR number, or omits it to test missing context.
 * @returns The process exit code and captured output without running Alchemy.
 */
const runStage = (mode: string, eventName: string | undefined, pullRequest: string | undefined) =>
  Bun.spawnSync([process.execPath, "tools/ci/deployment-stage.ts", mode], {
    env: { ...process.env, GITHUB_EVENT_NAME: eventName, PULL_REQUEST: pullRequest },
    stderr: "pipe",
    stdout: "pipe",
  });

test(
  "stage selection distinguishes production pushes from PR previews",
  Effect.gen(function* verifySelection() {
    expect(yield* deploymentStage(ConfigProvider.fromUnknown({ GITHUB_EVENT_NAME: "push" }))).toBe(
      Project.stages.production,
    );
    expect(
      yield* deploymentStage(
        ConfigProvider.fromUnknown({ GITHUB_EVENT_NAME: "pull_request", PULL_REQUEST: "42" }),
      ),
    ).toBe("pr-42");
    expect(yield* makePreviewStage(42)).toBe("pr-42");

    for (const [event, number] of [
      ["pull_request", undefined],
      ["pull_request", ""],
      ["pull_request", "0"],
      ["pull_request", "-1"],
      ["pull_request", "1.5"],
      ["pull_request", "9007199254740992"],
      ["pull_request", "abc"],
      ["workflow_dispatch", undefined],
      [undefined, "42"],
    ] as const) {
      const error = yield* deploymentStage(
        ConfigProvider.fromUnknown({ GITHUB_EVENT_NAME: event, PULL_REQUEST: number }),
      ).pipe(Effect.flip);
      expect(error._tag).toBe("ConfigError");
    }
  }),
);

test(
  "preview cleanup rejects production and malformed stage names",
  Effect.gen(function* verifyPreviewGate() {
    expect(yield* Schema.decodeUnknownEffect(PreviewStage)("pr-42")).toBe("pr-42");

    for (const stage of [
      Project.stages.production,
      "",
      "pr-",
      "pr-0",
      "pr-01",
      "pr--1",
      "pr-1.5",
      "pr-42-extra",
      "pr-42\n",
      " pr-42",
    ] as const) {
      const error = yield* Schema.decodeUnknownEffect(PreviewStage)(stage).pipe(Effect.flip);
      expect(error._tag).toBe("SchemaError");
    }

    for (const number of [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      9_007_199_254_740_992,
    ]) {
      const error = yield* makePreviewStage(number).pipe(Effect.flip);
      expect(error._tag).toBe("SchemaError");
    }
  }),
);

test(
  "CI stage output is emitted only after successful deployment or cleanup validation",
  Effect.sync(() => {
    for (const [mode, event, number, expected] of [
      ["deploy", "push", undefined, "stage=prod\n"],
      ["deploy", "pull_request", "42", "stage=pr-42\n"],
      ["cleanup", "pull_request", "42", "stage=pr-42\n"],
    ] as const) {
      const result = runStage(mode, event, number);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.toString()).toBe(expected);
    }

    for (const [mode, event, number] of [
      ["cleanup", "push", undefined],
      ["cleanup", "pull_request", undefined],
      ["cleanup", "pull_request", "12-extra"],
      ["deploy", "pull_request", "0"],
      ["deploy", "workflow_dispatch", "42"],
      ["invalid", "push", undefined],
    ] as const) {
      const result = runStage(mode, event, number);
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout.toString()).toBe("");
    }
  }),
);

test(
  "preview comments accept absent context but reject invalid supplied PR numbers",
  Effect.gen(function* verifyPreviewCommentConfig() {
    for (const value of [undefined, ""] as const) {
      expect(
        yield* PreviewPullRequest.parse(ConfigProvider.fromUnknown({ PULL_REQUEST: value })),
      ).toBeUndefined();
    }
    expect(
      yield* PreviewPullRequest.parse(ConfigProvider.fromUnknown({ PULL_REQUEST: "42" })),
    ).toBe(42);
    for (const value of ["0", "-1", "1.5", "9007199254740992", "abc", " "]) {
      const error = yield* PreviewPullRequest.parse(
        ConfigProvider.fromUnknown({ PULL_REQUEST: value }),
      ).pipe(Effect.flip);
      expect(error._tag).toBe("ConfigError");
    }
  }),
);
