export const PACKAGE_MANAGERS = {
  YARN: "yarn",
  PNPM: "pnpm",
  NPM: "npm",
};

export const LOCK_FILES = {
  [PACKAGE_MANAGERS.YARN]: "yarn.lock",
  [PACKAGE_MANAGERS.PNPM]: "pnpm-lock.yaml",
  [PACKAGE_MANAGERS.NPM]: "package-lock.json",
};

export const ACCESSIBILITY_TOOLS = {
  AXE: "axe",
  PA11Y: "pa11y",
  LIGHTHOUSE: "lighthouse",
};

export const TOOL_DEPENDENCIES = {
  [ACCESSIBILITY_TOOLS.PA11Y]: "pa11y",
  [ACCESSIBILITY_TOOLS.AXE]: "@axe-core/cli",
  [ACCESSIBILITY_TOOLS.LIGHTHOUSE]: "@lhci/cli",
};

export const COLORS = {
  RESET: "\x1b[0m",
  BRIGHT: "\x1b[1m",
  DIM: "\x1b[2m",
  CYAN: "\x1b[36m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  MAGENTA: "\x1b[35m",
  GRAY: "\x1b[90m",
};

export const MESSAGE_TYPES = {
  HEADER: "header",
  SECTION: "section",
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  COMMAND: "command",
  EXTERNAL: "external",
};

export const SCRIPT_MAPPINGS = {
  [ACCESSIBILITY_TOOLS.AXE]: "axe http://localhost:3000 --exit",
  [ACCESSIBILITY_TOOLS.PA11Y]:
    "pa11y --standard WCAG2AA --timeout 30000 --wait 2000 --include-warnings http://localhost:3000",
  [ACCESSIBILITY_TOOLS.LIGHTHOUSE]: "lhci autorun",
};

export const RESOURCE_LINKS = {
  [ACCESSIBILITY_TOOLS.AXE]: "Axe: https://www.deque.com/axe/",
  [ACCESSIBILITY_TOOLS.PA11Y]: "Pa11y: https://pa11y.org/",
  [ACCESSIBILITY_TOOLS.LIGHTHOUSE]:
    "Lighthouse: https://developers.google.com/web/tools/lighthouse",
  WCAG: "WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/",
  GITHUB_SECRETS:
    "https://docs.github.com/en/actions/security-guides/encrypted-secrets",
};
