const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const assert = require("assert");
const os = require("os");

describe("RooFlow End-to-End Tests", function () {
  // Increase timeout for e2e tests
  this.timeout(60000);

  let testDir;

  // Setup test environment before tests
  before(function () {
    // Create a temporary directory for testing
    testDir = path.join(os.tmpdir(), `rooflow-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // Initialize a basic npm project
    execSync("npm init -y", { cwd: testDir });
  });

  // Clean up after tests
  after(function () {
    // Comment out to keep the test directory for inspection
    // fs.rmSync(testDir, { recursive: true, force: true });
    console.log(`Test directory: ${testDir}`);
  });

  it("should successfully install and run postinstall script", function () {
    // Get the path to the rooflow package (current directory)
    const packageDir = path.resolve(__dirname, "..");

    console.log(`Installing from ${packageDir}...`);

    // Use --foreground-scripts to ensure scripts run in the foreground
    const installOutput = execSync(
      `npm install --save-dev "${packageDir}" --foreground-scripts`,
      {
        cwd: testDir,
        stdio: "pipe",
        encoding: "utf8",
      }
    );

    // First assertion: Check if the installation script is running at all
    const installScriptRunning = installOutput.includes("Rooflow");
    if (!installScriptRunning) {
      const npmConfigOutput = execSync("npm config get ignore-scripts", {
        cwd: testDir,
        stdio: "pipe",
        encoding: "utf8",
      }).trim();
      console.warn(`Current npm ignore-scripts setting: ${npmConfigOutput}`);
    }

    assert.ok(
      installScriptRunning,
      "Expected installation script to run and output identifying text. The npm postinstall hook may not be executing."
    );
  });

  it("should create all expected files after installation", function () {
    // Verify expected files exist
    const expectedFiles = [
      ".roo/system-prompt-architect",
      ".roo/system-prompt-ask",
      ".roo/system-prompt-code",
      ".roo/system-prompt-debug",
      ".roo/system-prompt-test",
      ".roomodes",
    ];

    for (const file of expectedFiles) {
      const exists = fs.existsSync(path.join(testDir, file));
      assert.ok(exists, `Expected file ${file} to exist`);
    }
  });
});
