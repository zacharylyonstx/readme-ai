#!/usr/bin/env node

'use strict';

const path = require('path');
const { parseArgs } = require('../lib/args');
const { analyzeProject } = require('../lib/analyzer');
const { generateReadme } = require('../lib/generator');
const { writeFile, readFile } = require('../lib/fs-utils');

const VERSION = '1.0.0';

const HELP = `
readme-ai v${VERSION}
Generate beautiful README.md files by analyzing your project.

Usage:
  readme-ai [options]

Options:
  --style <level>     Output style: minimal, standard, detailed (default: standard)
  --badges            Include shields.io badges
  --toc               Include table of contents
  --output <file>     Output file path (default: README.md)
  --dry-run           Print to stdout instead of writing file
  --force             Overwrite existing README.md without prompt
  --help, -h          Show this help message
  --version, -v       Show version number

Examples:
  npx readme-ai                    # Generate README.md with standard style
  npx readme-ai --style detailed   # Detailed README with all sections
  npx readme-ai --badges --toc     # Add badges and table of contents
  npx readme-ai --dry-run          # Preview without writing
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.version) {
    console.log(VERSION);
    process.exit(0);
  }

  const projectDir = process.cwd();
  const outputFile = args.output || 'README.md';
  const outputPath = path.resolve(projectDir, outputFile);

  // Check for existing README
  if (!args.force && !args.dryRun) {
    try {
      const existing = readFile(outputPath);
      if (existing !== null) {
        const fs = require('fs');
        // Check if stdin is a TTY for interactive prompt
        if (process.stdin.isTTY) {
          const readline = require('readline');
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise(resolve => {
            rl.question(`\x1b[33m⚠ ${outputFile} already exists. Overwrite? [y/N] \x1b[0m`, resolve);
          });
          rl.close();
          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('Aborted.');
            process.exit(0);
          }
        } else {
          console.log(`\x1b[33m⚠ ${outputFile} already exists. Use --force to overwrite.\x1b[0m`);
          process.exit(1);
        }
      }
    } catch (e) {
      // File doesn't exist, proceed
    }
  }

  console.log('\x1b[36m🔍 Analyzing project...\x1b[0m');
  const analysis = analyzeProject(projectDir);

  console.log('\x1b[36m📝 Generating README...\x1b[0m');
  const readme = generateReadme(analysis, {
    style: args.style || 'standard',
    badges: args.badges || false,
    toc: args.toc || false,
  });

  if (args.dryRun) {
    console.log('\n' + readme);
  } else {
    writeFile(outputPath, readme);
    console.log(`\x1b[32m✅ ${outputFile} generated successfully!\x1b[0m`);
    console.log(`\x1b[90m   ${readme.split('\n').length} lines | ${Buffer.byteLength(readme)} bytes\x1b[0m`);
  }
}

main().catch(err => {
  console.error(`\x1b[31m❌ Error: ${err.message}\x1b[0m`);
  process.exit(1);
});
