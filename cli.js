#!/usr/bin/env node

import fs from "fs";
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

function validateReactViteProject() {
  if (!fs.existsSync("package.json")) {
    logMessage(
      "No package.json found. Please run this command in a Node.js project directory.",
      MESSAGE_TYPES.ERROR
    );
    logMessage(
      "To create a new React + Vite project, run:",
      MESSAGE_TYPES.INFO
    );
    logMessage("npm create vite", MESSAGE_TYPES.COMMAND);
    process.exit(1);
  }

  try {
    const packageData = JSON.parse(fs.readFileSync("package.json", "utf-8"));

    const hasReact =
      packageData.dependencies?.react || packageData.devDependencies?.react;

    const hasVite =
      packageData.dependencies?.vite || packageData.devDependencies?.vite;

    if (!hasReact || !hasVite) {
      logMessage(
        "This tool only works with React + Vite projects.",
        MESSAGE_TYPES.ERROR
      );
      logMessage(
        "To create a new React + Vite project, run:",
        MESSAGE_TYPES.INFO
      );
      logMessage("npm create vite", MESSAGE_TYPES.COMMAND);
      process.exit(1);
    }

    logMessage("Detected React + Vite project", MESSAGE_TYPES.SUCCESS);
  } catch (error) {
    logMessage(
      "Could not read package.json. Please ensure it's valid JSON.",
      MESSAGE_TYPES.ERROR
    );
    process.exit(1);
  }
}

async function runApplication() {
  try {
    logMessage("Welcome to Ally Wizard!", MESSAGE_TYPES.HEADER);

    validateReactViteProject();

    const packageManager = detectPackageManager();
    const { selectedTools, ci, lint } = await getUserPreferences();

    displayConfigurationSummary(selectedTools, ci, lint);

    installSelectedTools(selectedTools, packageManager);

    let packageManagerCommand = "";

    if (selectedTools.length > 0) {
      logMessage(
        "Adding accessibility scripts to package.json",
        MESSAGE_TYPES.SECTION
      );

      packageManagerCommand = updatePackageJsonWithScripts(
        selectedTools,
        packageManager
      );

      logMessage(
        "Successfully added accessibility scripts to package.json",
        MESSAGE_TYPES.SUCCESS
      );
    }

    if (ci && selectedTools.length > 0) {
      logMessage(
        "Setting up CI/CD workflow for accessibility testing",
        MESSAGE_TYPES.SECTION
      );
      generateCIWorkflow(selectedTools);
      logMessage(
        "Accessibility workflow generated successfully!",
        MESSAGE_TYPES.SUCCESS
      );
    }

    if (lint) {
      setupAccessibilityLinting(packageManager);
    }

    displayNextSteps(selectedTools, packageManagerCommand, ci, lint);
  } catch (error) {
    logMessage(`An error occurred: ${error.message}`, MESSAGE_TYPES.ERROR);
    logMessage("Please check your setup and try again.", MESSAGE_TYPES.INFO);

    process.exit(1);
  }
}

runApplication();
