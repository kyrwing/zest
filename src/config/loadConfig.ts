import { resolve } from 'path';
import { existsSync } from 'fs';

export interface ZestConfig {
  framework?: 'jest' | 'vitest' | 'auto';
  assert?: boolean;
  output?: string;
  ai?: { provider?: string; model?: string; enabled?: boolean };
  ignoreMiddleware?: string[];
}

export function loadConfig(cwd: string): ZestConfig {
  const configPath = resolve(cwd, '.zestrc.js');
  if (existsSync(configPath)) {
    try {
      return require(configPath);
    } catch {
      console.warn('⚠️ Failed to load .zestrc.js, using defaults');
    }
  }
  return {};
}