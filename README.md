# RooFlow Installer

A simple NPM package to easily install the amazing [RooFlow](https://github.com/GreatScottyMac/RooFlow) system into your project.

## What is RooFlow?

RooFlow is a tool created by [GreatScottyMac](https://github.com/GreatScottyMac) that supercharges your AI development experience in VS Code. By providing persistent project context and optimized mode interactions, it transforms how you work with Roo Code.

### ✨ Why RooFlow is Amazing

RooFlow is a game-changer for AI-assisted development because it:

- 🧠 **Maintains deep project understanding** across sessions through its clever Memory Bank system
- ⚡ **Dramatically reduces token consumption** with optimized prompts and instructions
- 🔄 **Seamlessly integrates five powerful modes** (Architect, Code, Test, Debug, and Ask)
- 🚀 **Streamlines your workflow** with automatic context updates and efficient mode switching

For the full details of this impressive tool, visit the [RooFlow GitHub repository](https://github.com/GreatScottyMac/RooFlow).

## Installation

Adding RooFlow to your project is simple:

```bash
npm install --save-dev rooflow
```

Or with yarn:

```bash
yarn add --dev rooflow
```

That's it! This installer will:

1. Download all the necessary configuration files from the official repository
2. Set up the proper directory structure in your project
3. Configure everything to work with VS Code's Roo Code extension

## Requirements

- VS Code with the Roo Code extension installed
- Node.js

## Manual Installation

If the automatic installation doesn't work for some reason:

```bash
node node_modules/rooflow/install.js
```

## After Installation

Start enjoying RooFlow immediately:

1. Open your project in VS Code
2. Start a new Roo Code chat and select any of the five integrated modes
3. Experience the benefits of persistent context and optimized workflows!

For full usage instructions, refer to the [original RooFlow documentation](https://github.com/GreatScottyMac/RooFlow).

## License

[Apache 2.0](LICENSE)
