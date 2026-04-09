// @ts-check
/** @type {import('./dist/config/loadConfig').ZestConfig} */
module.exports = {
  // 'jest', 'vitest', or 'auto' (default)
  framework: 'auto',
  
  // Generate basic assertions for state and actions
  assert: true,
  
  // Default output path
  output: '__tests__/[name].test.ts',
  
  // AI settings (Phase 3)
  // ai: { provider: 'openai', enabled: false },
};