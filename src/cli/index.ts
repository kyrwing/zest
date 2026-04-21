import { Command } from 'commander';
import { resolve, parse, dirname } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { parseStore } from '../parser/storeParser';
import { generateTestFile, GeneratorOptions } from '../generator/testGenerator';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger';
import { loadConfig } from '../config/loadConfig';
import { checkDependencies } from '../utils/dependencyCheck';

const program = new Command();
program.name('zest').description('Type-aware test generator for Zustand stores').version('0.6.1');

program
  .argument('<store-path>', 'Path to Zustand store file')
  .option('-o, --output <path>', 'Output test file')
  .option('--framework <type>', 'Test framework: jest, vitest, or auto', 'auto')
  .option('--assert', 'Generate basic assertions for state and actions', false)
  .action((storePath: string, opts: any) => {
    try {
      const cwd = process.cwd();
      const absStorePath = resolve(cwd, storePath);

      if (!existsSync(absStorePath)) {
        logError(`File not found: ${absStorePath}`);
        process.exit(1);
      }

      const config = loadConfig(cwd);
      const frameworkFlag = opts.framework || config.framework || 'auto';
      const assertFlag = !!opts.assert || !!config.assert;
      let outPath: string;
      const outputFlag = opts.output || config.output;

      const { missing, hasTestingLib } = checkDependencies(cwd);
      if (missing.length > 0) {
        logWarn(`Missing dependencies: ${missing.join(', ')}`);
        logWarn(`Run: npm install -D ${missing.join(' ')}`);
      }
      if (!hasTestingLib) {
        logWarn('@testing-library/react not found. Tests will be generated but may fail on run.');
      }

      logInfo(`Parsing: ${storePath}`);
      const { storeName, properties } = parseStore(absStorePath, config.ignoreMiddleware || []);
      logInfo(`Found: ${properties.filter(p => !p.isAction).length} state fields, ${properties.filter(p => p.isAction).length} actions`);

      let detectedFramework: 'jest' | 'vitest' = 'jest';
      if (frameworkFlag === 'auto') {
        const pkgPath = resolve(cwd, 'package.json');
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          detectedFramework = deps['vitest'] ? 'vitest' : 'jest';
          logInfo(`Auto-detected framework: ${detectedFramework}`);
        }
      } else {
        detectedFramework = frameworkFlag as 'jest' | 'vitest';
      }

      const genOpts: GeneratorOptions = { framework: detectedFramework, assert: assertFlag, storeName };
      const testCode = generateTestFile(properties, genOpts);

      if (outputFlag) {
        const { name } = parse(absStorePath);
        outPath = resolve(cwd, outputFlag.replace('[name]', name));
      } else {
        // АВТО: если флаг и конфиг не указаны, кладем тест РЯДОМ с исходником
        const { dir, name } = parse(absStorePath);
        outPath = resolve(dir, `${name}.test.ts`);
      }

      const outDir = dirname(outPath);

      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      writeFileSync(outPath, testCode, 'utf-8');
      logSuccess(`Saved to: ${outPath}`);
    } catch (err) {
      logError(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse();