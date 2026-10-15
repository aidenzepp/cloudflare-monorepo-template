import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Stage } from "alchemy/Stage";
import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import ApiWorker from "@api/app/worker";
import { Project } from "@infra/config/project";
import { IntegrationStage } from "@infra/config/stages";

/**
 * Deploys the real application Worker under a dedicated cloud-test identity.
 * Its state namespace is separate from application and local-test stacks, and it
 * creates no GitHub preview comments. Validate the actual Alchemy stage during
 * evaluation so direct CLI deployment and destruction share the test-stage guard.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/
 */
export default Alchemy.Stack(
  `${Project.stackName}-integration-tests`,
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* provisionIntegrationStack() {
    yield* Config.schema(IntegrationStage).parse(ConfigProvider.fromUnknown(yield* Stage));

    const worker = yield* ApiWorker;

    return { url: worker.url };
  }),
);
