# Agent instructions

Use `.agents/skills/conventional-commits/SKILL.md` when committing and `.agents/skills/document-code/SKILL.md` when writing or reviewing code.

Use Effect error channels; built-in try/catch is prohibited by lint. Do not add function-decomposition, type-design, require-doc-comment, or Shadcn lint policies.

Run `bun run check`, `bun test apps`, and `bun run build` before completing implementation. Cloud integration tests deploy real resources: build first, select an isolated stage with `ALCHEMY_STAGE`, and invoke `bun run test:integration` explicitly. Never use production for tests.

Follow Alchemy’s documented Effect-native Worker construction and HTTP API patterns. Link the owning guide in code. Do not introduce a standalone fetch adapter or no-op filesystem into production; document any version-required deviations.
