#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const yamlSanitizer = require("./yaml-sanitizer"); // Import our YAML sanitizer module

// Colors for terminal output
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m"; // Added yellow for warnings
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

console.log("Rooflow Installer running...");
// Base URL for raw GitHub content
const REPO_BASE_URL =
  "https://raw.githubusercontent.com/GreatScottyMac/RooFlow/main/";

// Files to download from GitHub
const FILES = [
  {
    src: "config/.roo/system-prompt-architect",
    dest: ".roo/system-prompt-architect",
  },
  { src: "config/.roo/system-prompt-ask", dest: ".roo/system-prompt-ask" },
  { src: "config/.roo/system-prompt-code", dest: ".roo/system-prompt-code" },
  { src: "config/.roo/system-prompt-debug", dest: ".roo/system-prompt-debug" },
  { src: "config/.roo/system-prompt-test", dest: ".roo/system-prompt-test" },
  { src: "config/.roomodes", dest: ".roomodes" },
  { src: "config/insert-variables.cmd", dest: "insert-variables.cmd" },
  { src: "config/insert-variables.sh", dest: "insert-variables.sh" },
];

// Debug info for installation context
const isPostinstall = process.env.npm_lifecycle_event === "postinstall";
const scriptDir = __dirname;
const executionDir = process.cwd();

// Find project root (where package.json is)
function findProjectRoot() {
  // Most important: If we're being run as part of npm install in a directory,
  // npm sets npm_config_local_prefix to that directory
  if (process.env.npm_config_local_prefix) {
    return process.env.npm_config_local_prefix;
  }

  // Next check if we're being run from within node_modules
  if (scriptDir.includes("node_modules")) {
    // For any execution from within node_modules, use the parent project directory
    return path.resolve(scriptDir, "..", "..");
  }

  // For direct runs, use current working directory
  return process.cwd();
}

// Download a file from GitHub
function downloadFile(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = REPO_BASE_URL + srcPath;
    const destFullPath = path.join(findProjectRoot(), destPath);

    // Create directories if they don't exist
    const destDir = path.dirname(destFullPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    console.log(`  Downloading ${BLUE}${destPath}${RESET}...`);

    const file = fs.createWriteStream(destFullPath);
    https
      .get(fullUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download ${srcPath}: ${response.statusCode}`)
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(destFullPath, () => {}); // Delete the file if there was an error
        reject(err);
      });
  });
}

// Run insert-variables script
function runInsertVariablesScript() {
  console.log(
    "\nRunning insert-variables script to configure system variables..."
  );

  const isWindows = process.platform === "win32";
  const projectRoot = findProjectRoot();

  try {
    if (isWindows) {
      // Make insert-variables.sh executable and run it through bash if Git Bash is available
      try {
        fs.chmodSync(path.join(projectRoot, "insert-variables.sh"), "755");
        execSync("bash ./insert-variables.sh", {
          cwd: projectRoot,
          stdio: "inherit",
        });
      } catch (err) {
        // Fallback to cmd script if bash fails
        execSync("insert-variables.cmd", {
          cwd: projectRoot,
          stdio: "inherit",
        });
      }
    } else {
      // For non-Windows systems
      fs.chmodSync(path.join(projectRoot, "insert-variables.sh"), "755");
      execSync("./insert-variables.sh", {
        cwd: projectRoot,
        stdio: "inherit",
      });
    }
    return true;
  } catch (error) {
    console.error(`${RED}Failed to run insert-variables script${RESET}`);
    console.error("You may need to run it manually:");
    console.error(
      isWindows
        ? "  insert-variables.cmd or bash ./insert-variables.sh"
        : "  ./insert-variables.sh"
    );
    return false;
  }
}

function cleanupInsertVariablesScripts() {
  console.log("\nCleaning up insert-variables scripts...");
  const projectRoot = findProjectRoot();
  try {
    const cmdPath = path.join(projectRoot, "insert-variables.cmd");
    const shPath = path.join(projectRoot, "insert-variables.sh");
    if (fs.existsSync(cmdPath)) {
      fs.unlinkSync(cmdPath);
      console.log(`  Removed ${BLUE}insert-variables.cmd${RESET}`);
    }
    if (fs.existsSync(shPath)) {
      fs.unlinkSync(shPath);
      console.log(`  Removed ${BLUE}insert-variables.sh${RESET}`);
    }
    console.log(`${GREEN}Cleanup completed successfully${RESET}`);
  } catch (error) {
    console.error(
      `${YELLOW}Warning: Failed to clean up insert-variables scripts${RESET}`
    );
    console.error(`  Error: ${error.message}`);
  }
}

// Main installation function
async function install() {
  console.log(`${BLUE}RooFlow Installer${RESET}`);

  // Print installation context information (useful for debugging)
  console.log(`Installation details:`);
  console.log(`- Script directory: ${scriptDir}`);
  console.log(`- Working directory: ${executionDir}`);
  console.log(`- Running as postinstall: ${isPostinstall ? "Yes" : "No"}`);
  console.log(`- Target directory: ${findProjectRoot()}\n`);

  // Check if .roo directory exists, create if not
  const rooDir = path.join(findProjectRoot(), ".roo");
  if (!fs.existsSync(rooDir)) {
    console.log("Creating .roo directory...");
    fs.mkdirSync(rooDir, { recursive: true });
  }

  // Download all files
  console.log("Downloading files from GitHub...");
  try {
    for (const file of FILES) {
      await downloadFile(file.src, file.dest);
    }
    console.log(`\n${GREEN}All files downloaded successfully${RESET}`);
    yamlSanitizer.fixDuplicateCapabilities(findProjectRoot());
    if (process.platform !== "win32") {
      fs.chmodSync(path.join(findProjectRoot(), "insert-variables.sh"), "755");
    }
    const scriptSuccess = runInsertVariablesScript();

    const validationSuccess = yamlSanitizer.validateFilesWithYaml(
      findProjectRoot()
    );

    if (scriptSuccess) {
      cleanupInsertVariablesScripts();
      if (validationSuccess) {
        console.log(`\n${GREEN}RooFlow installation complete!${RESET}`);
        console.log("Your project is now configured to use RooFlow.");
        console.log("\nDirectory structure created:");
        console.log("  .roo/ - Contains system prompt files");
        console.log("  .roomodes - Mode configuration file");
        console.log(
          "\nThe memory-bank directory will be created automatically when you first use RooFlow."
        );
        console.log("\nTo start using RooFlow:");
        console.log("  1. Open your project in VS Code");
        console.log("  2. Ensure the Roo Code extension is installed");
        console.log('  3. Start a new Roo Code chat and say "Hello"');
      } else {
        console.log(
          `\n${YELLOW}RooFlow installation completed with warnings${RESET}`
        );
        console.log(
          "Some system prompt files may have YAML issues that need manual attention."
        );
        console.log(
          "Your project is configured to use RooFlow, but you may encounter issues."
        );
        console.log("\nTo fix YAML issues, you can run the validation again:");
        console.log("  node node_modules/rooflow/yaml-sanitizer.js");
      }

      console.log(
        "\nIf you have any issues with automatic installation, you can always:"
      );
      console.log('- Run "npm run setup" in your project');
      console.log('- Run "node node_modules/rooflow/install.js" directly');
    } else {
      console.error(`\n${RED}RooFlow installation encountered issues${RESET}`);
      console.error("The insert-variables script failed to run.");
      console.error("You may need to run it manually:");
      console.error(
        process.platform === "win32"
          ? "  insert-variables.cmd or bash ./insert-variables.sh"
          : "  ./insert-variables.sh"
      );
    }
  } catch (error) {
    console.error(`${RED}Error during installation:${RESET}`, error.message);
    process.exit(1);
  }
}

// Add error handler for better diagnostic information
process.on("uncaughtException", (error) => {
  console.error(`${RED}RooFlow Installer encountered an error:${RESET}`);
  console.error(error);
  console.error("\nIf installation failed, you can run it manually:");
  console.error("- npm run setup");
  console.error("- node node_modules/rooflow/install.js");
  process.exit(1);
});

// Run the installation
install().catch((error) => {
  console.error(`${RED}Installation failed:${RESET}`, error);
  process.exit(1);
});
