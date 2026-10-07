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

`project.config.ts` owns the GitHub destination and Alchemy application stack name. Both stacks import it, so credentials and preview comments target the same repository. Its exported readonly object is static checked-in configuration; it requires no environment parser or Vite injection. Changing it updates consumers on their next run, rather than changing deployed infrastructure immediately.

`Project.stackName` identifies Alchemy-managed state. Preserve it for existing deployments unless performing an intentional migration; it is not a display name. The admin stack derives its identity by adding `-github`.

Package metadata remains in `package.json`; the HTTP API contract identifier remains `api`. Neither is an alias for the GitHub repository or stack identity. Keep values together when they share meaning, rather than combining unrelated identifiers merely because their strings currently match.

Use Effect `Config` for environment-backed values that require decoding, validation, or defaults. `import.meta.env` is Vite's environment interface and does not establish shared repository configuration for Alchemy, tests, or other tooling.
