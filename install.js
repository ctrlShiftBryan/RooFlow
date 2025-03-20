#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Colors for terminal output
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// Base URL for raw GitHub content
const REPO_BASE_URL = 'https://raw.githubusercontent.com/GreatScottyMac/RooFlow/main/';

// Files to download from GitHub
const FILES = [
  { src: 'config/.roo/system-prompt-architect', dest: '.roo/system-prompt-architect' },
  { src: 'config/.roo/system-prompt-ask', dest: '.roo/system-prompt-ask' },
  { src: 'config/.roo/system-prompt-code', dest: '.roo/system-prompt-code' },
  { src: 'config/.roo/system-prompt-debug', dest: '.roo/system-prompt-debug' },
  { src: 'config/.roo/system-prompt-test', dest: '.roo/system-prompt-test' },
  { src: 'config/.roomodes', dest: '.roomodes' },
  { src: 'config/insert-variables.cmd', dest: 'insert-variables.cmd' },
  { src: 'config/insert-variables.sh', dest: 'insert-variables.sh' }
];

// Find project root (where package.json is)
function findProjectRoot() {
  // This will be the directory where the consuming package.json is located
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
    https.get(fullUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${srcPath}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destFullPath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Run insert-variables script
function runInsertVariablesScript() {
  console.log('\nRunning insert-variables script to configure system variables...');
  
  const isWindows = process.platform === 'win32';
  const projectRoot = findProjectRoot();
  
  try {
    if (isWindows) {
      // Make insert-variables.sh executable and run it through bash if Git Bash is available
      try {
        fs.chmodSync(path.join(projectRoot, 'insert-variables.sh'), '755');
        execSync('bash ./insert-variables.sh', { 
          cwd: projectRoot,
          stdio: 'inherit'
        });
      } catch (err) {
        // Fallback to cmd script if bash fails
        execSync('insert-variables.cmd', { 
          cwd: projectRoot,
          stdio: 'inherit'
        });
      }
    } else {
      // For non-Windows systems
      fs.chmodSync(path.join(projectRoot, 'insert-variables.sh'), '755');
      execSync('./insert-variables.sh', { 
        cwd: projectRoot,
        stdio: 'inherit'
      });
    }
    return true;
  } catch (error) {
    console.error(`${RED}Failed to run insert-variables script${RESET}`);
    console.error('You may need to run it manually:');
    console.error(isWindows ? '  insert-variables.cmd or bash ./insert-variables.sh' : '  ./insert-variables.sh');
    return false;
  }
}

// Main installation function
async function install() {
  console.log(`${BLUE}RooFlow Installer${RESET}`);
  console.log(`Installing into ${findProjectRoot()}\n`);
  
  // Check if .roo directory exists, create if not
  const rooDir = path.join(findProjectRoot(), '.roo');
  if (!fs.existsSync(rooDir)) {
    console.log('Creating .roo directory...');
    fs.mkdirSync(rooDir, { recursive: true });
  }
  
  // Download all files
  console.log('Downloading files from GitHub...');
  try {
    for (const file of FILES) {
      await downloadFile(file.src, file.dest);
    }
    console.log(`\n${GREEN}All files downloaded successfully${RESET}`);
  } catch (error) {
    console.error(`${RED}Error downloading files:${RESET}`, error.message);
    process.exit(1);
  }
  
  // Make insert-variables.sh executable
  if (process.platform !== 'win32') {
    fs.chmodSync(path.join(findProjectRoot(), 'insert-variables.sh'), '755');
  }
  
  // Run insert-variables script
  const success = runInsertVariablesScript();
  
  if (success) {
    console.log(`\n${GREEN}RooFlow installation complete!${RESET}`);
    console.log('Your project is now configured to use RooFlow.');
    console.log('\nDirectory structure created:');
    console.log('  .roo/ - Contains system prompt files');
    console.log('  .roomodes - Mode configuration file');
    console.log('  insert-variables.sh - Script to update system variables');
    console.log('  insert-variables.cmd - Script for Windows command prompt');
    console.log('\nThe memory-bank directory will be created automatically when you first use RooFlow.');
    console.log('\nTo start using RooFlow:');
    console.log('  1. Open your project in VS Code');
    console.log('  2. Ensure the Roo Code extension is installed');
    console.log('  3. Start a new Roo Code chat and select a mode');
  }
}

// Run the installation
install().catch(error => {
  console.error(`${RED}Installation failed:${RESET}`, error);
  process.exit(1);
});
