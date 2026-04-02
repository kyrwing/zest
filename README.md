# 🧪 @kyrwing/zest

[![npm version](https://img.shields.io/npm/v/@kyrwing/zest)](https://npmjs.com/package/@kyrwing/zest)
[![npm downloads](https://img.shields.io/npm/dm/@kyrwing/zest)](https://npmjs.com/package/@kyrwing/zest)
[![GitHub stars](https://img.shields.io/github/stars/kyrwing/zest)](https://github.com/kyrwing/zest)
[![CI](https://github.com/kyrwing/zest/actions/workflows/ci.yml/badge.svg)](https://github.com/kyrwing/zest/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> ⚡ CLI that generates production-ready, type-safe Jest tests for Zustand stores. Cut boilerplate, enforce best practices.

## 🎯 The Problem
Writing tests for Zustand stores involves repetitive boilerplate: manual mocks, lost TypeScript types, and inconsistent test structure. Teams waste hours on setup instead of testing business logic.

## ✅ The Solution
`@kyrwing/zest` analyzes your store's AST, extracts state and actions, and generates fully typed, Jest-compatible test scaffolds automatically. No more `any`, no more copy-paste, just reliable tests that evolve with your code.

## 🚀 Quick Start
```bash
# Install the package
npm install -D @kyrwing/zest

# Generate test from a Zustand store
npx @kyrwing/zest ./src/myStore.ts -o myStore.test.ts

# Or run locally during development
npm run dev -- ./src/myStore.ts -o myStore.test.ts