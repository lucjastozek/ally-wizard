import {
  ACCESSIBILITY_TOOLS,
  TOOL_DEPENDENCIES,
  SCRIPT_MAPPINGS,
  RESOURCE_LINKS,
  MESSAGE_TYPES,
} from "./constants.js";
import {
  copyTemplateFile,
  readPackageJson,
  writePackageJson,
} from "./file-utils.js";
import {
  installPackages,
  getPackageManagerCommand,
} from "./package-manager.js";
import { logMessage } from "./logger.js";

/**
 * Installs selected accessibility tools and sets up their configurations
 * @param {string[]} selectedTools - Array of selected accessibility tools
 * @param {string} packageManager - The package manager to use
 */
export function installSelectedTools(selectedTools, packageManager) {
  if (selectedTools.length === 0) return;

  logMessage("Installing accessibility testing tools", MESSAGE_TYPES.SECTION);
  logMessage(
    "This may take a moment depending on your internet connection.",
    MESSAGE_TYPES.INFO,
  );

  const toolDependencies = selectedTools.map((tool) => TOOL_DEPENDENCIES[tool]);
  installPackages(toolDependencies, true, packageManager);

  if (selectedTools.includes(ACCESSIBILITY_TOOLS.LIGHTHOUSE)) {
    logMessage("Setting up Lighthouse configuration", MESSAGE_TYPES.SECTION);
    copyTemplateFile("lighthouserc.json");
    logMessage(
      "Lighthouse config file created successfully!",
      MESSAGE_TYPES.SUCCESS,
    );
  }
}

/**
 * Updates package.json with accessibility testing scripts
 * @param {string[]} selectedTools - Array of selected accessibility tools
 * @param {string} packageManager - The package manager being used
 * @returns {string} The package manager command prefix
 */
export function updatePackageJsonWithScripts(selectedTools, packageManager) {
  const packageData = readPackageJson();

  if (!packageData.scripts) {
    packageData.scripts = {};
  }

  if (selectedTools.length > 0) {
    packageData.scripts["preview"] = "vite preview";
  }

  selectedTools.forEach((tool) => {
    if (SCRIPT_MAPPINGS[tool]) {
      packageData.scripts[`a11y:${tool}`] = SCRIPT_MAPPINGS[tool];
    }
  });

  const packageManagerCommand = getPackageManagerCommand(packageManager);
  const commands = selectedTools.map(
    (tool) => `${packageManagerCommand} a11y:${tool}`,
  );

  if (commands.length > 0) {
    packageData.scripts["a11y:all"] = `concurrently "${commands.join('" "')}"`;
  }

  writePackageJson(packageData);

  if (commands.length > 0) {
    installPackages(["concurrently"], true, packageManager);
  }

  return packageManagerCommand;
}

/**
 * Displays a summary of the user's configuration choices
 * @param {string[]} selectedTools - Array of selected accessibility tools
 * @param {boolean} hasCI - Whether CI integration is enabled
 * @param {boolean} hasLinting - Whether accessibility linting is enabled
 */
export function displayConfigurationSummary(selectedTools, hasCI, hasLinting) {
  logMessage("Configuration Summary", MESSAGE_TYPES.SECTION);
  logMessage(
    `Selected tools: ${selectedTools.length > 0 ? selectedTools.join(", ") : "none"}`,
    MESSAGE_TYPES.INFO,
  );
  logMessage(
    `CI integration: ${hasCI ? "enabled" : "disabled"}`,
    MESSAGE_TYPES.INFO,
  );
  logMessage(
    `Accessibility linting: ${hasLinting ? "enabled" : "disabled"}`,
    MESSAGE_TYPES.INFO,
  );
}

/**
 * Displays next steps and helpful information to the user
 * @param {string[]} selectedTools - Array of selected accessibility tools
 * @param {string} packageManagerCommand - The package manager command prefix
 * @param {boolean} hasCI - Whether CI integration is enabled
 * @param {boolean} hasLinting - Whether accessibility linting is enabled
 */
export function displayNextSteps(
  selectedTools,
  packageManagerCommand,
  hasCI,
  hasLinting,
) {
  logMessage("Setup completed successfully!", MESSAGE_TYPES.HEADER);

  if (selectedTools.length > 0) {
    displayTestingInstructions(selectedTools, packageManagerCommand);
  }

  if (hasLinting) {
    displayLintingInstructions(packageManagerCommand);
  }

  if (selectedTools.length > 0) {
    displayResourceLinks(selectedTools);
  }
}

/**
 * Displays instructions for running accessibility tests
 * @param {string[]} selectedTools - Array of selected accessibility tools
 * @param {string} packageManagerCommand - The package manager command prefix
 */
function displayTestingInstructions(selectedTools, packageManagerCommand) {
  logMessage("Next steps:", MESSAGE_TYPES.SECTION);
  logMessage("1. Start your development server", MESSAGE_TYPES.INFO);
  logMessage("2. Run your accessibility tests:", MESSAGE_TYPES.INFO);

  selectedTools.forEach((tool) => {
    logMessage(
      `   • ${packageManagerCommand} a11y:${tool}`,
      MESSAGE_TYPES.COMMAND,
    );
  });

  if (selectedTools.length > 1) {
    logMessage(
      `   • ${packageManagerCommand} a11y:all (runs all tests)`,
      MESSAGE_TYPES.COMMAND,
    );
  }
}

/**
 * Displays linting setup instructions
 * @param {string} packageManagerCommand - The package manager command prefix
 */
function displayLintingInstructions(packageManagerCommand) {
  logMessage("Linting Setup Complete:", MESSAGE_TYPES.SECTION);
  logMessage(
    "Your editor will now show accessibility warnings in JSX files.",
    MESSAGE_TYPES.INFO,
  );
  logMessage(
    `Run your linter to see accessibility issues: ${packageManagerCommand} lint`,
    MESSAGE_TYPES.COMMAND,
  );
}

/**
 * Displays helpful resource links for the selected tools
 * @param {string[]} selectedTools - Array of selected accessibility tools
 */
function displayResourceLinks(selectedTools) {
  logMessage(
    "For more information about your selected tools:",
    MESSAGE_TYPES.SECTION,
  );

  selectedTools.forEach((tool) => {
    if (RESOURCE_LINKS[tool]) {
      logMessage(RESOURCE_LINKS[tool], MESSAGE_TYPES.INFO);
    }
  });

  logMessage(RESOURCE_LINKS.WCAG, MESSAGE_TYPES.INFO);
}
