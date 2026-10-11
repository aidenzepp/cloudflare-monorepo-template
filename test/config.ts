import * as Config from "effect/Config";
import { IntegrationStage } from "@infra/config/stages";

/**
 * Requires an explicit isolated stage before cloud test hooks are registered.
 * No user-name fallback can silently reuse another run's resources. Both deploy
 * and destroy receive this same parsed value through the test harness.
 *
 * @see https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/src/Test/Core.ts
 */
export const IntegrationTestStage = Config.schema(IntegrationStage, "ALCHEMY_TEST_STAGE");
