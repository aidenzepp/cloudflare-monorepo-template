# CI/CD

Follow [Alchemy tutorial Part 5](https://alchemy.run/cloudflare/tutorial/part-5/) for the credential stack, remote state, deployment workflow, and preview comments.

## Repository setup

- `.github/workflows/deploy.yml` runs formatting, lint, types, HTTP tests, and the frontend build on pushes to main and active PRs.
- `.github/actions/setup/action.yml` owns the pinned Bun setup and frozen dependency installation shared by checks, integration, deployment, and cleanup. Each job checks out its intended revision before invoking the local action. Job dependencies, conditions, permissions, and concurrency remain in the workflow.
- `infra/config/project.ts` owns the shared GitHub owner/repository, application stack identity, production stage, and preview prefix.
- `infra/stacks/github.ts` declares a scoped Cloudflare token and the two GitHub Actions secrets. It is a separate admin operation, not part of normal app deployment.
- Root `alchemy.run.ts` defines the application stack and declares the preview comment resource when `PULL_REQUEST` is supplied. Both Cloudflare and GitHub providers are composed with `Layer.mergeAll`.
- `test/config.ts` remains test-owned. The workflow itself gets its CI context from GitHub Actions, so it does not need to import this file.

## Cloud deployment is deferred

A credential-check job determines whether both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are available to the workflow. Neither present means cloud jobs skip; both present means cloud jobs may run; only one present fails configuration. The check outputs only a boolean and never prints secrets. This presence check is our template adaptation, not an authentication test. Invalid credentials fail when Alchemy uses them. Local-code checks run independently.

Provisioning both secrets enables cloud operations on the next qualifying event, including production deployment on a push to main. No separate deployment-enable variable is required.

When account setup is authorized, follow the tutorial's admin-profile instructions, confirm the account and repository, and explicitly deploy `infra/stacks/github.ts`. Its current token permissions cover Workers and the state store; review permissions against the resources being deployed. None of these account or secret operations have been performed.

`infra/config/stages.ts` derives and validates preview names from `Project.stages.previewPrefix`. GitHub Actions calls `tools/ci/deployment-stage.ts deploy` to emit its stage output: push events select `Project.stages.production`, while PR events require a positive safe-integer PR number. Missing PR numbers and unsupported events fail before deployment. The workflow passes the resulting step output to Alchemy.

Cleanup calls the same helper in `cleanup` mode, which additionally validates the result against `PreviewStage` before emitting any output. The schema rejects production, zero/negative PR numbers, leading zeros, whitespace, and suffixes such as `pr-12-extra`. Cleanup still checks out main, uses the application stack there, and keeps the existing same-repository and concurrency guards.

When credentials are available, main deploys to `prod`; same-repository PRs deploy to `pr-<number>` and receive a preview comment. Closing a PR destroys its preview stage. Fork PRs receive checks only. Cleanup uses main's stack definition and rejects non-preview stages; concurrency groups serialize deployment and cleanup for the same PR.

The workflow pins Bun to our package-manager version, installs the frozen lockfile, and builds frontend assets before Alchemy deploy or destroy. The account-free HTTP, stage-selection, and tools tests run with `bun test apps infra tools`. Stage tests also execute the CI helper and confirm rejected cleanup contexts emit no output; they never invoke Alchemy deployment or destruction.

## Cloud integration gate

After local checks pass, the `integration` job builds the assets and runs `bun run test:integration` on main pushes and active same-repository PRs when both Cloudflare secrets are available. Fork PRs, closed PRs, and repositories without cloud credentials skip this job. Its stage is `test-ci-${{ github.run_id }}-${{ github.run_attempt }}`, separating concurrent runs and rerun attempts. The dedicated test stack verifies the deployed health endpoint and attempts teardown before the job finishes; cleanup failures also fail the job.

The `deploy` job depends on `integration`, so failed or skipped integration jobs block app deployment. There is no `continue-on-error` or status-condition override. This follows [GitHub's job dependency semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds). PR-close cleanup depends only on the credential check so it can still remove previews without running integration tests.

The integration job has a ten-minute timeout. Forced cancellation or timeout may interrupt teardown; recover with the logged stage using [the test recovery instructions](testing.md). Cloud permissions, deployment, and provider deletion remain unverified until account setup and an actual cloud run.

## Configuration boundaries

GitHub's workflow `env` values configure processes running in its jobs. More specific job or step values override the same variable from a wider workflow scope. They do not become Worker bindings automatically.

Effect configuration definitions and provider precedence are described in [configuration composition](../configuration.md). Cloud integration tests require their own validated `ALCHEMY_TEST_STAGE` and always clean up locally and in CI. This is separate from application deployment stage selection; see [test isolation and cleanup](testing.md).
