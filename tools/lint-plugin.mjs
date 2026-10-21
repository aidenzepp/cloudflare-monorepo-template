import apiSourceRoles from "./api-source-roles.mjs";
import kebabCasePaths from "./kebab-case-paths.mjs";
import noBuiltInTryCatch from "./no-built-in-try-catch.mjs";
import requireBucketDestroyPolicy from "./require-bucket-destroy-policy.mjs";

/**
 * Enforces explicit Effect error boundaries, R2 deletion policies, kebab-case directories, and API
 * source roles.
 */
export default {
  meta: { name: "workspace" },
  rules: {
    "api-source-roles": apiSourceRoles,
    "kebab-case-paths": kebabCasePaths,
    "no-built-in-try-catch": noBuiltInTryCatch,
    "require-bucket-destroy-policy": requireBucketDestroyPolicy,
  },
};
