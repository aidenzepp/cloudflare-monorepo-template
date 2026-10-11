import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as GitHub from "alchemy/GitHub";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { Project } from "@infra/config/project";

/**
 * Provisions the deployment token and repository secrets using an admin profile.
 * Run explicitly after choosing a Cloudflare account; normal app deployments
 * must not provision credentials. Permissions cover the current Worker and state
 * store; review them when adding services. Secret values are not stack outputs.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-5/#scaffold-the-github-stack
 * @see https://alchemy.run/cloudflare/tutorial/part-5/#mint-a-scoped-cloudflare-api-token
 */
export default Alchemy.Stack(
  `${Project.stackName}-github`,
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* provisionCiCredentials() {
    const { accountId } = yield* yield* Cloudflare.CloudflareEnvironment;
    const apiToken = yield* Cloudflare.ApiToken.AccountApiToken("CIToken", {
      accountId,
      policies: [
        {
          effect: "allow",
          permissionGroups: [
            "Secrets Store Write",
            "Workers Scripts Write",
            "Account Settings Write",
          ],
          resources: { [`com.cloudflare.api.account.${accountId}`]: "*" },
        },
      ],
    });

    yield* GitHub.Secret("cf-api-token", {
      name: "CLOUDFLARE_API_TOKEN",
      owner: Project.github.owner,
      repository: Project.github.repository,
      value: apiToken.value,
    });

    yield* GitHub.Secret("cf-account-id", {
      name: "CLOUDFLARE_ACCOUNT_ID",
      owner: Project.github.owner,
      repository: Project.github.repository,
      value: Redacted.make(accountId),
    });
  }),
);
