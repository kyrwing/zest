import { StoreProperty } from '../parser/storeParser';

export interface GeneratorOptions {
  framework: 'jest' | 'vitest';
  assert: boolean;
  storeName?: string;
}

export function generateTestFile(props: StoreProperty[], opts: GeneratorOptions): string {
  const { framework, assert, storeName = 'useTestStore' } = opts;
  const fnMock = framework === 'jest' ? 'jest.fn()' : 'vi.fn()';

  const imports = [
    "import { renderHook, act } from '@testing-library/react';",
    framework === 'vitest' ? "import { vi } from 'vitest';" : null,
    "import { create } from 'zustand';"
  ].filter(Boolean).join('\n');

  const storeMock = `const ${storeName} = create((set) => ({\n${props.map(p => `  ${p.key}: ${p.isAction ? fnMock : p.mockValue},`).join('\n')
    }\n}));`;

  let assertions = '';
  if (assert) {
    assertions = `\n  it('initializes with correct values', () => {\n    const { result } = renderHook(() => ${storeName}());\n${props.map(p => {
      if (p.isAction) return `    expect(typeof result.current.${p.key}).toBe('function');`;
      if (p.mockValue === '{}') return `    expect(result.current.${p.key}).toEqual({});`;
      if (p.mockValue === '[]') return `    expect(result.current.${p.key}).toEqual([]);`;
      return `    expect(result.current.${p.key}).toBe(${p.mockValue});`;
    }).join('\n')
      }\n  });`;
  }

  const testBlock = `describe('${storeName}', () => {
  it('initializes correctly', () => {
    const { result } = renderHook(() => ${storeName}());
    expect(result.current).toBeDefined();
  });${assertions}
});`;

  return `${imports}\n\n${storeMock}\n\n${testBlock}`;
}