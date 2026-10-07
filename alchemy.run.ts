import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as State from "alchemy/State";
import ApiWorker from "./apps/api/src/worker";

/**
 * Provisions the Effect-native Worker defined by the API application.
 * The stack yields its resource directly, following Alchemy's HTTP API guide.
 * Local state supports this starter until shared CI state is configured.
 *
 * @see https://alchemy.run/cloudflare/apis/effect-http-api/#4-add-to-the-stack
 */
export default Alchemy.Stack(
  "cloudflare-monorepo-template",
  { providers: Cloudflare.providers(), state: State.localState() },
  Effect.gen(function* provisionTemplate() {
    const worker = yield* ApiWorker;

    return { url: worker.url };
  }),
);
