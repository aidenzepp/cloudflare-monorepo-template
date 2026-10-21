/**
 * @typedef {{
 *   report: (descriptor: {
 *     data: { segment: string };
 *     messageId: "apiSourceRole";
 *     node: unknown;
 *   }) => void;
 *   cwd: string;
 *   filename: string;
 * }} RuleContext
 */

/**
 * The repository prefix whose next directory must be an API source role.
 */
const apiSourceRoot = ["apps", "api", "src"];

/**
 * Directories permitted as the first child of `apps/api/src`.
 *
 * `domain` remains valid before that directory exists, so the first domain model
 * does not require a lint change. An empty role directory is still not created.
 */
const apiSourceRoles = new Set(["api", "server", "platform", "domain"]);

/**
 * Drops a trailing slash so a cwd prefix comparison does not depend on one.
 *
 * @param {string} value An absolute directory path.
 * @returns {string} The path without a trailing slash.
 */
const stripTrailingSlash = (value) => {
  if (value.endsWith("/") || value.endsWith("\\")) {
    return value.slice(0, -1);
  }

  return value;
};

/**
 * Expresses an absolute lint path relative to the lint process cwd.
 *
 * @param {string} cwd The directory Oxlint was started from.
 * @param {string} filename The absolute path of the file being linted.
 * @returns {string} The repository-relative path, or the original filename when it is outside
 *   `cwd`.
 */
const relativePath = (cwd, filename) => {
  const prefix = `${stripTrailingSlash(cwd)}/`;

  if (filename.startsWith(prefix)) {
    return filename.slice(prefix.length);
  }

  return filename;
};

/**
 * Reports a file under `apps/api/src` whose first directory is not a source role.
 *
 * Paths outside that tree are ignored. A file placed directly in `apps/api/src` is
 * reported through its filename because that filename occupies the role position.
 *
 * @param {string} pathFromRoot Repository-relative path. Separators may be `/` or `\`.
 * @returns {string[]} The segment to move. An empty array means the path is allowed.
 */
export const apiSourceRoleViolations = (pathFromRoot) => {
  if (pathFromRoot.length === 0 || pathFromRoot.startsWith("<")) {
    return [];
  }

  const segments = pathFromRoot
    .split("/")
    .flatMap((segment) => segment.split("\\"))
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..");

  const isApiSource = apiSourceRoot.every((segment, index) => segments[index] === segment);

  if (!isApiSource) {
    return [];
  }

  const filename = segments.pop();
  const [role] = segments.slice(apiSourceRoot.length);

  if (role === undefined) {
    return filename === undefined ? [] : [filename];
  }

  if (apiSourceRoles.has(role)) {
    return [];
  }

  return [role];
};

/**
 * Reports API source files that leave the role directories.
 */
const apiSourceRolesRule = {
  /**
   * @param {RuleContext} context Oxlint rule context for the file being linted.
   * @returns {{ Program: (node: unknown) => void }} Visitor that checks the file path once.
   */
  create(context) {
    return {
      /**
       * @param {unknown} node The file's program root, used only to anchor the diagnostic.
       */
      Program(node) {
        const violations = apiSourceRoleViolations(relativePath(context.cwd, context.filename));
        const [segment] = violations;

        if (segment === undefined) {
          return;
        }

        context.report({
          data: { segment },
          messageId: "apiSourceRole",
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description: "Require API source files to live in a role directory.",
    },
    messages: {
      apiSourceRole:
        "Move {{segment}} under api, server, platform, or domain. The first directory inside apps/api/src must be one of those roles.",
    },
    schema: [],
    type: "problem",
  },
};

export default apiSourceRolesRule;
