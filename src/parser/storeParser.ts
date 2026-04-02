import { Project, SyntaxKind } from 'ts-morph';
import { resolve } from 'path';

export interface StoreSchema {
    name: string;
    stateKeys: string[];
    actionKeys: string[];
}

export function parseStore(filePath: string): StoreSchema {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(resolve(filePath));

    const schema: StoreSchema = { name: 'store', stateKeys: [], actionKeys: [] };

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const zustandCall = calls.find(c => c.getExpression().getText().includes('create'));
    if (!zustandCall) throw new Error('Zustand create() не найден');

    const obj = zustandCall.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)[0];
    if (!obj) throw new Error('Объект стора не найден');

    obj.getProperties().forEach(prop => {
        if (prop.isKind(SyntaxKind.PropertyAssignment)) {
            const key = prop.getName();
            const init = prop.getInitializer();
            if (init && (init.isKind(SyntaxKind.ArrowFunction) || init.isKind(SyntaxKind.FunctionExpression))) {
                schema.actionKeys.push(key);
            } else {
                schema.stateKeys.push(key);
            }
        }
    });

    return schema;
}