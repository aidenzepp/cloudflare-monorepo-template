import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import ApiWorker from "./apps/api/src/worker";

/**
 * Provisions the Effect-native Worker defined by the API application.
 * The stack yields its resource directly, following Alchemy's HTTP API guide.
 * Cloudflare-hosted state follows tutorial part 1 and is shared across machines.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-1/#configure-state
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/#4-add-to-the-stack
 */
export default Alchemy.Stack(
  "cloudflare-monorepo-template",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* provisionTemplate() {
    const worker = yield* ApiWorker;

    return { url: worker.url };
  }),
);
