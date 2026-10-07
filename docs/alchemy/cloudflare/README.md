# Alchemy on Cloudflare

Use Alchemy's documentation as the first reference for infrastructure and Worker integration. Read the relevant guide before implementing a feature. Keep implementations close to its supported patterns; explain necessary deviations beside the code with a link to the owning section.

## Worker construction, providers, and errors

Start with [Part 2: Add a Worker](https://alchemy.run/cloudflare/tutorial/part-2/). It explains:

- [Worker construction](https://alchemy.run/cloudflare/tutorial/part-2/#create-the-worker-file): construction runs during planning and runtime; request work belongs in the fetch effect.
- [Resource bindings](https://alchemy.run/cloudflare/tutorial/part-2/#bind-the-bucket-to-the-worker): resources can be declared in separate files and imported by their consumers.
- [Providing a binding layer](https://alchemy.run/cloudflare/tutorial/part-2/#provide-the-binding-layer): use `Effect.provide` to supply the R2 runtime binding service. This differs from the stack's `Cloudflare.providers()`, which supplies infrastructure providers.
- [Handling R2 errors](https://alchemy.run/cloudflare/tutorial/part-2/#handle-r2-errors): `Effect.catchTag` handles a tagged storage failure and converts it to an HTTP response. Worker handler types constrain which failures can escape.

Our API uses [Alchemy's Effect HTTP API guide](https://alchemy.run/cloudflare/apis/effect-http-api/) for schemas, endpoint groups, handler layers, and router construction. Consult that guide when adapting Part 2's direct fetch examples to typed endpoints.

## Other references

| Topic                                           | Guide                                                     |
| ----------------------------------------------- | --------------------------------------------------------- |
| Stack, providers, state, and outputs            | [Part 1](https://alchemy.run/cloudflare/tutorial/part-1/) |
| Integration tests and disposable bucket cleanup | [Part 3](https://alchemy.run/cloudflare/tutorial/part-3/) |
| Local development                               | [Part 4](https://alchemy.run/cloudflare/tutorial/part-4/) |
| CI/CD                                           | [Part 5](https://alchemy.run/cloudflare/tutorial/part-5/) |
| Observability                                   | [Part 6](https://alchemy.run/cloudflare/tutorial/part-6/) |

See [our native observability setup](observability.md), [our CI/CD setup](ci-cd.md) and [Effect configuration composition](../configuration.md) for repository-specific guidance.

## Applying the guides here

Check examples against the versions pinned in `package.json` and `bun.lock`. When an example differs from installed types, inspect the installed Alchemy and Effect source before inventing an adapter or bypassing types. Document the reason and source for any required adjustment.

Use the guides to learn the integration, rather than treating every tutorial sample resource as a template requirement. Add resources when the application needs them. Follow repository lint and documentation rules when adapting examples.

Cloudflare account connection and deployment are currently deferred. Documentation work and local checks do not authorize bootstrapping state, deploying resources, or running cloud integration tests.
