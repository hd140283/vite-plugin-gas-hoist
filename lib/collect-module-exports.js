import { classifyVariable } from './classify-variable.js';

/** @typedef {{ source: string, name: string }} ExportLink */
/** @typedef {{ bindings: Map<string, ExportInfo | ExportLink>, stars: string[], sources: string[] }} ModuleExports */

/**
 * Collects the top-level named exports of a module. Each export is bound to
 * its declaration kind, or to a link naming the module it is re-exported from.
 *
 * @param {import('estree').Program} ast
 * @returns {ModuleExports}
 */
export const collectModuleExports = (ast) => {
	/** @type {Map<string, ExportInfo | ExportLink>} */
	const locals = new Map();
	for (const node of ast.body) {
		if (node.type === 'FunctionDeclaration' && node.id) {
			locals.set(node.id.name, { kind: 'function', isFn: true, isArrow: false });
		} else if (node.type === 'VariableDeclaration') {
			for (const decl of node.declarations) {
				if (decl.id.type === 'Identifier') {
					locals.set(decl.id.name, classifyVariable(node.kind, decl.init));
				}
			}
		} else if (node.type === 'ImportDeclaration') {
			for (const spec of node.specifiers) {
				if (spec.type === 'ImportSpecifier') {
					locals.set(spec.local.name, { source: node.source.value, name: spec.imported.name });
				}
			}
		}
	}

	/** @type {Map<string, ExportInfo | ExportLink>} */
	const bindings = new Map();
	/** @type {string[]} */
	const stars = [];
	for (const node of ast.body) {
		if (node.type === 'ExportAllDeclaration') {
			if (!node.exported) {
				stars.push(node.source.value);
			}
			continue;
		}
		if (node.type !== 'ExportNamedDeclaration') continue;

		if (node.declaration?.type === 'VariableDeclaration') {
			const kind = node.declaration.kind;
			for (const decl of node.declaration.declarations) {
				if (decl.id.type === 'Identifier') {
					bindings.set(decl.id.name, classifyVariable(kind, decl.init));
				}
			}
		} else if (node.declaration?.type === 'FunctionDeclaration') {
			if (node.declaration.id?.type === 'Identifier') {
				bindings.set(node.declaration.id.name, { kind: 'function', isFn: true, isArrow: false });
			}
		} else {
			for (const spec of node.specifiers) {
				if (spec.type !== 'ExportSpecifier') continue;
				const binding = node.source
					? { source: node.source.value, name: spec.local.name }
					: locals.get(spec.local.name);
				if (binding) {
					bindings.set(spec.exported.name, binding);
				}
			}
		}
	}

	const linked = [...bindings.values()].flatMap((binding) => ('source' in binding ? [binding.source] : []));
	const sources = [...new Set([...linked, ...stars])];

	return { bindings, stars, sources };
};
