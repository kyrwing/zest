import { Project, SyntaxKind, ScriptTarget, ModuleResolutionKind } from 'ts-morph';
import { resolve } from 'path';

export interface StoreProperty {
  key: string;
  isAction: boolean;
  typeString: string;
  mockValue: string;
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
  const zustandCall = calls.find(c => c.getExpression().getText().includes('create'));
  if (!zustandCall) throw new Error('Zustand create() not found');

  const obj = zustandCall.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)[0];
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
        
        // Прямой маппинг литералов из исходного кода
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
        else if (initText === '[]') {
          mockValue = '[]';
          typeString = 'array';
        }
        else if (initText === '{}') {
          mockValue = '{}';
          typeString = 'object';
        }
        else {
          // Fallback: используем type inference для сложных случаев
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