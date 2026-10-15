# Future direction

This template is a way to learn Cloudflare by building and understanding our own stack. Use Ratstack as inspiration: study its choices, compare the trade-offs, and deliberately decide what belongs here rather than copying the whole stack.

These are directions for future feature requests. The frontend decision is still open; no framework or component library is selected by this document.

## Future work

- **Choose an opinionated frontend stack.** Make a deliberate choice, replace the temporary HTML frontend, and establish a coherent approach to rendering, routing, state, forms, and API communication. The goal is to choose defaults and build on them.
- **Build quality into the tooling.** Combine agent skills with deterministic scripts, lint rules, formatters, and checks to maintain high-quality frontend and backend code. For UI/UX, cover correct component usage, spacing, padding, color tokens, accessibility, and interaction patterns. Investigate component-library skills and integration with the existing Ultracite tooling. Encode mechanically checkable rules in tools; use skills and review for decisions that require judgment. Visual foundations are part of this work, alongside mechanisms that help agents apply them consistently.
- **Evaluate XState.** Try state machines on a concrete workflow with meaningful states and transitions, and establish how they compose with Effect.
- **Learn from Ratstack.** Review its architecture, conventions, tooling, and developer experience. Create focused requests for ideas worth adopting or adapting here.

## Frontend considerations

These capture current preferences and concerns to investigate, rather than verified framework limitations:

- **Astro is the strongest preference**, provided we can use its architecture well. Resolve how the desired interactive React components would fit without defaulting to `client:load` across every page or fragmenting the application into excessive islands.
- **Svelte is particularly interesting to try.** Assess whether the desired component libraries have suitable equivalents; rebuilding a component collection may cost more than it is worth.
- **React with Effect RPC and Atoms, plus TanStack integrations**, is another candidate, with compatibility with the desired React components as a consideration.
- **Foldkit** is a candidate to investigate for its Effect-native approach and Cloudflare integration.

Use a small representative UI to compare the candidates before choosing. Check current integrations and component support, then turn the chosen direction into focused feature requests with clear scope and acceptance criteria.
