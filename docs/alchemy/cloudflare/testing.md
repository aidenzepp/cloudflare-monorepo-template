# Cloud integration tests

Local tests (`bun test apps infra`) use workerd and do not deploy cloud resources. Cloud integration tests are explicitly invoked and deploy the real API Worker from `infra/stacks/integration.ts`. Its stack name derives from `Project.stackName` with `-integration-tests`, separating its state and resources from the application stack. It creates no GitHub preview comments.

## Run and clean up

After Cloudflare account setup and authorization to deploy test resources:

```sh
bun run build
ALCHEMY_TEST_STAGE=test-123 bun run test:integration
```

Choose a unique stage for each concurrent run, such as `test-<run-id>-<attempt>`. Never share a stage between concurrent processes: one could destroy the other's resources. Config requires a stage beginning with `test-`, followed by lowercase letters, digits, and internal hyphens. Missing, empty, production, development, and PR-preview stages fail before deployment hooks are registered. The stack also validates the actual Alchemy stage during evaluation.

The pinned Alchemy harness reads `ALCHEMY_TEST_STAGE`, not `ALCHEMY_STAGE`. The parsed stage is explicitly passed to the harness for both deploy and destroy. Setup waits for HTTP readiness before assertions run. An unconditional `afterAll` destroys the stack in both local runs and CI, including after assertion or setup failures. Cleanup errors fail the test run rather than being ignored.

This follows [Alchemy Part 3](https://alchemy.run/cloudflare/tutorial/part-3/), with deliberate differences: a dedicated test stack, required validated stage, and teardown locally as well as in CI. Stage and hook behavior were checked against [pinned Core.ts](https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/src/Test/Core.ts) and [Bun.ts](https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/src/Test/Bun.ts).

## CI gate

The deployment workflow runs this suite after local checks on main pushes and active same-repository PRs when both Cloudflare secrets are configured. It assigns `test-ci-${{ github.run_id }}-${{ github.run_attempt }}` and requires the integration job to succeed before application deployment. See [CI/CD](ci-cd.md).

## Interrupted runs

Forced process termination, network outages, or provider deletion failures can leave resources behind. Keep the logged stage name and use the same test stack and stage for recovery; do not remove its Alchemy state before cleanup succeeds. Rerunning the suite with that same stage reconciles the resources and attempts teardown again. Do this only after the previous process has stopped.

Cleanup removes resources managed by the test stack. Cloudflare-hosted Alchemy state infrastructure is shared infrastructure and remains in place. Future storage fixtures need their own deliberate disposal policy; the test stack adds no storage, database, or authentication.
