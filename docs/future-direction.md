# Future direction

This template is a way to learn Cloudflare by building and understanding our own stack. Use Ratstack as inspiration: study its choices, compare the trade-offs, and deliberately decide what belongs here rather than copying the whole stack.

The following are candidates for future feature requests, not settled architecture or work scheduled for this PR.

| Candidate                     | Questions for a future feature request                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend foundation           | What should replace the temporary HTML frontend? Evaluate React, Effect RPC and Atoms, and TanStack integrations as options. Decide rendering, routing, forms, and how the frontend connects to the Worker. |
| Opinionated frontend defaults | Which choices should the template make so a new application starts with a coherent approach? Explain each default and its trade-offs.                                                                       |
| Design system                 | Choose a component foundation and establish typography, colors, spacing, accessibility, and interaction conventions. Include a small working example.                                                       |
| XState                        | Evaluate state machines for a concrete workflow with meaningful states and transitions. Establish how it would compose with Effect and when ordinary Effect operations are sufficient.                      |
| Ratstack review               | Review its architecture, conventions, and developer experience. Identify ideas to adopt, adapt, or leave out, then create focused feature requests for the useful ones.                                     |

Before implementing a candidate, write a small feature request stating the problem, the learning goal, the proposed choice and alternatives, what is out of scope, and how we will know it works. Check the current template and supported Alchemy, Effect, and Cloudflare capabilities first. Keep each request small enough to understand and review independently.
