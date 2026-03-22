'use strict';

/**
 * Generate a README.md string from project analysis.
 */
function generateReadme(analysis, options = {}) {
  const { style = 'standard', badges = false, toc = false } = options;
  const sections = [];

  // Title
  sections.push(generateTitle(analysis, badges));

  // Description
  if (analysis.description) {
    sections.push(`\n${analysis.description}\n`);
  }

  // Badges (if not inline with title)
  if (badges && !analysis.description) {
    sections.push('');
  }

  // Table of Contents
  if (toc) {
    sections.push(generateToc(analysis, style));
  }

  // Features
  if (analysis.features.length > 0 && style !== 'minimal') {
    sections.push(generateFeatures(analysis));
  }

  // Tech Stack
  if (analysis.techStack.length > 0 && style === 'detailed') {
    sections.push(generateTechStack(analysis));
  }

  // Project Structure
  if (style === 'detailed' && analysis.fileTree.length > 0) {
    sections.push(generateProjectStructure(analysis));
  }

  // Prerequisites
  if (style !== 'minimal') {
    sections.push(generatePrerequisites(analysis));
  }

  // Installation
  sections.push(generateInstallation(analysis));

  // Usage
  if (analysis.usageExamples.length > 0) {
    sections.push(generateUsage(analysis));
  }

  // API Reference
  if (analysis.exports.length > 0 && style !== 'minimal') {
    sections.push(generateApiReference(analysis));
  }

  // Scripts
  if (Object.keys(analysis.scripts).length > 0 && style === 'detailed') {
    sections.push(generateScripts(analysis));
  }

  // Monorepo packages
  if (analysis.isMonorepo && analysis.packages.length > 0) {
    sections.push(generatePackages(analysis));
  }

  // Docker
  if (analysis.hasDocker && style !== 'minimal') {
    sections.push(generateDocker(analysis));
  }

  // Testing
  if (analysis.hasTests && style !== 'minimal') {
    sections.push(generateTesting(analysis));
  }

  // Contributing
  if (style !== 'minimal') {
    sections.push(generateContributing(analysis));
  }

  // License
  sections.push(generateLicense(analysis));

  // Acknowledgments (detailed only)
  if (style === 'detailed' && analysis.gitInfo?.contributors?.length > 1) {
    sections.push(generateAcknowledgments(analysis));
  }

  return sections.join('\n') + '\n';
}

function generateTitle(analysis, showBadges) {
  let title = `# ${formatName(analysis.name)}`;

  if (showBadges) {
    const badgeLines = generateBadges(analysis);
    if (badgeLines) {
      title += '\n\n' + badgeLines;
    }
  }

  return title;
}

function generateBadges(analysis) {
  const badges = [];
  const { gitInfo } = analysis;
  const owner = gitInfo?.owner || 'user';
  const repo = gitInfo?.repo || analysis.name;

  if (analysis.version) {
    badges.push(`[![npm version](https://img.shields.io/npm/v/${analysis.name}.svg)](https://www.npmjs.com/package/${analysis.name})`);
  }

  if (analysis.license) {
    badges.push(`[![License: ${analysis.license}](https://img.shields.io/badge/License-${encodeURIComponent(analysis.license)}-blue.svg)](LICENSE)`);
  }

  if (gitInfo?.owner) {
    badges.push(`[![GitHub stars](https://img.shields.io/github/stars/${owner}/${repo}.svg)](https://github.com/${owner}/${repo}/stargazers)`);
  }

  if (analysis.hasCi && gitInfo?.owner) {
    badges.push(`[![CI](https://github.com/${owner}/${repo}/actions/workflows/ci.yml/badge.svg)](https://github.com/${owner}/${repo}/actions)`);
  }

  if (analysis.hasTypeScript) {
    badges.push('[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)');
  }

  if (Object.keys(analysis.dependencies).length === 0 && analysis.packageManager) {
    badges.push('[![Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)]()');
  }

  return badges.join('\n');
}

function generateToc(analysis, style) {
  const items = [];

  if (analysis.features.length > 0 && style !== 'minimal') items.push('- [Features](#features)');
  if (analysis.techStack.length > 0 && style === 'detailed') items.push('- [Tech Stack](#tech-stack)');
  if (style === 'detailed' && analysis.fileTree.length > 0) items.push('- [Project Structure](#project-structure)');
  if (style !== 'minimal') items.push('- [Prerequisites](#prerequisites)');
  items.push('- [Installation](#installation)');
  if (analysis.usageExamples.length > 0) items.push('- [Usage](#usage)');
  if (analysis.exports.length > 0 && style !== 'minimal') items.push('- [API Reference](#api-reference)');
  if (Object.keys(analysis.scripts).length > 0 && style === 'detailed') items.push('- [Scripts](#scripts)');
  if (analysis.isMonorepo && analysis.packages.length > 0) items.push('- [Packages](#packages)');
  if (analysis.hasDocker && style !== 'minimal') items.push('- [Docker](#docker)');
  if (analysis.hasTests && style !== 'minimal') items.push('- [Testing](#testing)');
  if (style !== 'minimal') items.push('- [Contributing](#contributing)');
  items.push('- [License](#license)');

  return `## Table of Contents\n\n${items.join('\n')}`;
}

function generateFeatures(analysis) {
  const items = analysis.features.map(f => `- **${f}**`).join('\n');
  return `## Features\n\n${items}`;
}

function generateTechStack(analysis) {
  const categories = {
    'Languages': [],
    'Frameworks': [],
    'Tools & Infrastructure': [],
  };

  for (const lang of analysis.languages) {
    categories['Languages'].push(lang);
  }
  for (const fw of analysis.frameworks) {
    categories['Frameworks'].push(fw);
  }
  const tools = analysis.techStack.filter(t =>
    !analysis.languages.includes(t) && !analysis.frameworks.includes(t)
  );
  categories['Tools & Infrastructure'] = tools;

  let md = '## Tech Stack\n\n';
  for (const [category, items] of Object.entries(categories)) {
    if (items.length > 0) {
      md += `### ${category}\n\n`;
      md += items.map(i => `- ${i}`).join('\n') + '\n\n';
    }
  }

  return md.trimEnd();
}

function generateProjectStructure(analysis) {
  // Show top-level structure only (first 2 levels)
  const topLevel = analysis.fileTree.filter(f => {
    const depth = f.path.replace(/\/$/, '').split('/').length;
    return depth <= 2;
  }).slice(0, 40);

  if (topLevel.length === 0) return '';

  // Build a proper tree representation
  const rootChildren = [];
  const dirChildren = {};

  for (const entry of topLevel) {
    const parts = entry.path.replace(/\/$/, '').split('/');
    if (parts.length === 1) {
      rootChildren.push(entry);
    } else {
      const parent = parts[0];
      if (!dirChildren[parent]) dirChildren[parent] = [];
      dirChildren[parent].push({ ...entry, displayName: parts[parts.length - 1] });
    }
  }

  let tree = '## Project Structure\n\n```\n';
  tree += `${analysis.name}/\n`;

  for (let i = 0; i < rootChildren.length; i++) {
    const entry = rootChildren[i];
    const isLast = i === rootChildren.length - 1 && !Object.keys(dirChildren).some(d => !rootChildren.find(r => r.path.replace(/\/$/, '') === d));
    const connector = isLast ? '└── ' : '├── ';
    const name = entry.path.replace(/\/$/, '');

    if (entry.isDir && dirChildren[name]) {
      tree += `${connector}${name}/\n`;
      const children = dirChildren[name];
      for (let j = 0; j < children.length; j++) {
        const childConnector = j === children.length - 1 ? '└── ' : '├── ';
        const vertLine = isLast ? '    ' : '│   ';
        tree += `${vertLine}${childConnector}${children[j].displayName}\n`;
      }
    } else {
      tree += `${connector}${name}${entry.isDir ? '/' : ''}\n`;
    }
  }

  tree += '```';
  return tree;
}

function generatePrerequisites(analysis) {
  const prereqs = [];

  if (analysis.packageManager === 'npm' || analysis.packageManager === 'yarn' || analysis.packageManager === 'pnpm' || analysis.packageManager === 'bun') {
    prereqs.push('- [Node.js](https://nodejs.org/) (v14 or higher)');
    if (analysis.packageManager === 'yarn') prereqs.push('- [Yarn](https://yarnpkg.com/)');
    if (analysis.packageManager === 'pnpm') prereqs.push('- [pnpm](https://pnpm.io/)');
    if (analysis.packageManager === 'bun') prereqs.push('- [Bun](https://bun.sh/)');
  }
  if (analysis.languages.includes('Python')) prereqs.push('- [Python](https://python.org/) (v3.8 or higher)');
  if (analysis.languages.includes('Go')) prereqs.push('- [Go](https://golang.org/) (v1.19 or higher)');
  if (analysis.languages.includes('Rust')) prereqs.push('- [Rust](https://www.rust-lang.org/) (latest stable)');
  if (analysis.hasDocker) prereqs.push('- [Docker](https://www.docker.com/) (optional)');

  if (prereqs.length === 0) {
    prereqs.push('- Git');
  }

  return `## Prerequisites\n\n${prereqs.join('\n')}`;
}

function generateInstallation(analysis) {
  let md = '## Installation\n\n';

  if (analysis.installSteps.length > 0) {
    for (const step of analysis.installSteps) {
      md += `${step.desc}:\n\n`;
      md += `\`\`\`bash\n${step.cmd}\n\`\`\`\n\n`;
    }
  } else {
    md += '```bash\ngit clone ' + (analysis.repository || `https://github.com/user/${analysis.name}.git`) + '\ncd ' + analysis.name + '\n```\n';
  }

  return md.trimEnd();
}

function generateUsage(analysis) {
  let md = '## Usage\n\n';

  for (const example of analysis.usageExamples) {
    md += `${example.desc}:\n\n`;
    md += `\`\`\`bash\n${example.cmd}\n\`\`\`\n\n`;
  }

  return md.trimEnd();
}

function generateApiReference(analysis) {
  let md = '## API Reference\n\n';

  for (const exp of analysis.exports) {
    md += `### \`${exp.name}\`\n\n`;
    if (exp.description) {
      md += `${exp.description}\n\n`;
    }
  }

  return md.trimEnd();
}

function generateScripts(analysis) {
  let md = '## Scripts\n\n';
  md += '| Script | Command | Description |\n';
  md += '|--------|---------|-------------|\n';

  const pm = analysis.packageManager || 'npm';

  for (const [name, cmd] of Object.entries(analysis.scripts)) {
    const desc = guessScriptDescription(name, cmd);
    md += `| \`${name}\` | \`${pm} run ${name}\` | ${desc} |\n`;
  }

  return md.trimEnd();
}

function guessScriptDescription(name, cmd) {
  const map = {
    'start': 'Start the application',
    'dev': 'Start development server',
    'build': 'Build for production',
    'test': 'Run test suite',
    'lint': 'Run linter',
    'format': 'Format code',
    'deploy': 'Deploy the application',
    'clean': 'Clean build artifacts',
    'watch': 'Watch for changes',
    'serve': 'Serve the application',
    'preview': 'Preview production build',
    'typecheck': 'Run type checking',
    'prepare': 'Prepare for publishing',
    'precommit': 'Pre-commit hooks',
    'postinstall': 'Post-install setup',
  };

  return map[name] || `Run \`${cmd.substring(0, 50)}${cmd.length > 50 ? '...' : ''}\``;
}

function generatePackages(analysis) {
  let md = '## Packages\n\n';
  md += '| Package | Description | Path |\n';
  md += '|---------|-------------|------|\n';

  for (const pkg of analysis.packages) {
    md += `| \`${pkg.name}\` | ${pkg.description || '—'} | \`${pkg.path}\` |\n`;
  }

  return md.trimEnd();
}

function generateDocker(analysis) {
  return `## Docker\n\nBuild and run with Docker:\n\n\`\`\`bash\n# Build the image\ndocker build -t ${analysis.name} .\n\n# Run the container\ndocker run -p 3000:3000 ${analysis.name}\n\`\`\``;
}

function generateTesting(analysis) {
  const pm = analysis.packageManager || 'npm';
  let md = `## Testing\n\nThis project uses ${analysis.testFramework || 'a test framework'} for testing.\n\n`;
  md += `\`\`\`bash\n# Run tests\n${pm} test\n`;

  if (analysis.scripts['test:watch']) {
    md += `\n# Run tests in watch mode\n${pm} run test:watch\n`;
  }
  if (analysis.scripts['test:coverage'] || analysis.scripts.coverage) {
    md += `\n# Run tests with coverage\n${pm} run ${analysis.scripts['test:coverage'] ? 'test:coverage' : 'coverage'}\n`;
  }

  md += '```';
  return md;
}

function generateContributing(analysis) {
  return `## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

Please make sure to update tests as appropriate.`;
}

function generateLicense(analysis) {
  const license = analysis.license || 'MIT';
  const author = analysis.author || '';
  let md = `## License\n\nThis project is licensed under the ${license} License`;
  if (author) md += ` — see the [LICENSE](LICENSE) file for details`;
  md += '.';
  return md;
}

function generateAcknowledgments(analysis) {
  let md = '## Acknowledgments\n\n';
  md += 'Thanks to all contributors:\n\n';
  for (const name of analysis.gitInfo.contributors) {
    md += `- ${name}\n`;
  }
  return md.trimEnd();
}

/**
 * Format a package name into a human-readable title.
 * e.g., "my-cool-package" -> "My Cool Package"
 */
function formatName(name) {
  // Remove scope
  const unscoped = name.replace(/^@[^/]+\//, '');
  return unscoped
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { generateReadme };
