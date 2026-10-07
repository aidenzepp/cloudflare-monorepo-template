import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as State from "alchemy/State";

/**
 * Provisions the built API Worker and frontend assets as one deployment stack.
 * Local state supports this starter; shared CI state is configured in the tutorial.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-2/
 */
export default Alchemy.Stack(
  "cloudflare-monorepo-template",
  { providers: Cloudflare.providers(), state: State.localState() },
  Effect.gen(function* provisionTemplate() {
    const worker = yield* Cloudflare.Worker("Api", {
      assets: { directory: "./dist/client", runWorkerFirst: ["/api/*"] },
      bundle: false,
      compatibility: { date: "2026-10-06" },
      main: "./dist/template_local/index.js",
    });

    return { url: worker.url };
  }),
);
