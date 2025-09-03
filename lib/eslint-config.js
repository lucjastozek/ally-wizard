import path from "path";
import { fileExists, readFile, writeFile } from "./file-utils.js";
import { installPackages } from "./package-manager.js";
import { logMessage } from "./logger.js";
import { MESSAGE_TYPES } from "./constants.js";

/**
 * Sets up accessibility linting with eslint-plugin-jsx-a11y
 * @param {string} packageManager - The package manager to use for installation
 */
export function setupAccessibilityLinting(packageManager) {
  logMessage("Setting up accessibility linting", MESSAGE_TYPES.SECTION);
  installPackages(["eslint-plugin-jsx-a11y"], true, packageManager);

  const eslintConfigPath = path.join(process.cwd(), "eslint.config.js");
  if (fileExists(eslintConfigPath)) {
    updateEslintConfig(eslintConfigPath);
    logMessage(
      "Updated eslint.config.js with jsx-a11y plugin",
      MESSAGE_TYPES.SUCCESS
    );
  } else {
    logMessage(
      "Warning: No eslint.config.js found. Please configure eslint-plugin-jsx-a11y manually.",
      MESSAGE_TYPES.WARNING
    );
  }
}

/**
 * Updates an existing ESLint configuration to include jsx-a11y plugin
 * @param {string} eslintConfigPath - Path to the ESLint config file
 */
function updateEslintConfig(eslintConfigPath) {
  let content = readFile(eslintConfigPath);

  if (!content.includes('import jsxA11y from "eslint-plugin-jsx-a11y"')) {
    content = content.replace(
      /(import.*?from.*?['"].*['"];?\s*)/s,
      `import jsxA11y from "eslint-plugin-jsx-a11y";\n$1`
    );
  }

  if (!/plugins\s*:\s*{/.test(content)) {
    content = content.replace(
      /export\s+default\s+{/,
      `export default {\n  plugins: {\n    "jsx-a11y": jsxA11y,\n  },`
    );
  } else if (!content.includes("jsx-a11y: jsxA11y")) {
    content = content.replace(
      /(plugins\s*:\s*{)/s,
      `$1\n    "jsx-a11y": jsxA11y,`
    );
  }

  writeFile(eslintConfigPath, content);
}
