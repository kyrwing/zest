/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Запускать тесты только из папки tests/
  testMatch: ['**/tests/**/*.test.ts'],
  // Игнорировать сгенерированные файлы и example/
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/example/',
    'output.*\\.test\\.ts$',
    'generated.*\\.test\\.ts$'
  ],
  // Преобразовывать TypeScript через ts-jest
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  }
};