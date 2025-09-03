import prompts from "prompts";
import { ACCESSIBILITY_TOOLS } from "./constants.js";

/**
 * Prompts user for their accessibility tool preferences
 * @returns {Promise<Object>} Object containing selectedTools and additional preferences
 */
export async function getUserPreferences() {
  const toolPreferences = await prompts([
    {
      type: "toggle",
      name: ACCESSIBILITY_TOOLS.AXE,
      message: "Would you like to add Axe accessibility testing?",
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: "toggle",
      name: ACCESSIBILITY_TOOLS.PA11Y,
      message: "Would you like to add Pa11y accessibility testing?",
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: "toggle",
      name: ACCESSIBILITY_TOOLS.LIGHTHOUSE,
      message: "Would you like to add Lighthouse accessibility testing?",
      initial: true,
      active: "yes",
      inactive: "no",
    },
  ]);

  const selectedTools = Object.entries(toolPreferences)
    .filter(([_, isSelected]) => isSelected)
    .map(([toolName]) => toolName);

  const additionalPreferences = {};

  if (selectedTools.length > 0) {
    const ciPreference = await prompts({
      type: "toggle",
      name: "ci",
      message: "Would you like to integrate them into your CI workflow?",
      initial: true,
      active: "yes",
      inactive: "no",
    });
    additionalPreferences.ci = ciPreference.ci;
  } else {
    additionalPreferences.ci = false;
  }

  const lintPreference = await prompts({
    type: "toggle",
    name: "lint",
    message: "Enable accessibility linting (jsx-a11y)?",
    initial: true,
    active: "yes",
    inactive: "no",
  });
  additionalPreferences.lint = lintPreference.lint;

  return {
    selectedTools,
    ...additionalPreferences,
  };
}
