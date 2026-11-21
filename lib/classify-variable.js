/** @typedef {'function' | 'const' | 'let' | 'var'} ExportKind */
/** @typedef {{ kind: ExportKind, isFn: boolean, isArrow: boolean }} ExportInfo */

/**
 * Classifies a `VariableDeclaration` declarator as a value or function expression.
 *
 * @param {ExportKind} kind
 * @param {import('estree').Expression | null | undefined} init
 * @returns {ExportInfo}
 */
export const classifyVariable = (kind, init) => {
	const isArrow = init?.type === 'ArrowFunctionExpression';
	const isFn = isArrow || init?.type === 'FunctionExpression';
	return { kind, isFn, isArrow };
};
