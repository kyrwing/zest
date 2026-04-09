import { Project, SyntaxKind, ScriptTarget, ModuleResolutionKind, Node, ObjectLiteralExpression } from 'ts-morph';
import { resolve } from 'path';

export interface StoreProperty {
  key: string;
  isAction: boolean;
  typeString: string;
  mockValue: string;
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
  // Иначе ищем в детях (рекурсия)
  for (const child of node.getChildren()) {
    const result = findStoreObject(child);
    if (result) return result;
  }
  return undefined;
}

export function parseStore(filePath: string): StoreProperty[] {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      target: ScriptTarget.ES2020,
      moduleResolution: ModuleResolutionKind.NodeJs,
      skipLibCheck: false,
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
        // 🔍 ПРИОРИТЕТ 2: Читаем текст для литералов
        else {
          const initText = init.getText().trim();
          
          if (initText === 'true' || initText === 'false') {
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
          else {
            // Fallback на type inference
            const type = init.getType();
            typeString = type.getText();
            if (typeString.includes('string')) mockValue = `"test_${key}"`;
            else if (typeString.includes('number')) mockValue = `0`;
            else if (typeString.includes('boolean')) mockValue = `true`;
            else if (typeString.startsWith('[')) mockValue = `[]`;
            else if (typeString.startsWith('{') || type.isObject()) mockValue = `{}`;
            else mockValue = `null`;
          }
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

  return properties;
}