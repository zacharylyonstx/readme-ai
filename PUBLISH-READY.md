# Publishing readme-ai to npm

## Pre-publish checklist

- [x] Package name: `readme-ai`
- [x] Version: 1.0.0
- [x] License: MIT
- [x] README.md written
- [x] .github/FUNDING.yml configured
- [x] funding field in package.json
- [x] Tests passing (40/40)
- [x] Zero external dependencies
- [x] `bin` field configured for CLI
- [x] `files` field limits published files
- [x] `engines` field specifies Node.js >=14
- [x] npm pack tested

## Steps to publish

### 1. Verify you're logged in to npm

```bash
npm whoami
# If not logged in:
npm login
```

### 2. Check the package name is available

```bash
npm view readme-ai
# If taken, rename in package.json to readme-ai-gen
```

### 3. Run tests one more time

```bash
npm test
```

### 4. Do a dry run publish

```bash
npm publish --dry-run
```

### 5. Publish

```bash
npm publish
```

### 6. Verify

```bash
npx readme-ai --version
# Should print: 1.0.0
```

## If the name `readme-ai` is taken

1. Change `name` in package.json to `readme-ai-gen`
2. Update README.md references
3. Publish as `readme-ai-gen`

## Future versions

```bash
# Bump version
npm version patch|minor|major

# Publish
npm publish

# Create GitHub release
gh release create v$(node -p "require('./package.json').version") --generate-notes
```
