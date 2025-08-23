#!/usr/bin/env node
import prompts from "prompts";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

function detectPkgManager() {
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm";
  return "npm";
}

const PACKAGE_MANAGER = detectPkgManager();

function install(pkgs, dev = true) {
  let cmd = "";
  const pkgsList = Array.isArray(pkgs) ? pkgs.join(" ") : pkgs;

  if (PACKAGE_MANAGER === "yarn") {
    cmd = `yarn add ${dev ? "-D " : ""}${pkgsList}`;
  } else if (PACKAGE_MANAGER === "pnpm") {
    cmd = `pnpm add ${dev ? "-D " : ""}${pkgsList}`;
  } else {
    cmd = `npm install ${dev ? "--save-dev " : ""}${pkgsList}`;
  }

  console.log(`➡️ Installing: ${pkgsList} with ${PACKAGE_MANAGER}...`);
  execSync(cmd, { stdio: "inherit" });
}

function copyFileFromTemplate(srcFile, destDir = ".") {
  const srcPath = path.join(__dirname, "template-files", srcFile);
  const targetPath = path.join(process.cwd(), destDir, path.basename(srcFile));

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(srcPath, targetPath);
}

const run = async () => {
  console.log("🚀 Welcome to ally-my-app setup!");

  const { axe } = await prompts({
    type: "toggle",
    name: "axe",
    message: "Would you like to add Axe accessibility testing?",
    initial: true,
    active: "yes",
    inactive: "no",
  });

  const { pa11y } = await prompts({
    type: "toggle",
    name: "pa11y",
    message: "Would you like to add Pa11y accessibility testing?",
    initial: true,
    active: "yes",
    inactive: "no",
  });

  const { lighthouse } = await prompts({
    type: "toggle",
    name: "lighthouse",
    message: "Would you like to add Lighthouse accessibility testing?",
    initial: true,
    active: "yes",
    inactive: "no",
  });

  const tools = [];
  if (axe) tools.push("axe");
  if (pa11y) tools.push("pa11y");
  if (lighthouse) tools.push("lighthouse");

  // 2. CI integration - to be added later
  // const { ci } = await prompts({
  //   type: "toggle",
  //   name: "ci",
  //   message: "Would you like to integrate them into your CI workflow?",
  //   initial: true,
  //   active: "yes",
  //   inactive: "no",
  // });

  // 3. Accessibility linting
  const { lint } = await prompts({
    type: "toggle",
    name: "lint",
    message: "Enable accessibility linting (jsx-a11y)?",
    initial: true,
    active: "yes",
    inactive: "no",
  });

  console.log("\n✅ Config chosen:");
  console.log({ tools, ci, lint });

  const NAMES_TO_DEPS = {
    pa11y: "pa11y",
    axe: "@axe-core/cli",
    lighthouse: "@lhci/cli",
  };

  // execution

  if (tools.length > 0) {
    console.log("📦 Installing accessibility testing tools...");
    install(tools.map((tool) => NAMES_TO_DEPS[tool]));

    if (tools.includes("lighthouse")) {
      console.log("⚙️ Adding Lighthouse config...");
      copyFileFromTemplate("lighthouserc.json");
    }
  }

  const pkgPath = path.join(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  if (!pkg.scripts) pkg.scripts = {};

  if (tools.length > 0) {
    console.log("⚙️ Adding scripts to package.json...");
  }

  if (tools.includes("axe")) {
    pkg.scripts["a11y:axe"] = "axe http://localhost:3000 --exit";
  }
  if (tools.includes("pa11y")) {
    pkg.scripts["a11y:pa11y"] =
      "pa11y --standard WCAG2AA --timeout 30000 --wait 2000 --include-warnings http://localhost:3000";
  }
  if (tools.includes("lighthouse")) {
    pkg.scripts["a11y:lighthouse"] = "lhci autorun";
  }

  const pmCmd = PACKAGE_MANAGER === "npm" ? "npm run" : PACKAGE_MANAGER;
  const cmds = [];

  if (tools.length > 0) {
    if (tools.includes("axe")) cmds.push(`${pmCmd} a11y:axe`);
    if (tools.includes("pa11y")) cmds.push(`${pmCmd} a11y:pa11y`);
    if (tools.includes("lighthouse")) cmds.push(`${pmCmd} a11y:lighthouse`);

    if (cmds.length > 0) {
      pkg.scripts["a11y:all"] = `concurrently "${cmds.join('" "')}"`;
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  if (cmds.length > 0) {
    install(["concurrently"]);
  }

  console.log("✅ Added accessibility scripts to package.json");

  if (lint) {
    console.log("📦 Adding eslint-plugin-jsx-a11y...");
    install(["eslint-plugin-jsx-a11y"]);

    const eslintPath = path.join(process.cwd(), "eslint.config.js");
    if (fs.existsSync(eslintPath)) {
      let content = fs.readFileSync(eslintPath, "utf-8");

      if (!content.includes('import jsxA11y from "eslint-plugin-jsx-a11y"')) {
        content = content.replace(
          /(import.*?from.*?['"].*['"];?\s*)/s,
          `$1import jsxA11y from "eslint-plugin-jsx-a11y";\n`
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

      fs.writeFileSync(eslintPath, content);
      console.log("✅ Updated eslint.config.js with jsx-a11y plugin");
    }
  }

  console.log("\n✨ Done! Your project is now boosted with accessibility!");
};

run();
