# RooFlow

A package to easily install RooFlow into your project.

## Installation

Add to your project with npm:

```bash
npm install --save-dev rooflow
```

Or with yarn:

```bash
yarn add --dev rooflow
```

## What it does

When this package is installed as a dependency, it will:

1. Download all RooFlow configuration files from the official GitHub repository
2. Create the necessary directory structure in your project
3. Run the insert-variables script to configure the system variables
4. Set up your project to use RooFlow with VS Code's Roo Code extension

## Requirements

- VS Code with the Roo Code extension installed
- Node.js

## Manual Installation

If the automatic installation fails, you can run the install script manually:

```bash
node node_modules/rooflow/install.js
```

## File Structure

The installer creates the following structure in your project:

```
project-root
 ├── .roo
 |    ├── system-prompt-architect
 |    ├── system-prompt-ask
 |    ├── system-prompt-code
 |    ├── system-prompt-debug
 |    └── system-prompt-test
 ├── .roomodes
 ├── insert-variables.sh
 └── insert-variables.cmd
```

The `memory-bank` directory will be created automatically when you first use RooFlow.

## Using RooFlow

After installation:

1. Open your project in VS Code
2. Ensure the Roo Code extension is installed
3. Start a new Roo Code chat and select a mode
4. For more information, refer to the [RooFlow GitHub repository](https://github.com/GreatScottyMac/RooFlow)

## License

Apache 2.0
