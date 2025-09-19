#!/usr/bin/env node

import { detectPackageManager } from "./lib/package-manager.js";
import { getUserPreferences } from "./lib/user-input.js";
import { generateCIWorkflow } from "./lib/workflow-generator.js";
import { setupAccessibilityLinting } from "./lib/eslint-config.js";
import { logMessage } from "./lib/logger.js";
import { MESSAGE_TYPES } from "./lib/constants.js";
import {
  installSelectedTools,
  updatePackageJsonWithScripts,
  displayConfigurationSummary,
  displayNextSteps,
} from "./lib/setup-manager.js";

async function runApplication() {
  try {
    logMessage("Welcome to Ally Wizard!", MESSAGE_TYPES.HEADER);

    const packageManager = detectPackageManager();
    const { selectedTools, ci, lint } = await getUserPreferences();

    displayConfigurationSummary(selectedTools, ci, lint);

    installSelectedTools(selectedTools, packageManager);

    let packageManagerCommand = "";

    if (selectedTools.length > 0) {
      logMessage(
        "Adding accessibility scripts to package.json",
        MESSAGE_TYPES.SECTION,
      );

      packageManagerCommand = updatePackageJsonWithScripts(
        selectedTools,
        packageManager,
      );

      logMessage(
        "Successfully added accessibility scripts to package.json",
        MESSAGE_TYPES.SUCCESS,
      );
    }

    if (ci && selectedTools.length > 0) {
      logMessage(
        "Setting up CI/CD workflow for accessibility testing",
        MESSAGE_TYPES.SECTION,
      );
      generateCIWorkflow(selectedTools);
      logMessage(
        "Accessibility workflow generated successfully!",
        MESSAGE_TYPES.SUCCESS,
      );
    }

    if (lint) {
      setupAccessibilityLinting(packageManager);
    }

    displayNextSteps(selectedTools, packageManagerCommand, ci, lint);
  } catch (error) {
    logMessage(`An error occurred: ${error.message}`, MESSAGE_TYPES.WARNING);
    logMessage("Please check your setup and try again.", MESSAGE_TYPES.INFO);

    process.exit(1);
  }
}

runApplication();
