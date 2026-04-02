import { Command } from 'commander';
import { parseStore } from '../parser/storeParser';
import { generateTestFile } from '../generator/testGenerator';
import { logInfo, logSuccess, logError } from '../utils/logger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const program = new Command();
program.name('zest').description('Type-safe test generator for Zustand stores').version('0.1.0');

program
  .argument('<store-path>', 'Path to Zustand store file')
  .option('-o, --output <path>', 'Output test file', 'generated.test.ts')
  .action((storePath: string, opts: { output: string }) => {
    try {
      logInfo(`Parsing: ${storePath}`);
      const schema = parseStore(storePath);
      logInfo(`Found: ${schema.stateKeys.length} state keys, ${schema.actionKeys.length} actions`);
      
      const code = generateTestFile(schema);
      writeFileSync(resolve(opts.output), code, 'utf-8');
      logSuccess(`✅ Saved to: ${opts.output}`);
    } catch (err) {
      logError(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse();