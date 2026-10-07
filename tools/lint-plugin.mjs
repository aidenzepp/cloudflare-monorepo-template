import noBuiltInTryCatch from "./no-built-in-try-catch.mjs";
import requireBucketDestroyPolicy from "./require-bucket-destroy-policy.mjs";

/**
 * Enforces explicit Effect error boundaries and R2 deletion policies.
 */
export default {
  meta: { name: "workspace" },
  rules: {
    "no-built-in-try-catch": noBuiltInTryCatch,
    "require-bucket-destroy-policy": requireBucketDestroyPolicy,
  },
};
