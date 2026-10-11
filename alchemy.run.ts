import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as GitHub from "alchemy/GitHub";
import * as Layer from "effect/Layer";
import * as Output from "alchemy/Output";
import ApiWorker from "@api/app/worker";
import { PreviewPullRequest } from "@infra/config/stages";
import { Project } from "@infra/config/project";

/**
 * Provisions the Effect-native Worker defined by the API application.
 * The stack yields its resource directly, following Alchemy's HTTP API guide.
 * Cloudflare-hosted state follows tutorial part 1 and is shared across machines.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-1/#configure-state
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/#4-add-to-the-stack
 */
export default Alchemy.Stack(
  Project.stackName,
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* provisionTemplate() {
    const pullRequest = yield* PreviewPullRequest.parse(ConfigProvider.fromEnv());
    const worker = yield* ApiWorker;

    // Part 5 manages a stable preview-comment resource alongside the Worker.
    // https://alchemy.run/cloudflare/tutorial/part-5/#add-pr-preview-comments
    if (pullRequest !== undefined) {
      yield* GitHub.Comment("preview-comment", {
        body: Output.interpolate`**Preview:** ${worker.url}`,
        issueNumber: pullRequest,
        owner: Project.github.owner,
        repository: Project.github.repository,
      });
    }

    return { url: worker.url };
  }),
);
