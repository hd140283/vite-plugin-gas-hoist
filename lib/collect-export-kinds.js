import { classifyVariable } from './classify-variable.js';

/**
 * Collects the declaration kind of each top-level named export in a module.
 *
 * @param {import('estree').Program} ast
 * @returns {Map<string, ExportInfo>}
 */
export const collectExportKinds = (ast) => {
	/** @type {Map<string, ExportInfo>} */
	const localKinds = new Map();
	for (const node of ast.body) {
		if (node.type === 'FunctionDeclaration' && node.id) {
			localKinds.set(node.id.name, { kind: 'function', isFn: true, isArrow: false });
		} else if (node.type === 'VariableDeclaration') {
			for (const decl of node.declarations) {
				if (decl.id.type === 'Identifier') {
					localKinds.set(decl.id.name, classifyVariable(node.kind, decl.init));
				}
			}
		}
	}

	/** @type {Map<string, ExportInfo>} */
	const exportKinds = new Map();
	for (const node of ast.body) {
		if (node.type !== 'ExportNamedDeclaration') continue;

		if (node.declaration?.type === 'VariableDeclaration') {
			const kind = node.declaration.kind;
			for (const decl of node.declaration.declarations) {
				if (decl.id.type === 'Identifier') {
					exportKinds.set(decl.id.name, classifyVariable(kind, decl.init));
				}
			}
		} else if (node.declaration?.type === 'FunctionDeclaration') {
			if (node.declaration.id?.type === 'Identifier') {
				exportKinds.set(node.declaration.id.name, { kind: 'function', isFn: true, isArrow: false });
			}
		} else if (node.specifiers.length > 0 && !node.source) {
			for (const spec of node.specifiers) {
				if (spec.type !== 'ExportSpecifier') continue;
				const info = localKinds.get(spec.local.name);
				if (info) {
					exportKinds.set(spec.exported.name, info);
				}
			}
		}
	}
	return exportKinds;
};
