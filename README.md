# cloudflare-monorepo-template

Minimal Bun workspace with Alchemy, Cloudflare Workers, Effect v4, and Vite Plus.

Start with [the onboarding guide](docs/onboarding.md) for the architecture, source map, development workflows, and native-capability review. [The documentation index](docs/README.md) links the focused guides; agents also follow [AGENTS.md](AGENTS.md).

```sh
bun install --frozen-lockfile
bun run build
bun run dev
bun run check
bun run build
bun test apps infra
```

`apps/web` contains a replaceable frontend scaffold; its current implementation does not establish the long-term frontend architecture. See [temporary frontend](docs/onboarding.md#temporary-frontend) before extending it. `apps/api` owns the Effect HTTP API. The root `alchemy.run.ts` defines the application deployment stack and yields the Effect-native API Worker, which currently serves the built frontend assets.

Lint uses Ultracite Core and anti-slop plus a repository rule forbidding built-in try/catch. Repo-local skills cover Effect design, observability, error messages, code documentation, and atomic conventional commits; documentation is not enforced by lint.

## Local Worker tests

Build frontend assets with `bun run build` before running `bun test apps`.
Tests start the actual API Worker in local workerd through Alchemy's
Effect-aware `Test.make({ dev: true })` harness. An isolated test stack,
`test-local` stage, and local state keep them separate from application dev
resources; cleanup destroys the local test stack after the suite.
No Cloudflare account or cloud deployment is required. The Worker compatibility
date matches the newest date supported by the pinned local workerd runtime.

The tests cover health, unsupported requests, OpenAPI, Scalar, discovery, validation, and built
frontend asset routing. `bun test apps infra` also checks stage selection and preview
cleanup validation without deploying resources. Cloud integration tests remain a separate command.

## Cloud integration tests

Cloud integration tests explicitly deploy the real Worker from the dedicated `infra/stacks/integration.ts` stack. After Cloudflare account setup and authorization to deploy test resources, build and choose a unique isolated stage:

```sh
bun run build
ALCHEMY_TEST_STAGE=test-readme-1 bun run test:integration
```

The harness requires `ALCHEMY_TEST_STAGE`, not `ALCHEMY_STAGE`. Use a different `test-…` stage for concurrent runs. Teardown always attempts to destroy the test stack in local runs and CI, including after setup or assertion failures; cleanup errors fail the run. Interrupted processes can leave resources behind. Follow [test isolation and recovery](docs/alchemy/cloudflare/testing.md) using the same dedicated stack and logged stage. Cloud tests create real resources; they are separate from local checks.

Following [tutorial part 1](https://alchemy.run/cloudflare/tutorial/part-1/), the stack and test harness both use `Cloudflare.state()`. The first plan, deploy, or dev command requests permission to bootstrap the Cloudflare state-store Worker and its supporting resources. Authenticate using `bun run alchemy profile`; confirm the intended Cloudflare account during setup. Deployment and account verification have not yet been completed. The tutorial's sample R2 bucket is omitted until an application feature needs storage.

CI checks and gated deployment/preview jobs follow [Part 5](docs/alchemy/cloudflare/ci-cd.md). Cloud jobs skip when both deployment secrets are absent; provisioning both secrets enables them. Partial configuration fails. Native Cloudflare logs and traces are already wired through Alchemy; see [observability](docs/alchemy/cloudflare/observability.md). Cloud ingestion remains unverified. No cloud deployments are performed during the basic local checks.

Versions are pinned, including the Alchemy v2 beta. No dependency release-age policy is configured.

Statement spacing inserts blank lines between top-level declarations and calls, between a local call group and a following const declaration, before returns, after complete if/else statements, and after Effect logs. Logs remain beneath the operations they describe.

API features live under `apps/api/src/features/<feature>/`, with contracts in `api.ts` and handlers in `handlers.ts`. `src/app/` owns application assembly: `api.ts` composes contracts, `http.ts` provides handlers and documentation, and `worker.ts` wires the runtime. Whole-app Worker tests live under `apps/api/tests/`; focused tests stay beside their implementation. Add `src/platform/` for concrete runtime integrations when needed. `GET /api/healthz` is the reference liveness endpoint. Unmatched requests use Effect’s built-in `HttpServerError.RouteNotFound` (empty HTTP 404); expected feature failures should be declared in endpoint error schemas. The HTTP API modules in the pinned Effect version are marked unstable upstream.

Production follows [Alchemy’s Effect HTTP API guide](https://alchemy.run/cloudflare/apis/effect-http-api/): `Cloudflare.Worker` construction returns an HTTP effect from `HttpRouter.toHttpEffect`. The guide’s platform stub includes the additional compression fields required by the pinned Effect version. `bun run build` builds frontend assets; Alchemy builds the Worker during dev/deploy. `bun run dev:web` runs frontend-only Vite development. There is no separate Wrangler configuration or Cloudflare Vite plugin.
