import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { IntegrationStage } from "@infra/config/stages";

/**
 * Requires an explicit isolated stage before cloud test hooks are registered.
 * No user-name fallback can silently reuse another run's resources. Both deploy
 * and destroy receive this same parsed value through the test harness.
 *
 * @see https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/src/Test/Core.ts
 */
export const IntegrationTestStage = Config.schema(IntegrationStage, "ALCHEMY_TEST_STAGE");

/**
 * Rejects overrides that would change a suite's declared local or cloud mode.
 * Alchemy prioritizes ALCHEMY_TEST_DEV over an explicit dev option, so parse this
 * guard before Test.make and pass its result as dev. That explicit option also
 * prevents ALCHEMY_DEV from changing the mode when the test override is absent.
 *
 * @param dev Whether this suite must use local emulation rather than cloud providers.
 * @returns Configuration accepting an absent or matching override and rejecting conflicts.
 * @see https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/src/Test/Core.ts
 */
export const testMode = (dev: boolean) =>
  Config.Boolean("ALCHEMY_TEST_DEV").pipe(
    Config.mapEffect((value) =>
      Schema.decodeUnknownEffect(
        Schema.Literal(dev).annotate({
          message: `This suite requires ${dev ? "local emulation" : "real Cloudflare resources"}. Unset ALCHEMY_TEST_DEV or set it to ${dev}. No test resources were started.`,
        }),
      )(value).pipe(Effect.mapError((cause) => new Config.ConfigError(cause))),
    ),
    Config.withDefault(dev),
  );
