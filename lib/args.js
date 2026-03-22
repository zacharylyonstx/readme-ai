'use strict';

/**
 * Parse CLI arguments into an options object.
 * Zero dependencies — just process.argv parsing.
 */
function parseArgs(argv) {
  const args = {
    style: 'standard',
    badges: false,
    toc: false,
    output: 'README.md',
    dryRun: false,
    force: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--style':
        args.style = argv[++i] || 'standard';
        if (!['minimal', 'standard', 'detailed'].includes(args.style)) {
          console.error(`Invalid style: ${args.style}. Use minimal, standard, or detailed.`);
          process.exit(1);
        }
        break;
      case '--badges':
        args.badges = true;
        break;
      case '--toc':
        args.toc = true;
        break;
      case '--output':
      case '-o':
        args.output = argv[++i] || 'README.md';
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--force':
      case '-f':
        args.force = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--version':
      case '-v':
        args.version = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          console.error('Run readme-ai --help for usage.');
          process.exit(1);
        }
    }
  }

  return args;
}

module.exports = { parseArgs };
