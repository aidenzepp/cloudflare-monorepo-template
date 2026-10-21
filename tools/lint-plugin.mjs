import kebabCasePaths from "./kebab-case-paths.mjs";
import noBuiltInTryCatch from "./no-built-in-try-catch.mjs";
import requireBucketDestroyPolicy from "./require-bucket-destroy-policy.mjs";

/**
 * Enforces explicit Effect error boundaries, R2 deletion policies, and kebab-case directories.
 */
export default {
  meta: { name: "workspace" },
  rules: {
    "kebab-case-paths": kebabCasePaths,
    "no-built-in-try-catch": noBuiltInTryCatch,
    "require-bucket-destroy-policy": requireBucketDestroyPolicy,
  },
};
