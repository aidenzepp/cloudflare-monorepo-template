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
 * Validates the GitHub event context used to select a deployment stage.
 * A pull-request event requires a PR number; only push events select production.
 */
const DeploymentEvent = Schema.Union([
  Schema.Struct({ eventName: Schema.Literal("push") }),
  Schema.Struct({
    eventName: Schema.Literal("pull_request"),
    pullRequest: Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThan(0)),
  }),
]);

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
 * @param eventName - GitHub's event name; unsupported or absent events fail validation.
 * @param pullRequest - GitHub's PR number text, required for pull-request events.
 * @returns The configured production stage or validated preview stage.
 */
export const deploymentStage = Effect.fnUntraced(function* deploymentStage(
  eventName: string | undefined,
  pullRequest?: string,
) {
  const event = yield* Schema.decodeUnknownEffect(DeploymentEvent)({ eventName, pullRequest });

  return event.eventName === "push"
    ? Project.stages.production
    : yield* makePreviewStage(event.pullRequest);
});
