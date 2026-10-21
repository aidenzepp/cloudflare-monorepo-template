import { expect, test } from "bun:test";
import requireBucketDestroyPolicy from "./require-bucket-destroy-policy.mjs";

/**
 * Builds an identifier node.
 *
 * @param {string} name Identifier text.
 * @returns {{ name: string; type: "Identifier" }} The identifier passed to the visitor.
 */
const identifier = (name) => ({ name, type: "Identifier" });

/**
 * Builds a literal node.
 *
 * @param {boolean | string} value Literal value.
 * @returns {{ type: "Literal"; value: boolean | string }} The literal passed to the visitor.
 */
const literal = (value) => ({ type: "Literal", value });

/**
 * Builds a non-computed member expression, such as `Cloudflare.R2`.
 *
 * @param {unknown} object Expression that owns the property.
 * @param {string} name Property name.
 * @returns {{
 *   computed: false;
 *   object: unknown;
 *   property: { name: string; type: "Identifier" };
 *   type: "MemberExpression";
 * }}
 *   The member expression passed to the visitor.
 */
const member = (object, name) => ({
  computed: false,
  object,
  property: identifier(name),
  type: "MemberExpression",
});

/**
 * Builds a computed member expression, such as `Cloudflare.R2["Bucket"]`.
 *
 * @param {unknown} object Expression that owns the property.
 * @param {unknown} property Property expression.
 * @returns {{ computed: true; object: unknown; property: unknown; type: "MemberExpression" }} The
 *   computed member expression passed to the visitor.
 */
const computedMember = (object, property) => ({
  computed: true,
  object,
  property,
  type: "MemberExpression",
});

/**
 * Builds an object property with an identifier key.
 *
 * @param {string} name Property name.
 * @param {unknown} value Property value node.
 * @returns {{
 *   computed: false;
 *   key: { name: string; type: "Identifier" };
 *   type: "Property";
 *   value: unknown;
 * }}
 *   The property passed to the visitor.
 */
const property = (name, value) => ({
  computed: false,
  key: identifier(name),
  type: "Property",
  value,
});

/**
 * Builds an object property whose key is a string literal.
 *
 * @param {string} name Property name.
 * @param {boolean} value Property value.
 * @returns {{
 *   computed: false;
 *   key: { type: "Literal"; value: string };
 *   type: "Property";
 *   value: { type: "Literal"; value: boolean };
 * }}
 *   The property passed to the visitor.
 */
const stringKey = (name, value) => ({
  computed: false,
  key: literal(name),
  type: "Property",
  value: literal(value),
});

/**
 * Builds an object expression.
 *
 * @param {unknown[]} properties Object properties.
 * @returns {{ properties: unknown[]; type: "ObjectExpression" }} The object passed to the visitor.
 */
const objectExpression = (properties) => ({
  properties,
  type: "ObjectExpression",
});

/**
 * Collects diagnostics produced by one visit of the bucket policy rule.
 *
 * @param {unknown} node Parsed call passed to the visitor.
 * @returns {{ messageId: string; node: unknown }[]} Diagnostics reported for that call.
 */
const bucketReports = (node) => {
  /**
   * @type {{ messageId: string; node: unknown }[]}
   */
  const reports = [];
  const visitor = requireBucketDestroyPolicy.create({
    report(descriptor) {
      reports.push(descriptor);
    },
  });

  visitor.CallExpression(node);

  return reports;
};

/**
 * Builds a direct `Cloudflare.R2.Bucket` call.
 *
 * @param {unknown[] | undefined} args Call arguments. The bucket id alone omits the options object.
 * @returns {{ arguments: unknown[]; callee: unknown }} The call passed to the visitor.
 */
const bucketCall = (args = [identifier("uploads")]) => ({
  arguments: args,
  callee: member(member(identifier("Cloudflare"), "R2"), "Bucket"),
});

test("allows an explicit forceDestroy decision", () => {
  expect(
    bucketReports(
      bucketCall([
        identifier("uploads"),
        objectExpression([property("forceDestroy", literal(true))]),
      ]),
    ),
  ).toEqual([]);
  expect(
    bucketReports(
      bucketCall([
        identifier("uploads"),
        objectExpression([
          property("empty", literal(false)),
          property("forceDestroy", literal(false)),
        ]),
      ]),
    ),
  ).toEqual([]);
  expect(
    bucketReports(
      bucketCall([identifier("uploads"), objectExpression([stringKey("forceDestroy", false)])]),
    ),
  ).toEqual([]);
});

test("reports a bucket whose deletion policy is not visible", () => {
  const missingOptions = bucketCall();
  const otherProperties = bucketCall([
    identifier("uploads"),
    objectExpression([property("name", literal(true))]),
  ]);
  const nestedPolicy = bucketCall([
    identifier("uploads"),
    objectExpression([
      property("settings", objectExpression([property("forceDestroy", literal(true))])),
    ]),
  ]);
  const computedKey = bucketCall([
    identifier("uploads"),
    objectExpression([
      {
        computed: true,
        key: identifier("forceDestroy"),
        type: "Property",
        value: literal(true),
      },
    ]),
  ]);

  expect(bucketReports(missingOptions)).toEqual([{ messageId: "missing", node: missingOptions }]);
  expect(bucketReports(otherProperties)).toEqual([{ messageId: "missing", node: otherProperties }]);
  expect(bucketReports(nestedPolicy)).toEqual([{ messageId: "missing", node: nestedPolicy }]);
  expect(bucketReports(computedKey)).toEqual([{ messageId: "missing", node: computedKey }]);
});

test("ignores calls that are not a direct Cloudflare.R2.Bucket declaration", () => {
  expect(
    bucketReports({ arguments: [identifier("uploads")], callee: identifier("Bucket") }),
  ).toEqual([]);
  expect(
    bucketReports({
      arguments: [identifier("uploads")],
      callee: member(identifier("R2"), "Bucket"),
    }),
  ).toEqual([]);
  expect(
    bucketReports({
      arguments: [identifier("sessions")],
      callee: member(member(identifier("Cloudflare"), "KV"), "Namespace"),
    }),
  ).toEqual([]);
  expect(
    bucketReports({
      arguments: [identifier("uploads")],
      callee: computedMember(member(identifier("Cloudflare"), "R2"), identifier("Bucket")),
    }),
  ).toEqual([]);
});

test("explains that forceDestroy must be chosen explicitly", () => {
  expect(requireBucketDestroyPolicy.meta.messages.missing).toBe(
    "Specify forceDestroy explicitly for this R2 bucket. Use true only for disposable data; preserve deletion protection for persistent data.",
  );
});
