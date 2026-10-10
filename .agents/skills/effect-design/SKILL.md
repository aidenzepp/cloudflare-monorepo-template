---
name: effect-design
description: Write or review Effect code in this repository, especially boundary schemas, typed HTTP errors, readable composition, and configuration or routes derived from shared parents.
---

# Effect Design

Maximize use of Effect's supported capabilities while maintaining readability. Prefer native Effect and Alchemy APIs over custom equivalents. Check the installed version's documentation and source before assuming a capability is unavailable or inventing an adapter.

Before implementation or review, read [references/examples.md](references/examples.md). Its POSITIVE and NEGATIVE labels define decision boundaries, not mandatory syntax templates.

## Native capability review

Before writing a custom parser, adapter, client wrapper, or resource-management mechanism:

1. State the contract: accepted input, output, failures, limits, lifecycle, and guarantees.
2. Inspect the owning repository patterns and pinned dependency versions.
3. Check Alchemy's documented integration, then installed Effect core APIs and relevant companion packages, then the underlying platform API. These are discovery steps, not a requirement to force every operation through Alchemy.
4. Read the relevant API documentation and source for the installed version. Search neighboring APIs too; failing to find one guessed symbol does not establish that the capability is absent.
5. Select the supported primitive that satisfies the contract with the clearest implementation. If custom glue remains necessary, identify the specific missing capability and document the constraint at its owning boundary.

Do not claim that a native capability is unavailable without checking. Do not upgrade dependencies or add a package merely to make an example convenient. Explain material findings in the work update; this review does not require a new report file.

## Readability review process

Use this process for new code and refactors:

1. Identify the responsibilities: reading transport data, decoding schemas, application behavior, error translation, and resource lifecycle. Separate responsibilities when it helps a reader; do not make a helper for every expression.
2. Look for nested generators/callbacks, mutable accumulation, repeated validation, manual parsing, and success wrapping. Ask which installed primitive already owns that responsibility.
3. Prefer a main operation that reads as a short sequence of meaningful steps. Use named `Effect.fn` / `Effect.fnUntraced` helpers for coherent effectful operations and native stream operators for stream transformations.
4. Put invariants in Schema where supported. Use native exhaustive matching when it makes error classification clearer and verifies all supported cases.
5. Check that the abstraction preserves execution order, bounded memory, cancellation, cleanup, and typed failures. A shorter pipeline is wrong if it skips file streams, buffers unbounded attachments, or loses failure information.
6. Compare the result for readability and behavior. Native capabilities are preferred while readable; plain `if`, ternaries, and `??` remain valid. Avoid trading understandable control flow for decorative combinators.
7. Verify with the repository's normal checks and relevant boundary tests. Check emitted error bodies and generated contracts when affected.

Read [references/readable-decoding.md](references/readable-decoding.md) when reviewing nested decoding or stream code. It contains self-contained positive and negative examples; application files are optional navigation, never the definition of correctness.

## Boundary schemas and errors

- Decode untrusted input with Schema into useful types. Keep validation rules in a schema rather than scattered manual conversions and predicates.
- Use schema-backed tagged errors and declare them in the endpoint contract. Give callers stable tags, specific messages, and safe structured facts. Apply the local `error-messages` skill when writing or changing errors.
- Prefer endpoint parameter, header, query, and payload schemas for request validation; the shared router boundary renders their default issues consistently. Keep handler errors for application failures rather than replacing ordinary schema failures with bespoke validation tags.
- Verify the actual response body. Schema validation does not automatically guarantee a descriptive HTTP response: Effect's default validation response may be empty. Map validation failures explicitly when the caller needs an explanation.
- Keep provider causes in internal observability; expose curated messages. Do not promise that data was preserved unless the failure boundary proves it.

## Readable Effect

Use Effect broadly for schemas, errors, composition, resources, tracing, concurrency, and available native integrations. This is a positive preference, not a restriction to a small set of guarantees.

Choose Effect-native formulations when equally clear. Do not replace concise `if`, `??`, or ternary expressions with longer combinator chains unless the change provides a concrete safety, type-safety, resource, or behavioral advantage that justifies the readability cost. `Effect.gen` with ordinary control flow is idiomatic Effect.

## Derive shared choices

Define a shared fact at its owning boundary and compose descendants from it. Route prefixes belong to parent composition; parameter schemas inherit parent validation; infrastructure consumers reference the shared project configuration. Changes to a parent should propagate without editing repeated literals.

Keep dependencies acyclic: parent API assembly imports children, while child parameter schemas import parent parameter schemas in separate modules. Do not add a registry or generic abstraction when native composition suffices. A new abstraction should answer a present requirement.

## Verification

Follow repository checks and the Alchemy/Bun test harness. Verify boundary failures as well as success, generated contracts, and relevant cascade behavior. Keep dependency versions pinned and keep application-specific features out of unrelated template work.
