# 🧪 @kyrwing/zest

[![npm version](https://img.shields.io/npm/v/@kyrwing/zest)](https://npmjs.com/package/@kyrwing/zest)
[![npm downloads](https://img.shields.io/npm/dm/@kyrwing/zest)](https://npmjs.com/package/@kyrwing/zest)
[![GitHub stars](https://img.shields.io/github/stars/kyrwing/zest)](https://github.com/kyrwing/zest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org)

> ⚡ **Type-aware test generator for Zustand stores** — automatically generate Jest/Vitest tests with typed mocks, assertions, and behavioral testing. Cut boilerplate, enforce best practices, ship faster.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🎛 CLI Reference](#-cli-reference)
- [⚙️ Configuration](#-configuration)
- [🧠 How It Works](#-how-it-works)
- [📝 Examples](#-examples)
- [🔌 Integration](#-integration)
- [🔍 Troubleshooting](#-troubleshooting)
- [👨‍💻 API](#-api)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔹 **Type-Aware Parsing** | Uses `ts-morph` AST + TypeChecker to infer exact mock values (`null`, `false`, `{}`, `[]`) |
| 🔹 **Dynamic Store Names** | Extracts `useAuthStore` from code — no hardcoded `useTestStore` |
| 🔹 **Action Signature Mapping** *(v0.6.0)* | Generates `act(() => action(...))` + `toHaveBeenCalledWith()` for behavior testing |
| 🔹 **Framework Auto-Detect** | Supports `jest` / `vitest` — auto-detected from `package.json` or explicit via `--framework` |
| 🔹 **Middleware Support** | Recursively finds store object inside `persist()`, `devtools()`, custom wrappers |
| 🔹 **Configurable Output** | Auto-saves next to source, or use `[name]` placeholder in `.zestrc.js` |
| 🔹 **Zero Runtime Dependencies** | CLI-only tool — generated tests use your project's existing deps |

---

## 📦 Installation

### As a dev dependency (recommended)
```bash
npm install -D @kyrwing/zest
# or
yarn add -D @kyrwing/zest
# or
pnpm add -D @kyrwing/zest
```

### Global install (for CLI usage anywhere)
```bash
npm install -g @kyrwing/zest
```

### Requirements
| Dependency | Version | Purpose |
|------------|---------|---------|
| `Node.js` | `>=16.0.0` | Runtime for CLI |
| `TypeScript` | `>=4.5.0` | Required for type inference |
| `zustand` | `>=4.0.0` | Stores you want to test |
| `@testing-library/react` | `>=12.0.0` | For running generated tests (devDependency of your project) |

---

## 🚀 Quick Start

### 1. Create a Zustand store
```ts
// src/stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: { id: string; name: string } | null;
  isLoading: boolean;
  login: (token: string, userId: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  
  login: async (token, userId) => {
    // API call...
    set({ token, user: { id: userId, name: 'User' }, isLoading: false });
  },
  
  logout: () => set({ token: null, user: null }),
}));
```

### 2. Generate a test
```bash
# Basic usage
npx @kyrwing/zest src/stores/authStore.ts --assert

# With custom output path
npx @kyrwing/zest src/stores/authStore.ts -o src/stores/authStore.test.ts --assert

# With explicit framework
npx @kyrwing/zest src/stores/authStore.ts --framework vitest --assert
```

### 3. Review the generated test
```ts
// src/stores/authStore.test.ts — auto-generated
import { renderHook, act } from '@testing-library/react';
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
}));

describe('useAuthStore', () => {
  it('initializes correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current).toBeDefined();
  });

  it('initializes with correct values', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.token).toBe(null);
    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  // 🆕 v0.6.0: Behavioral tests with typed mocks
  it('calls actions with typed mocks', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => result.current.login("", ""));
    expect(result.current.login).toHaveBeenCalledWith("", "");
    
    act(() => result.current.logout());
    expect(result.current.logout).toHaveBeenCalledWith();
  });
});
```

### 4. Run your tests
```bash
# With Jest
npm test -- authStore.test.ts

# With Vitest
npx vitest run authStore.test.ts
```

---

## 🎛 CLI Reference

### Syntax
```bash
zest <store-path> [options]
```

### Arguments
| Argument | Description | Example |
|----------|-------------|---------|
| `<store-path>` | Path to your Zustand store file | `src/stores/authStore.ts` |

### Options
| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--output <path>` | `-o` | Output path for generated test. Supports `[name]` placeholder | Auto: `${dirname}/${name}.test.ts` |
| `--framework <type>` | — | Test framework: `jest`, `vitest`, or `auto` | `auto` (detects from `package.json`) |
| `--assert` | — | Generate basic assertions for state and actions | `false` |
| `--help` | `-h` | Show help | — |
| `--version` | `-V` | Show version | — |

### Examples
```bash
# 🎯 Basic generation (mocks only, no assertions)
npx @kyrwing/zest src/store.ts

# ✅ With assertions + auto output path
npx @kyrwing/zest src/store.ts --assert

# 📁 Custom path with placeholder
npx @kyrwing/zest src/store.ts -o "tests/[name].spec.ts" --assert

# 🧪 Explicit framework selection
npx @kyrwing/zest src/store.ts --framework vitest --assert

# 🔍 Full combination
npx @kyrwing/zest src/auth/store.ts -o "__tests__/auth/[name].test.ts" --framework jest --assert
```

---

## ⚙️ Configuration: `.zestrc.js`

Create a `.zestrc.js` file in your project root for global defaults:

```js
// @ts-check
/** @type {import('@kyrwing/zest').ZestConfig} */
module.exports = {
  // 'jest', 'vitest', or 'auto' (default)
  framework: 'auto',
  
  // Generate basic assertions by default
  assert: true,
  
  // Default output path ([name] = filename without extension)
  output: '__tests__/[name].test.ts',
  
  // Ignore these middleware wrappers during parsing
  ignoreMiddleware: ['devtools', 'persist', 'subscribeWithSelector'],
  
  // AI settings (coming in v0.7.0)
  // ai: { provider: 'openai', model: 'gpt-4', enabled: false },
};
```

### Priority Order
```
CLI flags > .zestrc.js > built-in defaults
```

Example: If config has `assert: true` but you run without `--assert`, assertions **will** be generated. To disable: `zest file.ts --assert false`.

---

## 🧠 How It Works

### Architecture Overview
```
┌─────────────────┐
│  CLI (index.ts) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  loadConfig()   │ → reads .zestrc.js
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  parseStore()   │ → ts-morph AST parsing
│  (storeParser)  │    • extracts storeName
│                 │    • identifies state/actions
│                 │    • infers types via TypeChecker
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ generateTestFile│ → template rendering
│ (testGenerator) │    • mocks for state
│                 │    • jest.fn()/vi.fn() for actions
│                 │    • assertions: toBe/toEqual/typeof
│                 │    • 🆕 v0.6.0: act() + toHaveBeenCalledWith
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  writeFileSync  │ → saves .test.ts
└─────────────────┘
```

### Type Inference Strategy
Two-pass approach for accurate mocks:

```
PRIORITY 1: Explicit Literals (fast & precise)
├─ ObjectLiteral → '{}'
├─ ArrayLiteral → '[]'
├─ NullKeyword → 'null'
├─ True/False → 'true'/'false'
├─ String regex → '"value"'
└─ Number regex → '42'

PRIORITY 2: Type Inference via ts-morph (complex cases)
├─ Union<string | null> → 'null' (if initialized as null)
├─ Record<K, V> → '{}'
├─ Array<T> → '[]'
├─ Interface → '{}'
└─ Fallback → initText || '{}'
```

### Action Signature Mapping (v0.6.0)
For functions, the parser extracts parameter signatures:

```ts
// Source code
setLive: (roomId: number, title: string, cover: string) => { ... }

// Extracted params
[
  { name: 'roomId', typeString: 'number', mockValue: '0' },
  { name: 'title', typeString: 'string', mockValue: '""' },
  { name: 'cover', typeString: 'string', mockValue: '""' }
]

// Generated test
act(() => result.current.setLive(0, "", ""));
expect(result.current.setLive).toHaveBeenCalledWith(0, "", "");
```

---

## 📝 Examples

### Example 1: Simple Store with Primitives
```ts
// src/stores/counterStore.ts
export const useCounterStore = create((set) => ({
  count: 0,
  step: 1,
  increment: () => set((s) => ({ count: s.count + s.step })),
  reset: () => set({ count: 0 }),
}));
```

```bash
npx @kyrwing/zest src/stores/counterStore.ts --assert
```

```ts
// ✅ Generated test
const useCounterStore = create((set) => ({
  count: 0,
  step: 1,
  increment: jest.fn(),
  reset: jest.fn(),
}));

describe('useCounterStore', () => {
  it('initializes with correct values', () => {
    const { result } = renderHook(() => useCounterStore());
    expect(result.current.count).toBe(0);
    expect(result.current.step).toBe(1);
    expect(typeof result.current.increment).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('calls actions with typed mocks', () => {
    const { result } = renderHook(() => useCounterStore());
    act(() => result.current.increment());
    expect(result.current.increment).toHaveBeenCalledWith();
    act(() => result.current.reset());
    expect(result.current.reset).toHaveBeenCalledWith();
  });
});
```

### Example 2: Store with `Record` and Async Actions
```ts
// src/stores/usersStore.ts
interface User { id: string; name: string; email: string; }

export const useUsersStore = create((set) => ({
  users: {} as Record<string, User>,
  isLoading: false,
  
  fetchUser: async (id: string) => {
    const res = await fetch(`/api/users/${id}`);
    const user = await res.json();
    set((s) => ({ users: { ...s.users, [id]: user } }));
  },
  
  addUser: (user: User) => set((s) => ({ 
    users: { ...s.users, [user.id]: user } 
  })),
}));
```

```bash
npx @kyrwing/zest src/stores/usersStore.ts --assert
```

```ts
// ✅ Generated test
const useUsersStore = create((set) => ({
  users: {},
  isLoading: false,
  fetchUser: jest.fn(),
  addUser: jest.fn(),
}));

describe('useUsersStore', () => {
  it('initializes with correct values', () => {
    const { result } = renderHook(() => useUsersStore());
    expect(result.current.users).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.fetchUser).toBe('function');
    expect(typeof result.current.addUser).toBe('function');
  });

  it('calls actions with typed mocks', () => {
    const { result } = renderHook(() => useUsersStore());
    act(() => result.current.fetchUser(""));
    expect(result.current.fetchUser).toHaveBeenCalledWith("");
    act(() => result.current.addUser({ id: "", name: "", email: "" }));
    expect(result.current.addUser).toHaveBeenCalledWith({ id: "", name: "", email: "" });
  });
});
```

### Example 3: Store with Middleware (`persist`, `devtools`)
```ts
// src/stores/settingsStore.ts
import { persist, devtools } from 'zustand/middleware';

export const useSettingsStore = create(
  devtools(
    persist(
      (set) => ({
        darkMode: false,
        setDarkMode: (v: boolean) => set({ darkMode: v }),
      }),
      { name: 'settings' }
    )
  )
);
```

```bash
npx @kyrwing/zest src/stores/settingsStore.ts --assert
```

```ts
// ✅ Parser recursively finds store object inside wrappers
const useSettingsStore = create((set) => ({
  darkMode: false,
  setDarkMode: jest.fn(),
}));

describe('useSettingsStore', () => {
  // ... assertions work as usual
});
```

### Example 4: `export default` (fallback name)
```ts
// src/stores/anonymousStore.ts
export default create((set) => ({
  value: 'test',
  setValue: (v: string) => set({ value: v }),
}));
```

```bash
npx @kyrwing/zest src/stores/anonymousStore.ts --assert
```

```ts
// ⚠️ Name not extracted → safe fallback used
const useTestStore = create((set) => ({
  value: "test",
  setValue: jest.fn(),
}));

describe('useTestStore', () => {
  // ... tests work, but name is generic
});
```

> 💡 **Pro Tip**: For best DX, use named exports: `export const useMyStore = create(...)`.

---

## 🔌 Integration

### In `package.json` (scripts)
```json
{
  "scripts": {
    "test": "jest",
    "test:generate": "zest src/stores --assert",
    "test:generate:watch": "nodemon --watch src/stores --exec 'zest src/stores --assert'"
  }
}
```

### In CI/CD (GitHub Actions example)
```yaml
# .github/workflows/test-gen.yml
name: Generate Tests

on:
  push:
    paths:
      - 'src/stores/**/*.ts'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      
      - run: npm ci
      - run: npx @kyrwing/zest src/stores --assert
      
      # Optional: verify generated tests haven't changed (catch forgotten commits)
      - run: git diff --exit-code -- '*.test.ts' || echo "❌ Generated tests changed. Please commit them."
```

### In pre-commit hook (Husky)
```bash
# .husky/pre-commit
npx lint-staged
```

```js
// .lintstagedrc.js
module.exports = {
  'src/stores/**/*.ts': (files) => {
    const storeFiles = files.join(' ');
    return [`npx @kyrwing/zest ${storeFiles} --assert`];
  },
};
```

---

## 🔍 Troubleshooting

### ❌ `Zustand create() not found`
**Cause**: Parser didn't find a `create()` call in the file.  
**Fix**:
- Ensure the file exports `create(...)` from `zustand`
- Check for typos: `createContext` ≠ `create`
- If using `create` from another package, add alias in `tsconfig.json`

### ❌ `Store object not found`
**Cause**: No state object found inside `create()`.  
**Fix**:
- Ensure `create()` receives an object or function returning an object
- Middleware (`persist`, `devtools`) is supported via recursive search, but complex custom wrappers may need parser updates

### ❌ Inaccurate mocks (`"string"` instead of `""`, `"boolean"` instead of `false`)
**Cause**: Type inference couldn't determine a concrete value.  
**Fix**:
- Initialize fields with explicit literals: `token: null` instead of `token: undefined as string | null`
- For complex types, use `as const` or concrete values

### ❌ `Cannot find module '@testing-library/react'` when running `tsc`
**Cause**: This is a dependency of your project, not `zest`.  
**Fix**:
```bash
npm install -D @testing-library/react @types/react
```
Or ignore during validation: `tsc --skipLibCheck`

### ❌ Generated test fails at runtime
**Cause**: `jest.fn()` mocks aren't configured, or hook requires context.  
**Fix**:
- Add `mockImplementation` manually in your test:
  ```ts
  beforeEach(() => {
    (useAuthStore().login as jest.Mock).mockResolvedValue(undefined);
  });
  ```
- For context-dependent hooks, wrap `renderHook` in a `wrapper`

---

## 👨‍💻 API

### `parseStore(filePath: string): ParseResult`
Parses a store file and returns its structure.

```ts
// src/parser/storeParser.ts
export interface ParseResult {
  storeName: string;           // Hook name: 'useAuthStore'
  properties: StoreProperty[]; // Array of fields
}

export interface StoreProperty {
  key: string;                 // 'token', 'login'
  isAction: boolean;           // true for functions
  typeString: string;          // 'string | null', 'function'
  mockValue: string;           // 'null', 'jest.fn()'
  actionParams?: ActionParam[]; // 🆕 v0.6.0: action parameters
}

export interface ActionParam {
  name: string;        // 'roomId'
  typeString: string;  // 'number'
  mockValue: string;   // '0'
}
```

### `generateTestFile(props, opts): string`
Generates test code.

```ts
// src/generator/testGenerator.ts
export interface GeneratorOptions {
  framework: 'jest' | 'vitest';  // Framework for mocks
  assert: boolean;               // Whether to generate assertions
  storeName?: string;            // Store name (for dynamic substitution)
}
```

### `loadConfig(cwd: string): ZestConfig`
Loads configuration from `.zestrc.js`.

```ts
// src/config/loadConfig.ts
export interface ZestConfig {
  framework?: 'jest' | 'vitest' | 'auto';
  assert?: boolean;
  output?: string;          // Supports [name] placeholder
  ignoreMiddleware?: string[]; // Middleware to skip during parsing
}
```

---

## 🤝 Contributing

```bash
# 1. Fork the repository
# 2. Clone and install dependencies
git clone https://github.com/your-username/zest.git
cd zest && npm install

# 3. Create a feature branch
git checkout -b feat/your-feature

# 4. Make changes and test locally
npm run build
npx ts-node src/cli/index.ts example/store.ts --assert

# 5. Open a Pull Request
```

### Local Development
```bash
# Run CLI without building
npm run dev -- <args>

# Build to dist/
npm run build

# Run parser tests
npm test
```

---

## 📜 License

MIT © [Kirill Poluektov](https://github.com/kyrwing)

---

> 💡 **Pro Tip**: `zest` doesn't replace manual test writing — it **accelerates the start**. The generated skeleton is 80% of the work. The remaining 20% (business logic, edge cases, API mocks) you write manually, focusing on value, not boilerplate.

**Happy testing!** 🧪✨
