'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Read file contents, return null if not found.
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

/**
 * Write content to a file, creating parent dirs as needed.
 */
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Check if a path exists.
 */
function exists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read JSON file, return null if not found or invalid.
 */
function readJson(filePath) {
  const content = readFile(filePath);
  if (content === null) return null;
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * List directory contents (non-recursive).
 */
function listDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return [];
  }
}

/**
 * Recursively walk a directory tree. Returns array of relative paths.
 * Skips node_modules, .git, dist, build, coverage, .next, etc.
 */
function walkDir(dirPath, basePath = dirPath, maxDepth = 4, depth = 0) {
  if (depth > maxDepth) return [];

  const SKIP_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', 'coverage', '.next',
    '.nuxt', '.output', '.cache', '.parcel-cache', '__pycache__',
    'venv', '.venv', 'env', '.env', 'vendor', 'target', '.idea',
    '.vscode', '.DS_Store', '.turbo', '.vercel', '.netlify',
  ]);

  const entries = listDir(dirPath);
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        files.push({ path: relativePath + '/', isDir: true });
        files = files.concat(walkDir(fullPath, basePath, maxDepth, depth + 1));
      }
    } else {
      files.push({ path: relativePath, isDir: false });
    }
  }

  return files;
}

/**
 * Get file extension.
 */
function getExt(filePath) {
  return path.extname(filePath).toLowerCase();
}

module.exports = { readFile, writeFile, exists, readJson, listDir, walkDir, getExt };
