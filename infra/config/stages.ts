import * as Config from "effect/Config";
import type * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Regex from "effect/RegExp";
import * as Schema from "effect/Schema";
import { Project } from "@infra/config/project";

/**
 * Recognizes complete PR preview stage names using their configured prefix.
 * Creation and cleanup share this schema; production cannot pass its validation.
 */
export const PreviewStage = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isPattern(new RegExp(`^${Regex.escape(Project.stages.previewPrefix)}[1-9][0-9]*$`, "u"), {
    message: "Expected a preview stage formed from the configured prefix and a positive PR number.",
  }),
);

/**
 * Accepts GitHub PR numbers as positive safe integers.
 */
const PullRequestNumber = Schema.Int.check(Schema.isGreaterThan(0));

/**
 * Decodes GitHub's environment representation as a positive safe PR number.
 */
const PullRequestFromString = Schema.NumberFromString.check(
  Schema.isInt(),
  Schema.isGreaterThan(0),
);

/**
 * Reads the optional preview-comment target. GitHub supplies an empty string on
 * pushes; missing and empty values both omit the comment, while invalid numbers fail.
 */
export const PreviewPullRequest = Config.schema(
  Schema.Union([Schema.Literal(""), PullRequestFromString]),
  "PULL_REQUEST",
).pipe(
  Config.withDefault(""),
  Config.map((value) => (value === "" ? undefined : value)),
);

/**
 * Validates the GitHub event context used to select a deployment stage.
 * A pull-request event requires a PR number; only push events select production.
 */
const DeploymentEvent = Config.schema(
  Schema.Union([
    Schema.Struct({ GITHUB_EVENT_NAME: Schema.Literal("push") }),
    Schema.Struct({
      GITHUB_EVENT_NAME: Schema.Literal("pull_request"),
      PULL_REQUEST: PullRequestFromString,
    }),
  ]),
);

/**
 * Creates a preview name accepted by the shared cleanup schema.
 *
 * @param pullRequest - The GitHub PR number, validated as a positive safe integer.
 * @returns The validated preview stage, or a schema failure for an invalid number.
 */
export const makePreviewStage = Effect.fnUntraced(function* makePreviewStage(pullRequest: number) {
  const number = yield* Schema.decodeUnknownEffect(PullRequestNumber)(pullRequest);

  return yield* Schema.decodeUnknownEffect(PreviewStage)(
    `${Project.stages.previewPrefix}${number}`,
  );
});

/**
 * Selects production for push events and a validated preview for PR events.
 *
 * @param provider - Supplies process configuration or isolated values in tests.
 * @returns The configured production stage or validated preview stage.
 */
export const deploymentStage = Effect.fnUntraced(function* deploymentStage(
  provider: ConfigProvider.ConfigProvider,
) {
  const event = yield* DeploymentEvent.parse(provider);

  return event.GITHUB_EVENT_NAME === "push"
    ? Project.stages.production
    : yield* makePreviewStage(event.PULL_REQUEST);
});
