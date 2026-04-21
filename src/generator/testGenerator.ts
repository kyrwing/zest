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
    const initAssertions = props
      .filter(p => !p.isAction)
      .map(p => {
        if (p.mockValue === '{}') return `    expect(result.current.${p.key}).toEqual({});`;
        if (p.mockValue === '[]') return `    expect(result.current.${p.key}).toEqual([]);`;
        return `    expect(result.current.${p.key}).toBe(${p.mockValue});`;
      }).join('\n');
    const actionTypeChecks = props
      .filter(p => p.isAction)
      .map(p => `    expect(typeof result.current.${p.key}).toBe('function');`)
      .join('\n');

    const actionCalls = props
      .filter(p => p.isAction && p.actionParams && p.actionParams.length > 0)
      .map(p => {
        const args = p.actionParams!.map(ap => ap.mockValue).join(', ');
        return `    act(() => result.current.${p.key}(${args}));
    expect(result.current.${p.key}).toHaveBeenCalledWith(${args});`;
      }).join('\n');

    const noParamActions = props
      .filter(p => p.isAction && (!p.actionParams || p.actionParams.length === 0))
      .map(p => `    act(() => result.current.${p.key}());
    expect(result.current.${p.key}).toHaveBeenCalledWith();`);

    let behaviorAssertions = '';
    if (actionCalls || noParamActions.length > 0) {
      behaviorAssertions = `\n\n  it('calls actions with typed mocks', () => {
    const { result } = renderHook(() => ${storeName}());
  ${actionCalls ? actionCalls + '\n' : ''}${noParamActions.length > 0 ? noParamActions.join('\n') : ''}
  });`;
    }

    assertions = `\n  it('initializes with correct values', () => {
    const { result } = renderHook(() => ${storeName}());
  ${initAssertions ? initAssertions + '\n' : ''}${actionTypeChecks ? actionTypeChecks : ''}
  });${behaviorAssertions}`;
  }

  const testBlock = `describe('${storeName}', () => {
  it('initializes correctly', () => {
    const { result } = renderHook(() => ${storeName}());
    expect(result.current).toBeDefined();
  });${assertions}
});`;

  return `${imports}\n\n${storeMock}\n\n${testBlock}`;
}