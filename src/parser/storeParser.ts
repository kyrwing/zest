import { Project, SyntaxKind, ScriptTarget, ModuleResolutionKind, Node, ObjectLiteralExpression, Type } from 'ts-morph';
import { resolve } from 'path';

export interface StoreProperty {
  key: string;
  isAction: boolean;
  typeString: string;
  mockValue: string;
}

export interface ParseResult {
  storeName: string;
  properties: StoreProperty[];
}
// 🔍 Рекурсивный поиск объекта стора внутри обёрток (persist, devtools, etc.)
function findStoreObject(node: Node): ObjectLiteralExpression | undefined {
  if (node.isKind(SyntaxKind.ObjectLiteralExpression)) {
    const obj = node.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const props = obj.getProperties();
    if (props.length > 0 && props.some(p => p.isKind(SyntaxKind.PropertyAssignment))) {
      return obj;
    }
  }
  for (const child of node.getChildren()) {
    const result = findStoreObject(child);
    if (result) return result;
  }
  return undefined;
}

function resolveMockFromType(type: Type, initText: string): string {
  try {
    const text = type.getText();

    if (type.isStringLiteral()) return `"${type.getLiteralValue()}"`;
    if (type.isNumberLiteral()) return `${type.getLiteralValue()}`;
    if (type.isBooleanLiteral()) return `${type.getLiteralValue()}`;

    // 🔍 Базовые типы
    if (type.isString()) return `""`;
    if (type.isNumber()) return `0`;
    if (type.isBoolean()) return `false`;
    if (type.isNull() || type.isUndefined()) return `null`;

    // 🔍 Массивы (используем isArray())
    if (type.isArray() || text.startsWith('[') || text.includes('[]')) return `[]`;

    // 🔍 Объекты / Record / интерфейсы
    if (type.isObject()) {
      if (text.startsWith('Record<')) return `{}`;
      return `{}`;
    }

    // 🔍 Union-типы (берём первый безопасный литерал)
    if (type.isUnion()) {
      // Приоритет: если разработчик явно написал null/undefined в коде, отдаём его
      if (initText === 'null') return 'null';
      if (initText === 'undefined') return 'undefined';

      const unionTypes = type.getUnionTypes();
      // Ищем первый конкретный тип среди вариантов юниона
      for (const t of unionTypes) {
        if (t.isStringLiteral()) return `"${t.getLiteralValue()}"`;
        if (t.isNumberLiteral()) return `${t.getLiteralValue()}`;
        if (t.isBooleanLiteral()) return `${t.getLiteralValue()}`;
        if (t.isObject() || t.isClass()) return '{}';
        if (t.isNull()) return 'null';
        if (t.isUndefined()) return 'undefined';
      }
      // Fallback: берём первый тип из строки
      return `"${text.split('|')[0].trim()}"`;
    }

    // 🔍 Fallback
    return initText || '{}';
  } catch (e) {
    // Если type inference упал → откат к старому поведению
    console.warn(`⚠️ Type inference fallback for "${initText}":`, e instanceof Error ? e.message : e);
    return initText || '{}';
  }
}

export function parseStore(filePath: string): ParseResult {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      target: ScriptTarget.ES2020,
      moduleResolution: ModuleResolutionKind.NodeJs,
      skipLibCheck: true, // ✅ Включаем для ускорения и избежания ошибок в node_modules
      strict: true,
      esModuleInterop: true,
    },
  });

  const sourceFile = project.addSourceFileAtPath(resolve(filePath));
  project.resolveSourceFileDependencies();

  const properties: StoreProperty[] = [];
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  const zustandCall = calls.find(c => {
    const expr = c.getExpression();
    const text = expr.getText();
    return text.includes('create') && !text.includes('createContext');
  });

  if (!zustandCall) throw new Error('Zustand create() not found');

  let storeName = 'useTestStore';
  const varDecl = zustandCall.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
  if (varDecl) {
    const nameNode = varDecl.getNameNode();
    if (nameNode?.isKind(SyntaxKind.Identifier)) {
      storeName = nameNode.getText();
    }
  }

  const obj = findStoreObject(zustandCall);
  if (!obj) throw new Error('Store object not found');

  obj.getProperties().forEach(prop => {
    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const key = prop.getName();
      const init = prop.getInitializer();
      const isFunction = !!init && (init.isKind(SyntaxKind.ArrowFunction) || init.isKind(SyntaxKind.FunctionExpression));

      let typeString = 'unknown';
      let mockValue = 'null';

      if (init) {
        const initText = init.getText().trim();

        // 🔍 ПРИОРИТЕТ 1: Читаем явные литералы (быстро и точно)
        if (init.isKind(SyntaxKind.ObjectLiteralExpression)) {
          mockValue = '{}';
          typeString = 'object';
        }
        else if (init.isKind(SyntaxKind.ArrayLiteralExpression)) {
          mockValue = '[]';
          typeString = 'array';
        }
        else if (init.isKind(SyntaxKind.NullKeyword)) {
          mockValue = 'null';
          typeString = 'null';
        }
        else if (init.isKind(SyntaxKind.TrueKeyword)) {
          mockValue = 'true';
          typeString = 'boolean';
        }
        else if (init.isKind(SyntaxKind.FalseKeyword)) {
          mockValue = 'false';
          typeString = 'boolean';
        }
        else if (initText === 'true' || initText === 'false') {
          mockValue = initText;
          typeString = 'boolean';
        }
        else if (/^["'].*["']$/.test(initText)) {
          mockValue = initText;
          typeString = 'string';
        }
        else if (/^-?\d+(\.\d+)?$/.test(initText)) {
          mockValue = initText;
          typeString = 'number';
        }
        // 🔍 ПРИОРИТЕТ 2: Type Inference 2.0 для сложных случаев
        else {
          const type = init.getType();
          typeString = type.getText();
          mockValue = resolveMockFromType(type, initText);
        }
      }

      properties.push({
        key,
        isAction: isFunction,
        typeString,
        mockValue: isFunction ? `jest.fn()` : mockValue
      });
    }
  });

  return { storeName, properties };
}