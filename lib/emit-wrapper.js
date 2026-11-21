/**
 * Renders the hoisted binding for a single export, preserving the original
 * declaration kind and (for `const`/`let` function expressions) the function
 * shape (arrow vs `function` expression) so callers see a callable wrapper
 * that GAS recognizes as a function.
 *
 * @param {string} name
 * @param {ExportInfo} info
 * @param {string} varName
 * @returns {string}
 */
export const emitWrapper = (name, info, varName) => {
	if (info.kind === 'function') {
		return `function ${name}(...args){return ${varName}.${name}(...args)}`;
	}
	if (info.isFn) {
		if (info.isArrow) {
			return `${info.kind} ${name} = (...args) => ${varName}.${name}(...args)`;
		}
		return `${info.kind} ${name} = function(...args){return ${varName}.${name}(...args)}`;
	}
	return `${info.kind} ${name} = ${varName}.${name}`;
};
