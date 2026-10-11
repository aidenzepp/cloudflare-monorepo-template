# Agent instructions

Start with `docs/onboarding.md` when entering this repository. Follow its source map to the files and focused guides relevant to the task before making changes.

Use `.agents/skills/conventional-commits/SKILL.md` when committing and `.agents/skills/document-code/SKILL.md` when writing or reviewing code.

Use Effect error channels; built-in try/catch is prohibited by lint. Do not add function-decomposition, type-design, require-doc-comment, or Shadcn lint policies.

Run `bun run check`, `bun run build`, then `bun test apps infra` before completing implementation. Local Worker tests use Alchemy’s Effect-aware harness, workerd, isolated local state, and automatic cleanup; build assets before running them. Cloud integration tests deploy real resources: build first, select an explicit isolated `test-…` stage with `ALCHEMY_TEST_STAGE`, and invoke `bun run test:integration` explicitly. Never use production for tests. Cloud tests use `infra/stacks/integration.ts` and always destroy their test stack locally and in CI; see `docs/alchemy/cloudflare/testing.md`.

Follow Alchemy’s documented Effect-native Worker construction and HTTP API patterns. Link the owning guide in code. Do not introduce a standalone fetch adapter or no-op filesystem into production; document any version-required deviations.

Before implementing Alchemy/Cloudflare features, read `docs/alchemy/cloudflare/README.md` and its relevant upstream guide.

Use supported Alchemy, Effect, and Cloudflare capabilities before building custom equivalents. Apply the native-capability review in `.agents/skills/effect-design/SKILL.md` to infrastructure, runtime integrations, streams, service dependencies, HTTP clients, concurrency, retries, and resource cleanup. Inspect installed APIs and relevant companion integrations; do not infer absence from one failed symbol search. In the implementation handoff, name the native capabilities selected and justify any custom glue with the verified gap it fills.

## Learning more about Effect

Before writing Effect code, read `node_modules/effect/AGENTS.md` completely and follow its relevant links. For APIs not covered there, consult `node_modules/effect/src` matching the installed version.

Preserve the pinned dependency versions and this repository's Alchemy/Bun testing conventions when applying upstream guidance.

Use `.agents/skills/effect-design/SKILL.md` when writing or reviewing Effect code and derived API/configuration composition. Read its labeled examples before applying its guidance.

Use `.agents/skills/trace-effect/SKILL.md` when adding or changing effectful application operations or reviewing their observability. Maximize useful tracing and logging across meaningful operations, including database queries and external requests, to diagnose failures and inefficiencies. Review coverage without generating tests for every span or log message.

Use `.agents/skills/error-messages/SKILL.md` when adding or changing caller-facing errors. For Effect HTTP APIs, use schema-backed tagged errors declared in endpoint contracts; the skill’s generic payload examples do not require a separate error envelope.

Keep request constraints in endpoint schemas. For endpoints with validated inputs, declare `RequestValidationError` from `@api/platform/http/validation/error` in their error schemas so OpenAPI and typed clients match the shared 400 response. The global validation boundary preserves response encoding failures as 500s. See `docs/alchemy/cloudflare/validation.md`.

## Application structure

Within each app, keep runtime and application assembly in `src/app/`, feature contracts and behavior in `src/features/<feature>/`, and concrete runtime integrations in `src/platform/` when needed. Do not create empty integration directories. Keep focused tests beside their implementation and whole-app tests with their fixtures in the app’s `tests/` directory. App-owned scripts stay under its `scripts/` directory. Preserve frontend framework conventions when organizing web apps. The current HTML frontend is temporary; consult `docs/onboarding.md#temporary-frontend` and do not treat its layout or hosting model as lasting requirements.

Use configured `@api/*`, `@infra/*`, `@test/*`, and the root application-stack alias `@stack` for TypeScript source imports, including sibling modules. Oxlint enforces this rule. Node-loaded `.mjs` lint plugins retain relative imports. Run Alchemy through `bun run alchemy` so stack loading uses the project’s tsconfig and aliases.

## Configuration

Use Effect `Config` as the standard for interpreting environment-backed application, stack, test, and tooling settings. Define decoding, constraints, optional values, and missing-value defaults in Config/Schema; invalid supplied values must fail through the Effect error channel. Parse at the owning runtime boundary and test with `ConfigProvider.fromUnknown` rather than mutating the host environment.

Process tooling and stack settings explicitly use `ConfigProvider.fromEnv()`. Worker runtime configuration follows Alchemy's binding/provider integration; do not assume the deployment process environment is the Worker's environment. Keep static project identity as checked-in data, positional CLI arguments under their argument parser, Vite client settings under `import.meta.env`, and raw environment forwarding to subprocesses as `process.env`. These are different sources or responsibilities, not reasons to introduce manual environment parsing. See `docs/alchemy/configuration.md`.

## Caller documentation

Treat `llms.txt` as a concise discovery entry point: project context, links to authoritative specifications, and essential guidance that cannot be documented there. Keep endpoint paths, methods, payloads, responses, errors, and authentication requirements in their owning specifications, not duplicated prose in `llms.txt`. If specification coverage is missing, address it in the owning specification rather than maintaining a second contract in discovery. Derive discovery links from shared route definitions and the current request origin.

## Schema intent

Data models shape the rest of the application. Before changing a schema, establish the expected domain meaning, data preservation requirements, and compatibility preferences from the user’s instructions and current project context. If those expectations are unclear, check with the user before making consequential assumptions. Do not ask again when the relevant expectation is already settled.

Do not introduce nullable fields, legacy repair paths, transitional models, or compatibility layers merely because earlier development iterations used a different shape. Nullability must represent an actual optional domain value; backwards compatibility must serve an established requirement. Likewise, do not infer permission to discard existing data from the absence of a compatibility requirement. Make schema choices reflect the intended application rather than speculative historical constraints.
