'use strict';

const path = require('path');
const { execSync } = require('child_process');
const { readFile, readJson, exists, walkDir, listDir, getExt } = require('./fs-utils');

/**
 * Analyze a project directory and extract all metadata.
 */
function analyzeProject(projectDir) {
  const analysis = {
    name: path.basename(projectDir),
    description: '',
    version: '',
    license: '',
    author: '',
    homepage: '',
    repository: '',
    packageManager: null,
    language: null,
    languages: [],
    frameworks: [],
    techStack: [],
    dependencies: {},
    devDependencies: {},
    scripts: {},
    hasTypeScript: false,
    hasTests: false,
    testFramework: null,
    hasCi: false,
    ciPlatform: null,
    hasDocker: false,
    hasLinter: false,
    linter: null,
    hasFormatter: false,
    formatter: null,
    isMonorepo: false,
    monorepoTool: null,
    packages: [],
    entryPoint: null,
    exports: [],
    fileTree: [],
    fileCount: 0,
    gitInfo: null,
    features: [],
    installSteps: [],
    usageExamples: [],
  };

  // Package.json analysis
  const pkg = readJson(path.join(projectDir, 'package.json'));
  if (pkg) {
    analysis.name = pkg.name || analysis.name;
    analysis.description = pkg.description || '';
    analysis.version = pkg.version || '';
    analysis.license = pkg.license || '';
    analysis.author = typeof pkg.author === 'string' ? pkg.author : (pkg.author?.name || '');
    analysis.homepage = pkg.homepage || '';
    analysis.repository = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url || '');
    analysis.scripts = pkg.scripts || {};
    analysis.dependencies = pkg.dependencies || {};
    analysis.devDependencies = pkg.devDependencies || {};
    analysis.entryPoint = pkg.main || pkg.module || null;
    analysis.packageManager = 'npm';

    if (pkg.bin) analysis.features.push('CLI tool');
    if (pkg.types || pkg.typings) analysis.hasTypeScript = true;
  }

  // Detect package manager
  if (exists(path.join(projectDir, 'pnpm-lock.yaml'))) {
    analysis.packageManager = 'pnpm';
  } else if (exists(path.join(projectDir, 'yarn.lock'))) {
    analysis.packageManager = 'yarn';
  } else if (exists(path.join(projectDir, 'bun.lockb')) || exists(path.join(projectDir, 'bun.lock'))) {
    analysis.packageManager = 'bun';
  } else if (exists(path.join(projectDir, 'package-lock.json'))) {
    analysis.packageManager = 'npm';
  }

  // Python detection
  const pyproject = readJson(path.join(projectDir, 'pyproject.toml'));
  if (exists(path.join(projectDir, 'requirements.txt')) || exists(path.join(projectDir, 'setup.py')) || exists(path.join(projectDir, 'pyproject.toml'))) {
    analysis.language = analysis.language || 'Python';
    analysis.languages.push('Python');
    analysis.packageManager = analysis.packageManager || 'pip';
  }

  // Go detection
  if (exists(path.join(projectDir, 'go.mod'))) {
    analysis.language = analysis.language || 'Go';
    analysis.languages.push('Go');
    analysis.packageManager = analysis.packageManager || 'go modules';
  }

  // Rust detection
  if (exists(path.join(projectDir, 'Cargo.toml'))) {
    analysis.language = analysis.language || 'Rust';
    analysis.languages.push('Rust');
    analysis.packageManager = analysis.packageManager || 'cargo';
  }

  // TypeScript detection
  if (exists(path.join(projectDir, 'tsconfig.json')) || exists(path.join(projectDir, 'tsconfig.base.json'))) {
    analysis.hasTypeScript = true;
    analysis.languages.push('TypeScript');
    analysis.techStack.push('TypeScript');
  }

  // JavaScript/Node detection
  if (pkg) {
    analysis.language = analysis.language || (analysis.hasTypeScript ? 'TypeScript' : 'JavaScript');
    if (!analysis.languages.includes('JavaScript') && !analysis.hasTypeScript) {
      analysis.languages.push('JavaScript');
    }
    analysis.techStack.push('Node.js');
  }

  // File tree
  analysis.fileTree = walkDir(projectDir);
  analysis.fileCount = analysis.fileTree.filter(f => !f.isDir).length;

  // Language detection from files
  const extCounts = {};
  for (const file of analysis.fileTree) {
    if (!file.isDir) {
      const ext = getExt(file.path);
      extCounts[ext] = (extCounts[ext] || 0) + 1;
    }
  }
  analysis.languageBreakdown = extCounts;

  // Framework detection
  detectFrameworks(analysis, projectDir);

  // Test detection
  detectTests(analysis, projectDir);

  // CI detection
  detectCI(analysis, projectDir);

  // Docker detection
  detectDocker(analysis, projectDir);

  // Linter/formatter detection
  detectLinterFormatter(analysis, projectDir);

  // Monorepo detection
  detectMonorepo(analysis, projectDir);

  // Git info
  analysis.gitInfo = getGitInfo(projectDir);

  // Extract exports from entry point
  if (analysis.entryPoint) {
    analysis.exports = extractExports(path.join(projectDir, analysis.entryPoint));
  }

  // Generate features from analysis
  analysis.features = deriveFeatures(analysis);

  // Generate install steps
  analysis.installSteps = deriveInstallSteps(analysis);

  // Generate usage examples
  analysis.usageExamples = deriveUsageExamples(analysis);

  return analysis;
}

function detectFrameworks(analysis, dir) {
  const allDeps = { ...analysis.dependencies, ...analysis.devDependencies };

  const frameworkMap = {
    'react': 'React',
    'next': 'Next.js',
    'vue': 'Vue.js',
    'nuxt': 'Nuxt.js',
    '@angular/core': 'Angular',
    'svelte': 'Svelte',
    '@sveltejs/kit': 'SvelteKit',
    'express': 'Express',
    'fastify': 'Fastify',
    'koa': 'Koa',
    'hapi': 'Hapi',
    'nestjs': 'NestJS',
    '@nestjs/core': 'NestJS',
    'gatsby': 'Gatsby',
    'remix': 'Remix',
    '@remix-run/react': 'Remix',
    'astro': 'Astro',
    'electron': 'Electron',
    'react-native': 'React Native',
    'expo': 'Expo',
    'tailwindcss': 'Tailwind CSS',
    'styled-components': 'Styled Components',
    '@emotion/react': 'Emotion',
    'prisma': 'Prisma',
    '@prisma/client': 'Prisma',
    'mongoose': 'Mongoose',
    'sequelize': 'Sequelize',
    'typeorm': 'TypeORM',
    'drizzle-orm': 'Drizzle ORM',
    'graphql': 'GraphQL',
    'socket.io': 'Socket.IO',
    'redux': 'Redux',
    'zustand': 'Zustand',
    'vite': 'Vite',
    'webpack': 'Webpack',
    'rollup': 'Rollup',
    'esbuild': 'esbuild',
    'storybook': 'Storybook',
    '@storybook/react': 'Storybook',
  };

  for (const [dep, name] of Object.entries(frameworkMap)) {
    if (allDeps[dep]) {
      analysis.frameworks.push(name);
      if (!analysis.techStack.includes(name)) {
        analysis.techStack.push(name);
      }
    }
  }
}

function detectTests(analysis, dir) {
  const allDeps = { ...analysis.dependencies, ...analysis.devDependencies };

  const testFrameworks = {
    'jest': 'Jest',
    'mocha': 'Mocha',
    'vitest': 'Vitest',
    'ava': 'AVA',
    'tap': 'Tap',
    'jasmine': 'Jasmine',
    '@testing-library/react': 'Testing Library',
    'cypress': 'Cypress',
    'playwright': 'Playwright',
    '@playwright/test': 'Playwright',
    'puppeteer': 'Puppeteer',
  };

  for (const [dep, name] of Object.entries(testFrameworks)) {
    if (allDeps[dep]) {
      analysis.hasTests = true;
      analysis.testFramework = analysis.testFramework || name;
      if (!analysis.techStack.includes(name)) {
        analysis.techStack.push(name);
      }
    }
  }

  // Check for test directories
  if (!analysis.hasTests) {
    const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs'];
    for (const td of testDirs) {
      if (exists(path.join(dir, td))) {
        analysis.hasTests = true;
        break;
      }
    }
  }

  // Check scripts for test command
  if (analysis.scripts.test && analysis.scripts.test !== 'echo "Error: no test specified" && exit 1') {
    analysis.hasTests = true;
  }
}

function detectCI(analysis, dir) {
  const ciConfigs = [
    { path: '.github/workflows', name: 'GitHub Actions' },
    { path: '.gitlab-ci.yml', name: 'GitLab CI' },
    { path: '.circleci', name: 'CircleCI' },
    { path: '.travis.yml', name: 'Travis CI' },
    { path: 'Jenkinsfile', name: 'Jenkins' },
    { path: 'azure-pipelines.yml', name: 'Azure Pipelines' },
    { path: 'bitbucket-pipelines.yml', name: 'Bitbucket Pipelines' },
  ];

  for (const ci of ciConfigs) {
    if (exists(path.join(dir, ci.path))) {
      analysis.hasCi = true;
      analysis.ciPlatform = ci.name;
      break;
    }
  }
}

function detectDocker(analysis, dir) {
  if (exists(path.join(dir, 'Dockerfile')) || exists(path.join(dir, 'docker-compose.yml')) || exists(path.join(dir, 'docker-compose.yaml')) || exists(path.join(dir, 'compose.yml')) || exists(path.join(dir, 'compose.yaml'))) {
    analysis.hasDocker = true;
    analysis.techStack.push('Docker');
  }
}

function detectLinterFormatter(analysis, dir) {
  const linters = {
    '.eslintrc': 'ESLint', '.eslintrc.js': 'ESLint', '.eslintrc.json': 'ESLint',
    '.eslintrc.yml': 'ESLint', 'eslint.config.js': 'ESLint', 'eslint.config.mjs': 'ESLint',
    '.pylintrc': 'Pylint', '.flake8': 'Flake8', 'ruff.toml': 'Ruff',
  };

  const formatters = {
    '.prettierrc': 'Prettier', '.prettierrc.js': 'Prettier', '.prettierrc.json': 'Prettier',
    'prettier.config.js': 'Prettier', '.editorconfig': 'EditorConfig',
  };

  for (const [file, name] of Object.entries(linters)) {
    if (exists(path.join(dir, file))) {
      analysis.hasLinter = true;
      analysis.linter = name;
      break;
    }
  }

  for (const [file, name] of Object.entries(formatters)) {
    if (exists(path.join(dir, file))) {
      analysis.hasFormatter = true;
      analysis.formatter = name;
      break;
    }
  }
}

function detectMonorepo(analysis, dir) {
  const monorepoIndicators = [
    { file: 'lerna.json', tool: 'Lerna' },
    { file: 'nx.json', tool: 'Nx' },
    { file: 'turbo.json', tool: 'Turborepo' },
    { file: 'pnpm-workspace.yaml', tool: 'pnpm workspaces' },
  ];

  for (const indicator of monorepoIndicators) {
    if (exists(path.join(dir, indicator.file))) {
      analysis.isMonorepo = true;
      analysis.monorepoTool = indicator.tool;
      break;
    }
  }

  // Check package.json workspaces
  const pkg = readJson(path.join(dir, 'package.json'));
  if (pkg?.workspaces) {
    analysis.isMonorepo = true;
    analysis.monorepoTool = analysis.monorepoTool || 'npm workspaces';
  }

  // Detect packages in monorepo
  if (analysis.isMonorepo) {
    const packageDirs = ['packages', 'apps', 'libs', 'modules'];
    for (const pd of packageDirs) {
      const pdPath = path.join(dir, pd);
      if (exists(pdPath)) {
        const entries = listDir(pdPath);
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const subPkg = readJson(path.join(pdPath, entry.name, 'package.json'));
            if (subPkg) {
              analysis.packages.push({
                name: subPkg.name || entry.name,
                description: subPkg.description || '',
                path: `${pd}/${entry.name}`,
              });
            }
          }
        }
      }
    }
  }
}

function getGitInfo(dir) {
  try {
    const remoteUrl = execSync('git remote get-url origin', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    const totalCommits = execSync('git rev-list --count HEAD', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    const lastCommitDate = execSync('git log -1 --format=%ci', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    const contributors = execSync('git log --format="%aN" | sort -u | head -20', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'], shell: true }).toString().trim().split('\n').filter(Boolean);

    // Parse GitHub info from remote URL
    let owner = '', repo = '';
    const sshMatch = remoteUrl.match(/git@github\.com:(.+?)\/(.+?)(?:\.git)?$/);
    const httpsMatch = remoteUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
    if (sshMatch) { owner = sshMatch[1]; repo = sshMatch[2]; }
    else if (httpsMatch) { owner = httpsMatch[1]; repo = httpsMatch[2]; }

    return { remoteUrl, totalCommits: parseInt(totalCommits, 10), lastCommitDate, contributors, owner, repo };
  } catch (e) {
    return null;
  }
}

function extractExports(filePath) {
  const content = readFile(filePath);
  if (!content) return [];

  const exports = [];

  // module.exports = { ... }
  const moduleExportsMatch = content.match(/module\.exports\s*=\s*\{([^}]+)\}/);
  if (moduleExportsMatch) {
    const keys = moduleExportsMatch[1].match(/(\w+)\s*[,:]/g);
    if (keys) {
      for (const key of keys) {
        exports.push(key.replace(/\s*[,:]/g, ''));
      }
    }
  }

  // exports.name = ...
  const namedExports = content.matchAll(/(?:module\.)?exports\.(\w+)\s*=/g);
  for (const match of namedExports) {
    if (!exports.includes(match[1])) {
      exports.push(match[1]);
    }
  }

  // export function/const/class
  const esExports = content.matchAll(/export\s+(?:default\s+)?(?:function|const|class|let|var)\s+(\w+)/g);
  for (const match of esExports) {
    if (!exports.includes(match[1])) {
      exports.push(match[1]);
    }
  }

  // Extract JSDoc comments for functions
  const documented = [];
  for (const exportName of exports) {
    const jsdocPattern = new RegExp(`/\\*\\*([\\s\\S]*?)\\*/[\\s\\n]*(?:(?:export|module\\.exports)\\s+)?(?:function|const|class|let|var)?\\s*${exportName}`, 'g');
    const jsdocMatch = jsdocPattern.exec(content);
    let description = '';
    if (jsdocMatch) {
      const lines = jsdocMatch[1].split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim()).filter(Boolean);
      description = lines.find(l => !l.startsWith('@')) || '';
    }
    documented.push({ name: exportName, description });
  }

  return documented;
}

function deriveFeatures(analysis) {
  const features = [];

  if (analysis.hasTypeScript) features.push('Written in TypeScript for type safety');
  if (Object.keys(analysis.dependencies).length === 0 && analysis.packageManager === 'npm') features.push('Zero external dependencies');
  if (analysis.scripts.test) features.push('Comprehensive test suite');
  if (analysis.hasCi) features.push(`Continuous integration via ${analysis.ciPlatform}`);
  if (analysis.hasDocker) features.push('Docker support for containerized deployment');
  if (analysis.hasLinter) features.push(`Code quality enforced with ${analysis.linter}`);
  if (analysis.hasFormatter) features.push(`Consistent formatting with ${analysis.formatter}`);
  if (analysis.isMonorepo) features.push(`Monorepo architecture with ${analysis.monorepoTool}`);

  // Detect from scripts
  if (analysis.scripts.build) features.push('Production build pipeline');
  if (analysis.scripts.dev || analysis.scripts.start) features.push('Development server included');
  if (analysis.scripts.lint) features.push('Linting configured');
  if (analysis.scripts.deploy) features.push('Deployment scripts included');

  // Detect from framework
  for (const fw of analysis.frameworks) {
    if (['React', 'Vue.js', 'Angular', 'Svelte'].includes(fw)) {
      features.push(`${fw} frontend framework`);
    }
    if (['Express', 'Fastify', 'Koa', 'NestJS'].includes(fw)) {
      features.push(`${fw} backend framework`);
    }
  }

  // CLI tool
  const pkg = { ...analysis };
  if (analysis.features?.includes('CLI tool')) features.push('Command-line interface');

  return [...new Set(features)];
}

function deriveInstallSteps(analysis) {
  const steps = [];

  steps.push({ cmd: `git clone ${analysis.repository || `https://github.com/user/${analysis.name}.git`}`, desc: 'Clone the repository' });
  steps.push({ cmd: `cd ${analysis.name}`, desc: 'Navigate to the project directory' });

  switch (analysis.packageManager) {
    case 'npm': steps.push({ cmd: 'npm install', desc: 'Install dependencies' }); break;
    case 'yarn': steps.push({ cmd: 'yarn', desc: 'Install dependencies' }); break;
    case 'pnpm': steps.push({ cmd: 'pnpm install', desc: 'Install dependencies' }); break;
    case 'bun': steps.push({ cmd: 'bun install', desc: 'Install dependencies' }); break;
    case 'pip': steps.push({ cmd: 'pip install -r requirements.txt', desc: 'Install dependencies' }); break;
    case 'cargo': steps.push({ cmd: 'cargo build', desc: 'Build the project' }); break;
    case 'go modules': steps.push({ cmd: 'go mod download', desc: 'Download dependencies' }); break;
  }

  if (analysis.scripts.build) {
    const pm = analysis.packageManager || 'npm';
    steps.push({ cmd: `${pm} run build`, desc: 'Build the project' });
  }

  return steps;
}

function deriveUsageExamples(analysis) {
  const examples = [];

  if (analysis.scripts.dev) {
    const pm = analysis.packageManager || 'npm';
    examples.push({ cmd: `${pm} run dev`, desc: 'Start development server' });
  }

  if (analysis.scripts.start) {
    const pm = analysis.packageManager || 'npm';
    examples.push({ cmd: `${pm} start`, desc: 'Start the application' });
  }

  if (analysis.scripts.test) {
    const pm = analysis.packageManager || 'npm';
    examples.push({ cmd: `${pm} test`, desc: 'Run tests' });
  }

  if (analysis.scripts.build) {
    const pm = analysis.packageManager || 'npm';
    examples.push({ cmd: `${pm} run build`, desc: 'Build for production' });
  }

  if (analysis.scripts.lint) {
    const pm = analysis.packageManager || 'npm';
    examples.push({ cmd: `${pm} run lint`, desc: 'Run linter' });
  }

  return examples;
}

module.exports = { analyzeProject };
