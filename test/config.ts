import * as Config from "effect/Config";

/**
 * Enables integration-test teardown on CI and retains local resources by default.
 * Reads the test process environment, rather than creating a Worker binding.
 * Missing CI resolves to false without setting process.env.CI; the string
 * "false" is parsed as false instead of triggering cleanup through truthiness.
 * Invalid values fail configuration parsing before test hooks are registered.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/#destroy-after-tests-on-ci
 */
export const Ci = Config.Boolean("CI").pipe(Config.withDefault(false));
