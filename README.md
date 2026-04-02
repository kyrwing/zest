# 🧪 zest

> ⚡ CLI that generates production-ready, type-safe Jest tests for Zustand stores. Cut boilerplate, enforce best practices.

## 🎯 The Problem
Writing tests for Zustand stores involves repetitive boilerplate: manual mocks, lost TypeScript types, and inconsistent test structure. Teams waste hours on setup instead of testing business logic.

## ✅ The Solution
`zest` analyzes your store's AST, extracts state and actions, and generates fully typed, Jest-compatible test scaffolds automatically. No more `any`, no more copy-paste, just reliable tests that evolve with your code.

## 🚀 Quick Start
```bash
# Generate test from a Zustand store
npx zest ./src/myStore.ts -o myStore.test.ts

# Or run locally during development
npm run dev -- ./src/myStore.ts -o myStore.test.ts