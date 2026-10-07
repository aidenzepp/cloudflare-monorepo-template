# Native observability

This template uses Cloudflare Workers Logs and Traces. Follow [Alchemy Part 6](https://alchemy.run/cloudflare/tutorial/part-6/) for Effect instrumentation and [Alchemy native tracing](https://alchemy.run/cloudflare/observability/workers-tracing/) for our backend integration. Part 6 uses Axiom; this template deliberately uses Alchemy's supported native layer instead.

## Wiring

`apps/api/src/worker.ts` provides `Cloudflare.Telemetry()` around Worker construction. The layer enables native traces and forwards request-time Effect spans into Cloudflare's platform waterfall. Alchemy enables Worker logs and invocation logs by default. No additional package, telemetry secret, Axiom dataset, or Wrangler configuration is needed.

Keep the Worker compatibility date at or after `2026-07-28`. The installed Alchemy version rejects older dates during deployment when this layer is provided. Sampling and persistence use Cloudflare defaults; configure `Cloudflare.Telemetry({ headSamplingRate: 0.1, persist: true })` when the application needs a different policy. Sampling applies to traces; logs have separate Worker observability settings.

## Instrumenting handlers

`apps/api/src/healthz/handlers.ts` demonstrates `Effect.withSpan("healthz.get")`, `Effect.logDebug`, and `Effect.annotateLogs`. Its response contract is unchanged. Debug messages are filtered at the default info threshold; this avoids logging every health poll. Use info for meaningful application events, warning for recoverable problems, and error for unexpected failures.

Name spans after stable operations, such as `space.create`. Attach useful scalar context through `Effect.annotateCurrentSpan`; annotate logs with `Effect.annotateLogs`. Log after the operation it describes. Keep credentials, message contents, and other sensitive payloads out of telemetry. Expected HTTP errors still belong in Effect's typed error channel; instrumentation does not replace error handling.

The native bridge forwards scalar span attributes. Nested object attributes, span events, and span links are not forwarded. To export the combined platform and Effect waterfall later, use Cloudflare's observability destination rather than installing a competing Effect tracer.

## Viewing and verification

After deployment, select the Worker in the Cloudflare dashboard and open its observability logs and traces. Request `/api/healthz`; sampled traces should contain the `healthz.get` span. This is the initial live verification to perform when Cloudflare account setup is authorized.

Local HTTP tests verify the response contract, not Cloudflare ingestion. `alchemy dev` tracing depends on the local runtime; a successful local request does not prove dashboard recording. Cloud account connection, deployment, and live telemetry verification remain deferred.
