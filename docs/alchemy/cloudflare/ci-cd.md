# CI/CD

Follow [Alchemy tutorial Part 5](https://alchemy.run/cloudflare/tutorial/part-5/) for the credential stack, remote state, deployment workflow, and preview comments.

## Repository setup

- `.github/workflows/deploy.yml` runs formatting, lint, types, HTTP tests, and the frontend build on pushes to main and active PRs.
- `stacks/github.ts` declares a scoped Cloudflare token and the two GitHub Actions secrets. It is a separate admin operation, not part of normal app deployment.
- `alchemy.run.ts` declares the preview comment resource when `PULL_REQUEST` is supplied. Both Cloudflare and GitHub providers are composed with `Layer.mergeAll`.
- `test/config.ts` remains test-owned. The workflow itself gets its CI context from GitHub Actions, so it does not need to import this file.

## Cloud deployment is deferred

The deploy and cleanup jobs require the repository variable `CLOUDFLARE_DEPLOY_ENABLED` to equal `true`. It is unset initially. Checking in this workflow enables local-code checks, while cloud jobs remain skipped.

When account setup is authorized, follow the tutorial's admin-profile instructions, confirm the account and repository, and explicitly deploy `stacks/github.ts`. Its current token permissions cover Workers and the state store; review permissions against the resources being deployed. Then enable the repository variable. None of these account or secret operations have been performed.

Once enabled, main deploys to `prod`; same-repository PRs deploy to `pr-<number>` and receive a preview comment. Closing a PR destroys its preview stage. Fork PRs receive checks only. Cleanup uses main's stack definition and rejects non-preview stages; concurrency groups serialize deployment and cleanup for the same PR.

The workflow pins Bun to our package-manager version, installs the frozen lockfile, and builds frontend assets before Alchemy deploy or destroy. Cloud integration tests are not part of this initial workflow; its tests are the account-free HTTP tests. Cloud permissions, previews, comments, and destruction remain unverified until account setup.

## Configuration boundaries

GitHub's workflow `env` values configure processes running in its jobs. More specific job or step values override the same variable from a wider workflow scope. They do not become Worker bindings automatically.

Effect configuration definitions and provider precedence are described in [configuration composition](../configuration.md). Keep test cleanup configuration separate from deployment stage selection: `CI=true` does not mean `prod`.
