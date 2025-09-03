import path from "path";
import { ACCESSIBILITY_TOOLS } from "./constants.js";
import { writeFile } from "./file-utils.js";

/**
 * Generates CI workflow content for accessibility testing
 * @param {string[]} selectedTools - Array of selected accessibility tools
 * @returns {string} Complete workflow YAML content
 */
function generateWorkflowContent(selectedTools) {
  const toolsArray = `[${selectedTools.map((tool) => (tool === ACCESSIBILITY_TOOLS.AXE ? "axe-core" : tool)).join(", ")}]`;

  return `name: Accessibility Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TEST_BASE_URL: http://localhost:3000
  TEST_PAGES: "/"

jobs:
  setup:
    name: Setup and build
    runs-on: ubuntu-latest
    outputs:
      cache-key: \${{ steps.cache-key.outputs.key }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "yarn"

      - name: Generate cache key
        id: cache-key
        run: echo "key=\${{ runner.os }}-a11y-node20-\${{ hashFiles('yarn.lock') }}" >> $GITHUB_OUTPUT

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: node_modules
          key: \${{ steps.cache-key.outputs.key }}
          restore-keys: |
            \${{ runner.os }}-a11y-node20-

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build site
        run: yarn build

      - name: Cache build output
        uses: actions/cache@v4
        with:
          path: dist
          key: \${{ runner.os }}-build-\${{ github.sha }}

${selectedTools.includes(ACCESSIBILITY_TOOLS.AXE) ? generateAxeJob() : ""}
${selectedTools.includes(ACCESSIBILITY_TOOLS.LIGHTHOUSE) ? generateLighthouseJob() : ""}
${selectedTools.includes(ACCESSIBILITY_TOOLS.PA11Y) ? generatePa11yJob() : ""}

  accessibility-comment:
    name: Accessibility Test Summary Comment
    runs-on: ubuntu-latest
    needs: ${toolsArray}
    if: always() && github.event_name == 'pull_request'
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Create accessibility summary comment
        uses: actions/github-script@v7
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');

            // Find and delete any existing accessibility comments
            const comments = await github.rest.issues.listComments({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
            });

            const accessibilityComments = comments.data.filter(comment => 
              comment.body.includes('🔍 Accessibility Test Results') &&
              comment.body.includes('🤖 This comment was automatically generated')
            );

            for (const comment of accessibilityComments) {
              try {
                await github.rest.issues.deleteComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  comment_id: comment.id,
                });
              } catch (error) {
                console.log(\`Could not delete comment \${comment.id}: \${error.message}\`);
              }
            }

            // Get job results
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.AXE) ? `const axeResult = '\${{ needs.axe-core.result }}';` : ""}
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.LIGHTHOUSE) ? `const lighthouseResult = '\${{ needs.lighthouse.result }}';` : ""}
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.PA11Y) ? `const pa11yResult = '\${{ needs.pa11y.result }}';` : ""}

            function getStatusDisplay(result) {
              switch(result) {
                case 'success': return { emoji: '✅', text: 'Passed' };
                case 'failure': return { emoji: '❌', text: 'Failed' };
                case 'cancelled': return { emoji: '⏭️', text: 'Cancelled' };
                case 'skipped': return { emoji: '⚪', text: 'Skipped' };
                default: return { emoji: '❓', text: 'Unknown' };
              }
            }

            ${selectedTools.includes(ACCESSIBILITY_TOOLS.AXE) ? `const axeStatus = getStatusDisplay(axeResult);` : ""}
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.LIGHTHOUSE) ? `const lighthouseStatus = getStatusDisplay(lighthouseResult);` : ""}
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.PA11Y) ? `const pa11yStatus = getStatusDisplay(pa11yResult);` : ""}

            const comment = \`## 🔍 Accessibility Test Results

            | Tool | Status | Result |
            |------|--------|--------|
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.AXE) ? `| **Axe Core** | \${axeStatus.emoji} | \${axeStatus.text} |` : ""}
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.LIGHTHOUSE) ? `| **Lighthouse** | \${lighthouseStatus.emoji} | \${lighthouseStatus.text} |` : ""}
            ${selectedTools.includes(ACCESSIBILITY_TOOLS.PA11Y) ? `| **Pa11y** | \${pa11yStatus.emoji} | \${pa11yStatus.text} |` : ""}

            Download detailed results from the **Artifacts** section of this workflow run.

            ---
            <sub>🤖 This comment was automatically generated by the accessibility testing workflow</sub>\`;

            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

  accessibility-summary:
    name: Accessibility Test Summary
    runs-on: ubuntu-latest
    needs: ${toolsArray}
    if: always()
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Create accessibility summary
        run: |
          echo "# 🔍 Accessibility Test Results" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY

          ${
            selectedTools.includes(ACCESSIBILITY_TOOLS.AXE)
              ? `if [ "\${{ needs.axe-core.result }}" = "success" ]; then
            echo "✅ **Axe Core**: All accessibility tests passed" >> $GITHUB_STEP_SUMMARY
          else
            echo "❌ **Axe Core**: Accessibility issues found" >> $GITHUB_STEP_SUMMARY
          fi`
              : ""
          }
          ${
            selectedTools.includes(ACCESSIBILITY_TOOLS.LIGHTHOUSE)
              ? `if [ "\${{ needs.lighthouse.result }}" = "success" ]; then
            echo "✅ **Lighthouse**: Performance and accessibility scores met thresholds" >> $GITHUB_STEP_SUMMARY
          else
            echo "⚠️ **Lighthouse**: Performance or accessibility scores below threshold" >> $GITHUB_STEP_SUMMARY
          fi`
              : ""
          }
          ${
            selectedTools.includes(ACCESSIBILITY_TOOLS.PA11Y)
              ? `if [ "\${{ needs.pa11y.result }}" = "success" ]; then
            echo "✅ **Pa11y**: No accessibility violations detected" >> $GITHUB_STEP_SUMMARY
          else
            echo "❌ **Pa11y**: Accessibility violations found" >> $GITHUB_STEP_SUMMARY
          fi`
              : ""
          }
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "📊 **Test artifacts are available for download in the workflow run**" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY`;
}

/**
 * Generates the Axe Core job configuration
 * @returns {string} Axe job YAML configuration
 */
function generateAxeJob() {
  return `
  axe-core:
    name: Axe Core Accessibility Testing
    runs-on: ubuntu-latest
    needs: setup
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "yarn"

      - name: Restore dependencies
        uses: actions/cache@v4
        with:
          path: node_modules
          key: \${{ needs.setup.outputs.cache-key }}

      - name: Restore build output
        uses: actions/cache@v4
        with:
          path: dist
          key: \${{ runner.os }}-build-\${{ github.sha }}

      - name: Start preview server
        run: |
          yarn preview --port 3000 &
          npx wait-on http://localhost:3000 --timeout 60000

      - name: Install Axe CLI and browser drivers
        run: |
          npm install -g @axe-core/cli
          npx browser-driver-manager install chrome

      - name: Run Axe accessibility tests
        run: |
          mkdir -p axe-results
          axe http://localhost:3000 --save axe-results/axe-results.json --tags wcag2a,wcag2aa,wcag21aa --exit

      - name: Upload Axe results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: axe-accessibility-results
          path: axe-results/`;
}

/**
 * Generates the Lighthouse job configuration
 * @returns {string} Lighthouse job YAML configuration
 */
function generateLighthouseJob() {
  return `
  lighthouse:
    name: Lighthouse Accessibility & Performance
    runs-on: ubuntu-latest
    needs: setup
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "yarn"

      - name: Restore dependencies
        uses: actions/cache@v4
        with:
          path: node_modules
          key: \${{ needs.setup.outputs.cache-key }}

      - name: Restore build output
        uses: actions/cache@v4
        with:
          path: dist
          key: \${{ runner.os }}-build-\${{ github.sha }}

      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli

      - name: Start preview server
        run: |
          yarn preview --port 3000 &
          npx wait-on http://localhost:3000 --timeout 60000

      - name: Run Lighthouse CI
        run: lhci autorun

      - name: Collect Lighthouse artifacts
        if: always()
        run: |
          mkdir -p lighthouse-results
          if [ -d ".lighthouseci" ]; then
            cp -r .lighthouseci/* lighthouse-results/ 2>/dev/null || true
          fi
          if [ -d "lhci_reports" ]; then
            cp -r lhci_reports/* lighthouse-results/ 2>/dev/null || true
          fi

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-results
          path: lighthouse-results/`;
}

/**
 * Generates the Pa11y job configuration
 * @returns {string} Pa11y job YAML configuration
 */
function generatePa11yJob() {
  return `
  pa11y:
    name: Pa11y Accessibility Testing
    runs-on: ubuntu-latest
    needs: setup
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "yarn"

      - name: Restore dependencies
        uses: actions/cache@v4
        with:
          path: node_modules
          key: \${{ needs.setup.outputs.cache-key }}

      - name: Restore build output
        uses: actions/cache@v4
        with:
          path: dist
          key: \${{ runner.os }}-build-\${{ github.sha }}

      - name: Install Pa11y
        run: npm install -g pa11y

      - name: Start preview server
        run: |
          yarn preview --port 3000 &
          npx wait-on http://localhost:3000 --timeout 60000

      - name: Run Pa11y accessibility tests
        env:
          PUPPETEER_EXECUTABLE_PATH: /usr/bin/google-chrome-stable
        run: |
          mkdir -p pa11y-results
          export PUPPETEER_LAUNCH_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --headless"
          pa11y http://localhost:3000 --reporter json > pa11y-results/pa11y-results.json || true
          pa11y http://localhost:3000 --reporter cli

      - name: Upload Pa11y results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: pa11y-accessibility-results
          path: pa11y-results/`;
}

/**
 * Generates and writes the CI workflow file
 * @param {string[]} selectedTools - Array of selected accessibility tools
 */
export function generateCIWorkflow(selectedTools) {
  const WORKFLOWS_DIR = "./.github/workflows";
  const workflowContent = generateWorkflowContent(selectedTools);
  writeFile(path.join(WORKFLOWS_DIR, "accessibility.yml"), workflowContent);
}
