/**
 * Defines repository-wide infrastructure identity in one shared location.
 * GitHub resources use the same destination for CI secrets and preview comments.
 * Stack names identify existing Alchemy state; changing them is an infrastructure
 * migration, not a display-name change. Package and API identifiers have separate
 * meanings and are configured at their owning boundaries.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-5/#push-the-token-into-github
 * @see https://alchemy.run/cloudflare/tutorial/part-5/#add-pr-preview-comments
 */
export const Project = {
  github: {
    owner: "aidenzepp",
    repository: "cloudflare-monorepo-template",
  },
  stackName: "cloudflare-monorepo-template",
  stages: {
    integrationPrefix: "test-",
    previewPrefix: "pr-",
    production: "prod",
  },
} as const;
