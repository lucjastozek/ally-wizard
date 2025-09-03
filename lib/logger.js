import { COLORS, MESSAGE_TYPES } from "./constants.js";

/**
 * Logs a formatted message to the console with appropriate styling
 * @param {string} message - The message to log
 * @param {string} type - The type of message (from MESSAGE_TYPES)
 */
export function logMessage(message, type = MESSAGE_TYPES.INFO) {
  const separator = "─".repeat(60);
  const messageFormatters = {
    [MESSAGE_TYPES.HEADER]: () => {
      console.log(
        `\n${COLORS.MAGENTA}${COLORS.BRIGHT}╭${separator}╮${COLORS.RESET}`
      );
      console.log(
        `${COLORS.MAGENTA}${COLORS.BRIGHT}│ ${message.padEnd(58)} │${COLORS.RESET}`
      );
      console.log(
        `${COLORS.MAGENTA}${COLORS.BRIGHT}╰${separator}╯${COLORS.RESET}\n`
      );
    },
    [MESSAGE_TYPES.SECTION]: () => {
      console.log(`\n${COLORS.RESET}${COLORS.BRIGHT}${message}${COLORS.RESET}`);
    },
    [MESSAGE_TYPES.SUCCESS]: () => {
      console.log(
        `${COLORS.GREEN}${COLORS.BRIGHT}✓ ${COLORS.RESET}${message}${COLORS.RESET}`
      );
    },
    [MESSAGE_TYPES.INFO]: () => {
      console.log(`${COLORS.CYAN}• ${COLORS.RESET}${message}${COLORS.RESET}`);
    },
    [MESSAGE_TYPES.WARNING]: () => {
      console.log(
        `${COLORS.YELLOW}⚠ ${COLORS.RESET}${message}${COLORS.RESET}`
      );
    },
    [MESSAGE_TYPES.COMMAND]: () => {
      console.log(
        `${COLORS.MAGENTA}  ${COLORS.RESET}${message}${COLORS.RESET}`
      );
    },
    [MESSAGE_TYPES.EXTERNAL]: () => {
      console.log(`${COLORS.GRAY}${COLORS.DIM}  ${message}${COLORS.RESET}`);
    },
  };

  const formatter =
    messageFormatters[type] || messageFormatters[MESSAGE_TYPES.INFO];

  formatter();
}

/**
 * Formats external command output with consistent styling
 * @param {string} output - Raw output from external command
 * @returns {string} Formatted output string
 */
export function formatExternalOutput(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `${COLORS.GRAY}${COLORS.DIM}  ${line}${COLORS.RESET}`)
    .join("\n");
}
