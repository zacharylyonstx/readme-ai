# readme-ai

[![npm version](https://img.shields.io/npm/v/readme-ai.svg)](https://www.npmjs.com/package/readme-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)]()

Generate beautiful, comprehensive README.md files by analyzing your project's code, structure, and configuration. No API keys. No config files. No cost.

**readme-ai** scans your project directory and intelligently generates a professional README with real content — not empty headers with "TODO" placeholders. It reads your `package.json`, detects your tech stack, analyzes your file structure, and produces markdown that actually describes your project.

## Features

- **🔍 Smart Project Analysis** — Detects languages, frameworks, package managers, test tools, CI platforms, Docker, linters, and monorepo setups
- **📝 Real Content Generation** — Produces actual descriptions, install steps, and usage examples based on your project
- **🎨 Three Output Styles** — `minimal`, `standard`, or `detailed` to match your needs
- **🏷️ Auto Badges** — Generates shields.io badges for version, license, CI status, dependencies, and more
- **📑 Table of Contents** — Optional TOC with accurate anchor links
- **📦 Monorepo Aware** — Detects workspaces, Lerna, Nx, Turborepo and lists sub-packages
- **🐳 Docker Detection** — Finds Dockerfiles and compose configs, generates Docker usage section
- **🧪 Test Framework Detection** — Identifies Jest, Vitest, Mocha, Playwright, Cypress, and more
- **📤 API Documentation** — Extracts exports and JSDoc comments from your entry point
- **🚫 Zero Dependencies** — Pure Node.js, nothing to install
- **⚡ Instant Results** — Runs in milliseconds, not minutes

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Output Styles](#output-styles)
- [What Gets Detected](#what-gets-detected)
- [Examples](#examples)
- [Programmatic API](#programmatic-api)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

```bash
# Generate a README for the current project
npx readme-ai

# Preview without writing
npx readme-ai --dry-run

# Full featured
npx readme-ai --style detailed --badges --toc
```

## Installation

### Use with npx (no install needed)

```bash
npx readme-ai
```

### Global install

```bash
npm install -g readme-ai
```

### As a dev dependency

```bash
npm install --save-dev readme-ai
```

## Usage

```bash
# Basic — generates README.md in current directory
readme-ai

# Choose output style
readme-ai --style minimal     # Just the essentials
readme-ai --style standard    # Balanced (default)
readme-ai --style detailed    # Everything including file tree, scripts table, contributors

# Add badges and table of contents
readme-ai --badges --toc

# Preview output without writing file
readme-ai --dry-run

# Custom output path
readme-ai --output docs/README.md

# Overwrite existing README without prompt
readme-ai --force
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--style <level>` | Output verbosity: `minimal`, `standard`, `detailed` | `standard` |
| `--badges` | Include shields.io badges | `false` |
| `--toc` | Include table of contents | `false` |
| `--output <file>` | Output file path | `README.md` |
| `--dry-run` | Print to stdout, don't write file | `false` |
| `--force` | Overwrite existing file without prompt | `false` |
| `--help` | Show help | |
| `--version` | Show version | |

## Output Styles

### Minimal

Core sections only: title, description, installation, usage, license. Perfect for small packages.

### Standard (default)

Adds features, prerequisites, API reference, testing, and contributing sections. Good for most projects.

### Detailed

Everything in standard, plus: tech stack breakdown, project file tree, npm scripts table, and contributor acknowledgments. Ideal for open source projects.

## What Gets Detected

| Category | Detections |
|----------|-----------|
| **Languages** | JavaScript, TypeScript, Python, Go, Rust |
| **Package Managers** | npm, yarn, pnpm, bun, pip, cargo, go modules |
| **Frameworks** | React, Next.js, Vue, Nuxt, Angular, Svelte, SvelteKit, Express, Fastify, NestJS, Gatsby, Remix, Astro, Electron, React Native |
| **Styling** | Tailwind CSS, Styled Components, Emotion |
| **Databases** | Prisma, Mongoose, Sequelize, TypeORM, Drizzle ORM |
| **Testing** | Jest, Vitest, Mocha, AVA, Tap, Cypress, Playwright, Puppeteer, Testing Library |
| **CI/CD** | GitHub Actions, GitLab CI, CircleCI, Travis CI, Jenkins, Azure Pipelines |
| **Infrastructure** | Docker, Docker Compose |
| **Code Quality** | ESLint, Pylint, Flake8, Ruff, Prettier, EditorConfig |
| **Monorepo** | npm workspaces, yarn workspaces, pnpm workspaces, Lerna, Nx, Turborepo |
| **Build Tools** | Vite, Webpack, Rollup, esbuild |

## Examples

### React + TypeScript project

```bash
$ cd my-react-app
$ npx readme-ai --badges --toc --style standard
🔍 Analyzing project...
📝 Generating README...
✅ README.md generated successfully!
   142 lines | 4.2 KB
```

### Monorepo with workspaces

```bash
$ cd my-monorepo
$ npx readme-ai --style detailed
🔍 Analyzing project...
📝 Generating README...
✅ README.md generated successfully!
   256 lines | 8.1 KB
```

## Programmatic API

```javascript
const { analyzeProject, generateReadme } = require('readme-ai');

const analysis = analyzeProject('/path/to/project');

const readme = generateReadme(analysis, {
  style: 'detailed',
  badges: true,
  toc: true,
});

console.log(readme);
```

### `analyzeProject(projectDir)`

Analyzes a project directory and returns a detailed analysis object containing:
- Project metadata (name, version, description, license)
- Detected languages, frameworks, and tech stack
- File tree structure
- Dependencies and scripts
- Git information (remote URL, contributors, commit count)
- Exported API surface

### `generateReadme(analysis, options)`

Generates a README markdown string from an analysis object.

**Options:**
- `style` — `'minimal'` | `'standard'` | `'detailed'` (default: `'standard'`)
- `badges` — `boolean` (default: `false`)
- `toc` — `boolean` (default: `false`)

## Project Structure

```
readme-ai/
├── bin/
│   └── cli.js          # CLI entry point
├── lib/
│   ├── analyzer.js     # Project analysis engine
│   ├── args.js         # Argument parser
│   ├── fs-utils.js     # File system utilities
│   ├── generator.js    # README markdown generator
│   └── index.js        # Public API
├── test/
│   └── run.js          # Test suite
├── package.json
├── LICENSE
└── README.md
```

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for contributions

- Additional language detection (Java, C#, PHP, Ruby)
- Custom templates / themes
- YAML/TOML config file support
- Changelog generation
- README diff mode (show what changed)

## License

MIT © [Zachary Lyons](https://github.com/zacharylyonstx)
