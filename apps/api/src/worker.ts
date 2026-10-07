import * as Effect from "effect/Effect";

/**
 * Respond to health checks and reject unsupported API requests.
 *
 * @param request The incoming HTTP request.
 * @returns An Effect producing the API response.
 */
export const handleRequest = (request: Request) =>
  Effect.sync(() => {
    if (new URL(request.url).pathname === "/api/health" && request.method === "GET") {
      return Response.json({ ok: true, runtime: "cloudflare" });
    }

    return Response.json({ error: "not_found" }, { status: 404 });
  });

export default {
  /**
   * Execute the API Effect at the Cloudflare request boundary.
   *
   * @param request The incoming HTTP request.
   * @returns The completed HTTP response.
   */
  fetch(request: Request) {
    return Effect.runPromise(handleRequest(request));
  },
} satisfies ExportedHandler;
