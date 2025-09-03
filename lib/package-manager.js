import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { PACKAGE_MANAGERS, LOCK_FILES, COLORS } from "./constants.js";
import { formatExternalOutput } from "./logger.js";

/**
 * Detects the package manager being used in the current project
 * @param {string} workingDirectory - The working directory to check
 * @returns {string} The detected package manager
 */
export function detectPackageManager(workingDirectory = process.cwd()) {
  for (const [manager, lockFile] of Object.entries(LOCK_FILES)) {
    if (fs.existsSync(path.join(workingDirectory, lockFile))) {
      return manager;
    }
  }
  return PACKAGE_MANAGERS.NPM;
}

/**
 * Builds the install command for the detected package manager
 * @param {string|string[]} packages - Package(s) to install
 * @param {boolean} isDevelopmentDependency - Whether to install as dev dependency
 * @param {string} packageManager - The package manager to use
 * @returns {string} The install command
 */
export function buildInstallCommand(
  packages,
  isDevelopmentDependency = true,
  packageManager
) {
  const packagesList = Array.isArray(packages) ? packages.join(" ") : packages;

  const commands = {
    [PACKAGE_MANAGERS.YARN]: `yarn add ${isDevelopmentDependency ? "-D " : ""}${packagesList}`,
    [PACKAGE_MANAGERS.PNPM]: `pnpm add ${isDevelopmentDependency ? "-D " : ""}${packagesList}`,
    [PACKAGE_MANAGERS.NPM]: `npm install ${isDevelopmentDependency ? "--save-dev " : ""}${packagesList}`,
  };

  return commands[packageManager];
}

/**
 * Installs packages using the detected package manager
 * @param {string|string[]} packages - Package(s) to install
 * @param {boolean} isDevelopmentDependency - Whether to install as dev dependency
 * @param {string} packageManager - The package manager to use
 */
export function installPackages(
  packages,
  isDevelopmentDependency = true,
  packageManager
) {
  const command = buildInstallCommand(
    packages,
    isDevelopmentDependency,
    packageManager
  );

  try {
    console.log();
    console.log(
      `${COLORS.GRAY}${COLORS.DIM}┌─ Package manager output:${COLORS.RESET}`
    );

    const output = execSync(command, {
      encoding: "utf8",
      stdio: "pipe",
    });

    if (output && output.trim()) {
      const formattedOutput = formatExternalOutput(output);
      console.log(formattedOutput);
    }

    console.log(
      `${COLORS.GRAY}${COLORS.DIM}└─ Package installation completed${COLORS.RESET}`
    );
    console.log();
  } catch (error) {
    console.log(
      `${COLORS.GRAY}${COLORS.DIM}└─ Package installation completed with warnings${COLORS.RESET}`
    );
    console.log();
  }
}

/**
 * Gets the command prefix for running scripts with the package manager
 * @param {string} packageManager - The package manager being used
 * @returns {string} The command prefix (e.g., "npm run", "yarn")
 */
export function getPackageManagerCommand(packageManager) {
  return packageManager === PACKAGE_MANAGERS.NPM ? "npm run" : packageManager;
}
