import { Command } from 'commander';
import { parseStore } from '../parser/storeParser';
import { generateTestFile } from '../generator/testGenerator';
import { logInfo, logSuccess, logError } from '../utils/logger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const program = new Command();
program.name('zest').description('Type-aware test generator for Zustand stores').version('0.2.0');

program
  .argument('<store-path>', 'Path to Zustand store file')
  .option('-o, --output <path>', 'Output test file', 'generated.test.ts')
  .action((storePath: string, opts: { output: string }) => {
    try {
      logInfo(`Parsing: ${storePath}`);
      const props = parseStore(storePath);
      logInfo(`Found: ${props.filter(p=>!p.isAction).length} state fields, ${props.filter(p=>p.isAction).length} actions`);
      
      writeFileSync(resolve(opts.output), generateTestFile(props), 'utf-8');
      logSuccess(`✅ Saved to: ${opts.output}`);
    } catch (err) {
      logError(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse();