import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

export function checkDependencies(cwd: string): { missing: string[]; hasTestingLib: boolean } {
  const pkgPath = resolve(cwd, 'package.json');
  if (!existsSync(pkgPath)) return { missing: [], hasTestingLib: false };

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const missing: string[] = [];
  const hasTestingLib = !!deps['@testing-library/react'];

  if (!deps['zustand']) missing.push('zustand');
  if (!hasTestingLib) missing.push('@testing-library/react');

  return { missing, hasTestingLib };
}