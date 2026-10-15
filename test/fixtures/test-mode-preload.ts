import { mock } from "bun:test";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";

/**
 * Records the suite's selected mode and stops before any Alchemy hooks register.
 * Only subprocess mode-boundary tests load this fixture; providers never execute.
 *
 * @param options The configuration passed by the actual suite to Test.make.
 * @returns Never completes because the setup sentinel terminates module evaluation.
 */
const interceptSetup = (options: { dev?: boolean }) => {
  Effect.runSync(Console.log(JSON.stringify({ dev: options.dev })));

  return Effect.runSync(Effect.die("Test setup intercepted before provisioning."));
};

await mock.module("alchemy/Test/Bun", () => ({ make: interceptSetup }));
