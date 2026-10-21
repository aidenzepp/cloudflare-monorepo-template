/**
 * The syntax fields inspected by the bucket policy rule.
 *
 * @typedef {{
 *   type: string;
 *   computed?: boolean;
 *   name?: string;
 *   value?: unknown;
 *   property?: PolicyNode;
 *   object?: PolicyNode;
 *   key?: PolicyNode;
 *   properties?: PolicyNode[];
 * }} PolicyNode
 */

/**
 * A parsed call whose arguments may contain inline bucket options.
 *
 * @typedef {{ callee: PolicyNode; arguments: PolicyNode[] }} BucketCall
 */

/**
 * Oxlint's reporting capability for a missing deletion policy.
 *
 * @typedef {{ report: (descriptor: { messageId: "missing"; node: BucketCall }) => void }} RuleContext
 */

/**
 * Requires an explicit deletion policy on Cloudflare R2 bucket declarations.
 * Alchemy's testing tutorial enables forceDestroy for disposable test data:
 * non-empty buckets otherwise prevent teardown. Production data needs the
 * opposite protection, so this rule requires a decision rather than forcing true.
 * Inline options are required for inspection; aliases and indirect calls are
 * outside this syntax-only rule's coverage. It does not validate stage semantics.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-3/#allow-the-bucket-to-be-destroyed-with-objects-in-it
 */
const requireBucketDestroyPolicy = {
  /**
   * Registers the visitor that checks direct bucket declarations.
   *
   * @param {RuleContext} context Oxlint context used to report missing policies.
   * @returns {{ CallExpression: (node: BucketCall) => void }} Call visitor for Cloudflare.R2.Bucket
   *   declarations.
   */
  create(context) {
    return {
      /**
       * Reports bucket declarations without a visible forceDestroy property.
       *
       * @param {BucketCall} node Parsed call expression being inspected.
       */
      CallExpression(node) {
        const { callee } = node;

        if (
          callee.type !== "MemberExpression" ||
          callee.computed === true ||
          callee.property?.name !== "Bucket" ||
          callee.object?.type !== "MemberExpression" ||
          callee.object.computed === true ||
          callee.object.property?.name !== "R2" ||
          callee.object.object?.type !== "Identifier" ||
          callee.object.object.name !== "Cloudflare"
        ) {
          return;
        }

        const [, options] = node.arguments;
        const hasPolicy =
          options?.type === "ObjectExpression" &&
          options.properties?.some(
            (property) =>
              property.type === "Property" &&
              property.computed !== true &&
              (property.key?.name === "forceDestroy" || property.key?.value === "forceDestroy"),
          );

        if (hasPolicy !== true) {
          context.report({ messageId: "missing", node });
        }
      },
    };
  },

  meta: {
    messages: {
      missing:
        "Specify forceDestroy explicitly for this R2 bucket. Use true only for disposable data; preserve deletion protection for persistent data.",
    },
    schema: [],
    type: "problem",
  },
};

export default requireBucketDestroyPolicy;
