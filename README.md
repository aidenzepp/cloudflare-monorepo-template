# cloudflare-monorepo-template

Minimal Bun workspace with Alchemy, Cloudflare Workers, Effect v4, and Vite Plus.

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun test apps
bun run build
```

`apps/web` is the frontend entry point; `apps/api` owns the Worker and health endpoint. The initial frontend is plain HTML; React, routing, and UI components can be added intentionally in the next step. One root Alchemy stack deploys the build.

Lint uses Ultracite Core and anti-slop plus a repository rule forbidding built-in try/catch. Skills include conventional-commits and document-code; documentation is not enforced by lint.

## Cloud integration tests

Following [Alchemy tutorial part 3](https://alchemy.run/cloudflare/tutorial/part-3/), tests use `alchemy/Test/Bun` to deploy a stack, assert against its live URL, and destroy it afterward. Authenticate with Cloudflare first, build, then run:

```sh
ALCHEMY_STAGE=test-unique-name bun run test:integration
```

This creates billable cloud resources. Local Alchemy state is ignored by Git; durable shared CI state, preview automation, and observability will be added through the tutorial. No cloud deployments are performed during the basic local checks.

Versions are pinned, including the Alchemy v2 beta. No dependency release-age policy is configured.
