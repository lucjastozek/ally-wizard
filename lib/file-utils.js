import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Copies a template file from the template-files directory to the target location
 * @param {string} sourceFileName - Name of the source file in template-files
 * @param {string} destinationDirectory - Target directory (relative to cwd)
 */
export function copyTemplateFile(sourceFileName, destinationDirectory = ".") {
  const sourcePath = path.join(
    __dirname,
    "..",
    "template-files",
    sourceFileName
  );
  const targetPath = path.join(
    process.cwd(),
    destinationDirectory,
    path.basename(sourceFileName)
  );

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

/**
 * Reads and parses package.json from the current working directory
 * @returns {Object} Parsed package.json content
 */
export function readPackageJson() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
}

/**
 * Writes package.json to the current working directory
 * @param {Object} packageData - Package.json data to write
 */
export function writePackageJson(packageData) {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
}

/**
 * Creates a directory recursively if it doesn't exist
 * @param {string} dirPath - Path to the directory to create
 */
export function ensureDirectoryExists(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Writes content to a file, creating directories as needed
 * @param {string} filePath - Path to the file to write
 * @param {string} content - Content to write to the file
 */
export function writeFile(filePath, content) {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

/**
 * Checks if a file exists
 * @param {string} filePath - Path to the file to check
 * @returns {boolean} True if the file exists
 */
export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Reads a file's content
 * @param {string} filePath - Path to the file to read
 * @returns {string} File content
 */
export function readFile(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}
