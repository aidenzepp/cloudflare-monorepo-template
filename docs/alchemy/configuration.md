# Configuration composition

Effect separates a **definition** (what to read and validate) from a **provider** (where values come from). A config file's directory does not establish inheritance or precedence.

## Combine definitions

`Config.all` groups definitions and parses them together:

```ts
const base = {
  ci: Config.Boolean("CI").pipe(Config.withDefault(false)),
};

const app = Config.all({
  ...base,
  port: Config.Number("PORT").pipe(Config.withDefault(3000)),
});
```

This adds `port` while retaining `ci`. If the object repeats a property after `...base`, ordinary JavaScript object spread replaces that definition. This is a shallow merge, not automatic nested inheritance. Reading the same environment key in two definitions does not mutate it; each definition applies its own decoding and defaults.

## Combine sources

`ConfigProvider.orElse(primary, fallback)` reads the primary first for each path:

```ts
const base = ConfigProvider.fromUnknown({ PORT: "3000", HOST: "localhost" });
const overrides = ConfigProvider.fromUnknown({ PORT: "4000" });
const provider = ConfigProvider.orElse(overrides, base);

const settings = Config.all({
  host: Config.String("HOST"),
  port: Config.Number("PORT"),
});

const result = Effect.runSync(settings.parse(provider));
// { host: "localhost", port: 4000 }
```

The explicit primary wins for duplicate paths. Missing paths fall back; source errors and invalid supplied values are not silently replaced with valid defaults. `Config.withDefault` handles missing configuration, not arbitrary validation failures. It does not write environment variables.

When installing providers through layers, `ConfigProvider.layer` replaces the active provider. `ConfigProvider.layerAdd` composes with it: the existing provider wins by default; `{ asPrimary: true }` gives the added provider priority. Explicit `orElse` is often clearer when choosing precedence.

These APIs were checked against Effect 4.0.1's installed `Config.ts` and `ConfigProvider.ts`. Verify their signatures when upgrading. For Alchemy's Worker-specific configuration binding, consult [Secrets & env](https://alchemy.run/cloudflare/security/secrets-env/); process configuration and Worker runtime configuration have different owners.

## Shared project identity

`infra/config/project.ts` owns the GitHub destination and Alchemy application stack name. Both stacks import it, so credentials and preview comments target the same repository. Its exported readonly object is static checked-in configuration; it requires no environment parser or Vite injection. Changing it updates consumers on their next run, rather than changing deployed infrastructure immediately.

`Project.stackName` identifies Alchemy-managed state. Preserve it for existing deployments unless performing an intentional migration; it is not a display name. The admin stack derives its identity by adding `-github`.

Package metadata remains in `package.json`; the HTTP API contract identifier remains `api`. Neither is an alias for the GitHub repository or stack identity. Keep values together when they share meaning, rather than combining unrelated identifiers merely because their strings currently match.

Effect `Config` is the standard for interpreting environment-backed application, stack, test, and tooling settings. Define constraints with `Config.schema`, optional values with `Config.option` or a schema that explicitly represents absence, and missing-value defaults with `Config.withDefault`. Parse at the owning runtime boundary; test definitions with `ConfigProvider.fromUnknown` without changing the host environment.

Process settings explicitly select `ConfigProvider.fromEnv()`, so an enclosing runtime's provider does not change their source. `infra/config/stages.ts` owns GitHub event and PR configuration for the CI stage selector and stack preview comments. Only push events select production. PR deployment requires a positive safe integer; preview comments permit missing or empty `PULL_REQUEST` because pushes supply no PR target. Invalid supplied numbers fail before stack resources are provisioned.

Keep static project identity as checked-in data. Positional CLI arguments belong to argument parsing, and subprocess environment forwarding can retain `process.env` because it passes values through without interpreting them. `import.meta.env` is Vite's build-time client interface; Effect Config does not make arbitrary process settings available to browser code. Worker bindings follow Alchemy's runtime provider integration rather than reading deployment-process settings.

## Source imports

`tsconfig.json` maps `@api/*` to `apps/api/src/api/`, `@server/*` to
`apps/api/src/server/`, `@platform/*` to `apps/api/src/platform/`, `@infra/*`
to `infra/`, and `@test/*` to the root cloud-test directory `test/`. `@stack`
maps directly to the root `alchemy.run.ts` application stack; the separate
GitHub admin stack lives in `infra/stacks/github.ts`. App-owned tests under
`apps/api/tests/` import contracts through `@api/*`, handlers and the Worker
through `@server/*`, and runtime integrations through `@platform/*`.

TypeScript source imports use these aliases, including sibling imports. Oxlint's
`no-restricted-imports` rule rejects relative paths in `.ts` and `.tsx` files.
Node-loaded `.mjs` lint plugins keep relative imports because Node does not resolve
TypeScript path mappings.

Use `bun run alchemy` from the repository root for Alchemy commands. The pinned
Alchemy 2.0.0-beta.81 launcher starts Bun with its own tsconfig override, which
cannot resolve this repository's aliases. The package script runs the same CLI
entrypoint with the project tsconfig explicitly. Local scripts and CI use that
command; recheck the adaptation when upgrading Alchemy.

See the [pinned launcher source](https://github.com/alchemy-run/alchemy/blob/v2.0.0-beta.81/alchemy/bin/cli.js).
