#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Colors for terminal output
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

/**
 * Fix duplicate capabilities sections in system prompt files
 * @param {string} projectRoot - Path to the project root
 * @returns {boolean} - True if fixes were successful
 */
function fixDuplicateCapabilities(projectRoot) {
  console.log(
    "\nChecking system prompt files for duplicate capabilities sections..."
  );

  const systemPromptFiles = [
    ".roo/system-prompt-architect",
    ".roo/system-prompt-ask",
    ".roo/system-prompt-code",
    ".roo/system-prompt-debug",
    ".roo/system-prompt-test",
  ];

  let fixesMade = false;

  for (const file of systemPromptFiles) {
    const filePath = path.join(projectRoot, file);

    if (!fs.existsSync(filePath)) {
      console.log(`  ${BLUE}${file}${RESET}: File not found, skipping`);
      continue;
    }

    // Read file content
    const content = fs.readFileSync(filePath, "utf8");

    // Simple check: Count how many times "capabilities:" appears at line start
    const matches = content.match(/^capabilities:/gm);
    if (!matches || matches.length <= 1) {
      console.log(`  ${BLUE}${file}${RESET}: No duplicate capabilities found`);
      continue;
    }

    console.log(
      `  ${BLUE}${file}${RESET}: Found ${matches.length} capabilities sections`
    );

    // Split the file into YAML documents (sections)
    // Each section starts with a non-indented line
    const sections = splitIntoSections(content);

    // Now find all capabilities sections
    const capabilitiesSections = [];
    const otherSections = [];

    sections.forEach((section) => {
      if (section.startsWith("capabilities:")) {
        capabilitiesSections.push(section);
      } else {
        otherSections.push(section);
      }
    });

    // If we have multiple capabilities sections, keep only the first one
    if (capabilitiesSections.length > 1) {
      // Actually use js-yaml to parse and validate the first capabilities section
      try {
        // We need to add a root element to make it a valid YAML document
        const yamlStr =
          "temp_root:\n" +
          capabilitiesSections[0]
            .split("\n")
            .map((line) => "  " + line)
            .join("\n");

        // Parse the YAML to validate it
        yaml.load(yamlStr);

        // If parsing succeeds, keep only the first capabilities section
        const newContent = [
          ...otherSections.slice(
            0,
            otherSections.findIndex((s) => s.startsWith("mode:")) + 1
          ),
          capabilitiesSections[0],
          ...otherSections.slice(
            otherSections.findIndex((s) => s.startsWith("mode:")) + 1
          ),
        ].join("");

        // Write the fixed content back to the file
        fs.writeFileSync(filePath, newContent, "utf8");

        console.log(
          `  ${GREEN}Fixed${RESET}: Kept first capabilities section in ${BLUE}${file}${RESET}`
        );
        fixesMade = true;
      } catch (yamlError) {
        console.error(
          `  ${RED}Error${RESET}: Failed to parse capabilities section in ${BLUE}${file}${RESET}: ${yamlError.message}`
        );
        // Try the second section if the first one failed to parse
        try {
          const yamlStr =
            "temp_root:\n" +
            capabilitiesSections[1]
              .split("\n")
              .map((line) => "  " + line)
              .join("\n");

          yaml.load(yamlStr);

          const newContent = [
            ...otherSections.slice(
              0,
              otherSections.findIndex((s) => s.startsWith("mode:")) + 1
            ),
            capabilitiesSections[1],
            ...otherSections.slice(
              otherSections.findIndex((s) => s.startsWith("mode:")) + 1
            ),
          ].join("");

          fs.writeFileSync(filePath, newContent, "utf8");

          console.log(
            `  ${GREEN}Fixed${RESET}: Used second capabilities section in ${BLUE}${file}${RESET} (first had YAML errors)`
          );
          fixesMade = true;
        } catch (secondYamlError) {
          console.error(
            `  ${RED}Error${RESET}: Both capabilities sections have YAML errors in ${BLUE}${file}${RESET}`
          );
        }
      }
    }
  }

  if (fixesMade) {
    console.log(
      `${GREEN}Fixed duplicate capabilities sections in system prompt files${RESET}`
    );
  } else {
    console.log("No duplicate capabilities sections found or fixed");
  }

  return true;
}

/**
 * Validate system prompt files using js-yaml
 * @param {string} projectRoot - Path to the project root
 * @returns {boolean} - True if all files are valid
 */
function validateFilesWithYaml(projectRoot) {
  console.log("\nValidating system prompt files with js-yaml...");

  const systemPromptFiles = [
    ".roo/system-prompt-architect",
    ".roo/system-prompt-ask",
    ".roo/system-prompt-code",
    ".roo/system-prompt-debug",
    ".roo/system-prompt-test",
  ];

  let allValid = true;

  for (const file of systemPromptFiles) {
    const filePath = path.join(projectRoot, file);

    if (!fs.existsSync(filePath)) {
      console.log(`  ${BLUE}${file}${RESET}: File not found, skipping`);
      continue;
    }

    // Read file content
    const content = fs.readFileSync(filePath, "utf8");

    // Check for duplicate capabilities sections first
    const matches = content.match(/^capabilities:/gm);
    if (matches && matches.length > 1) {
      console.log(
        `  ${YELLOW}Warning${RESET}: ${BLUE}${file}${RESET} still has ${matches.length} capabilities sections`
      );
      allValid = false;
      continue;
    }

    // Split into sections
    const sections = splitIntoSections(content);

    // Validate each section that looks like YAML with js-yaml
    let invalidSections = 0;

    for (const section of sections) {
      // Only try to validate sections that look like YAML
      if (section.includes(":")) {
        try {
          // Add temp root to make it a valid YAML document
          const yamlStr =
            "temp_root:\n" +
            section
              .split("\n")
              .map((line) => "  " + line)
              .join("\n");

          yaml.load(yamlStr);
        } catch (yamlError) {
          invalidSections++;
          console.log(
            `  ${YELLOW}Warning${RESET}: Invalid YAML in section starting with: ${section
              .substring(0, 40)
              .replace(/\n/g, "\\n")}...`
          );
          console.log(`    Error: ${yamlError.message}`);
        }
      }
    }

    if (invalidSections > 0) {
      console.log(
        `  ${YELLOW}Warning${RESET}: ${BLUE}${file}${RESET} has ${invalidSections} sections with YAML errors`
      );
    } else {
      console.log(
        `  ${GREEN}Valid${RESET}: ${BLUE}${file}${RESET} - All YAML sections validated successfully`
      );
    }
  }

  if (allValid) {
    console.log(
      `${GREEN}All system prompt files validated successfully${RESET}`
    );
  } else {
    console.log(
      `${YELLOW}Warning${RESET}: Some files have issues that may need attention`
    );
  }

  return allValid;
}

/**
 * Helper function to split content into sections
 * @param {string} content - File content
 * @returns {string[]} - Array of sections
 */
function splitIntoSections(content) {
  const sections = [];
  let currentSection = "";

  content.split("\n").forEach((line) => {
    if (line.trim() !== "" && !line.startsWith(" ") && !line.startsWith("\t")) {
      // This is the start of a new section
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = line + "\n";
    } else {
      currentSection += line + "\n";
    }
  });

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// Export the functions
module.exports = {
  fixDuplicateCapabilities,
  validateFilesWithYaml,
};
