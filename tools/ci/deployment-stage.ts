import * as ConfigProvider from "effect/ConfigProvider";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { deploymentStage, PreviewStage } from "@infra/config/stages";

/**
 * Emits a GitHub Actions stage output after validating its event context.
 * Cleanup mode additionally requires the selected stage to be a preview; failures
 * emit no stage output and stop the job before Alchemy can destroy resources.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-5/#create-the-workflow
 */
const program = Effect.gen(function* emitDeploymentStage() {
  const mode = yield* Schema.decodeUnknownEffect(Schema.Literals(["deploy", "cleanup"]))(
    process.argv[2],
  );
  const stage = yield* deploymentStage(ConfigProvider.fromEnv());

  if (mode === "cleanup") {
    yield* Schema.decodeUnknownEffect(PreviewStage)(stage);
  }

  yield* Console.log(`stage=${stage}`);
});

await Effect.runPromise(program);
