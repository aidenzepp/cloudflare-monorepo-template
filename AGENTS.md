# Agent instructions

Use `.agents/skills/conventional-commits/SKILL.md` when committing and `.agents/skills/document-code/SKILL.md` when writing or reviewing code.

Use Effect error channels; built-in try/catch is prohibited by lint. Do not add function-decomposition, type-design, require-doc-comment, or Shadcn lint policies.

Run `bun run check`, `bun run build`, then `bun test apps` before completing implementation. Local Worker tests use Alchemy’s Effect-aware harness, workerd, isolated local state, and automatic cleanup; build assets before running them. Cloud integration tests deploy real resources: build first, select an isolated stage with `ALCHEMY_STAGE`, and invoke `bun run test:integration` explicitly. Never use production for tests.

Follow Alchemy’s documented Effect-native Worker construction and HTTP API patterns. Link the owning guide in code. Do not introduce a standalone fetch adapter or no-op filesystem into production; document any version-required deviations.

Before implementing Alchemy/Cloudflare features, read `docs/alchemy/cloudflare/README.md` and its relevant upstream guide.

## Learning more about Effect

Before writing Effect code, read `node_modules/effect/AGENTS.md` completely and follow its relevant links. For APIs not covered there, consult `node_modules/effect/src` matching the installed version.

Preserve the pinned dependency versions and this repository's Alchemy/Bun testing conventions when applying upstream guidance.

Use `.agents/skills/effect-design/SKILL.md` when writing or reviewing Effect code and derived API/configuration composition. Read its labeled examples before applying its guidance.

Use `.agents/skills/error-messages/SKILL.md` when adding or changing caller-facing errors. For Effect HTTP APIs, use schema-backed tagged errors declared in endpoint contracts; the skill’s generic payload examples do not require a separate error envelope.
