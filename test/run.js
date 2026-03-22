'use strict';

const path = require('path');
const { analyzeProject } = require('../lib/analyzer');
const { generateReadme } = require('../lib/generator');
const { parseArgs } = require('../lib/args');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

// Test: parseArgs
console.log('\n📋 Testing argument parser...');
{
  const args = parseArgs(['--style', 'detailed', '--badges', '--toc', '--dry-run', '--force']);
  assert(args.style === 'detailed', 'Parses --style');
  assert(args.badges === true, 'Parses --badges');
  assert(args.toc === true, 'Parses --toc');
  assert(args.dryRun === true, 'Parses --dry-run');
  assert(args.force === true, 'Parses --force');
}
{
  const args = parseArgs([]);
  assert(args.style === 'standard', 'Default style is standard');
  assert(args.badges === false, 'Default badges is false');
  assert(args.toc === false, 'Default toc is false');
}

// Test: analyzeProject (self-analysis)
console.log('\n📋 Testing project analyzer...');
const projectDir = path.join(__dirname, '..');
const analysis = analyzeProject(projectDir);

assert(analysis.name === 'readme-ai', 'Detects project name');
assert(analysis.description.includes('README'), 'Detects description');
assert(analysis.version === '1.0.0', 'Detects version');
assert(analysis.license === 'MIT', 'Detects license');
assert(analysis.packageManager !== null, 'Detects package manager');
assert(analysis.fileTree.length > 0, 'Builds file tree');
assert(analysis.scripts.start !== undefined, 'Detects scripts');
assert(analysis.features.length > 0, 'Derives features');
assert(analysis.installSteps.length > 0, 'Derives install steps');

// Test: generateReadme with all styles
console.log('\n📋 Testing README generation...');
for (const style of ['minimal', 'standard', 'detailed']) {
  const readme = generateReadme(analysis, { style, badges: true, toc: true });
  assert(readme.includes('# Readme Ai'), `${style}: Has title`);
  assert(readme.includes('## Installation'), `${style}: Has installation section`);
  assert(readme.includes('## License'), `${style}: Has license section`);
  if (style !== 'minimal') {
    assert(readme.includes('## Features'), `${style}: Has features section`);
    assert(readme.includes('## Contributing'), `${style}: Has contributing section`);
  }
  if (style === 'detailed') {
    assert(readme.includes('## Project Structure'), `${style}: Has project structure`);
    assert(readme.includes('## Scripts'), `${style}: Has scripts section`);
  }
  assert(readme.includes('shields.io'), `${style}: Has badges`);
  assert(readme.includes('## Table of Contents'), `${style}: Has TOC`);
}

// Test: generateReadme without options
{
  const readme = generateReadme(analysis, {});
  assert(!readme.includes('shields.io'), 'No badges by default');
  assert(!readme.includes('## Table of Contents'), 'No TOC by default');
}

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
