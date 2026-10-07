import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as State from "alchemy/State";

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
