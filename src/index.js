/**
 * Vite plugin for Google Apps Script.
 * Hoists entry point exports to the GAS global scope.
 *
 * @example
 * // vite.config.js
 * import { vitePluginGasHoist } from 'vite-plugin-gas-hoist';
 *
 * export default defineConfig({
 *   plugins: [vitePluginGasHoist()],
 *   build: {
 *     lib: {
 *       entry: 'src/main.js',
 *       formats: ['iife'],
 *       name: 'lib_',
 *     },
 *   },
 * });
 *
 * @returns {import('vite').Plugin}
 */
/** @typedef {'function' | 'const' | 'let' | 'var'} ExportKind */
/** @typedef {{ kind: ExportKind, isFn: boolean, isArrow: boolean }} ExportInfo */
export const vitePluginGasHoist = () => {
	/** @type {string} IIFE variable name from build.lib.name */
	let varName;

	/** @type {Map<string, ExportInfo>} */
	const exportKinds = new Map();

	return {
		name: 'vite-plugin-gas-hoist',
		apply: 'build',

		/** @param {import('vite').ResolvedConfig} config */
		configResolved(config) {
			varName = config.build.lib?.name;
		},

		buildStart() {
			exportKinds.clear();
		},

		/**
		 * Records the declaration kind of each top-level named export so that
		 * renderChunk can emit a binding that preserves the original visibility.
		 *
		 * @param {string} code
		 * @param {string} _id
		 */
		transform(code, _id) {
			// Cheap pre-filter: skip modules that obviously have no exports (node_modules, virtual modules, CSS-as-JS, etc.) before paying acorn's cost.
			if (!code.includes('export')) return null;

			let ast;
			try {
				ast = this.parse(code);
			} catch {
				// Parse errors are surfaced by Vite/Rollup elsewhere; staying silent here avoids double-reporting.
				return null;
			}

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
			return null;
		},

		renderChunk: {
			order: 'post',
			/**
			 * Appends kind-appropriate global hoist bindings for each entry export,
			 * skipping unsupported patterns (e.g. `export default`, `export class`,
			 * re-exports) whose declaration kind was not recorded by `transform`.
			 *
			 * @param {string} code
			 * @param {import('rollup').RenderedChunk} chunk
			 * @param {import('rollup').NormalizedOutputOptions} options
			 */
			handler(code, chunk, options) {
				if (options.format !== 'iife' || !chunk.isEntry) return null;

				/** @type {Array<{ name: string, info: ExportInfo }>} */
				const known = [];
				/** @type {string[]} */
				const skipped = [];

				for (const name of chunk.exports) {
					const info = exportKinds.get(name);
					if (info) {
						known.push({ name, info });
					} else {
						skipped.push(name);
					}
				}

				if (known.length > 0) {
					const label = known.length === 1 ? 'export' : 'exports';
					const list = known.map(({ name, info }) => `  - ${name} (${info.kind})`).join('\n');
					console.log(`[vite-plugin-gas-hoist] Hoisted ${known.length} ${label} to global scope:\n${list}`);
				}

				if (skipped.length > 0) {
					const label = skipped.length === 1 ? 'export' : 'exports';
					const list = skipped.map((name) => `  - ${name}`).join('\n');
					this.warn(`Skipped ${skipped.length} ${label} (unsupported pattern):\n${list}`);
				}

				if (known.length === 0) return null;

				const wrappers = known.map(({ name, info }) => emitWrapper(name, info, varName)).join('\n');

				return `${code}\n${wrappers}\n`;
			},
		},
	};
};

/**
 * Classifies a `VariableDeclaration` declarator as a value or function expression.
 *
 * @param {ExportKind} kind
 * @param {import('estree').Expression | null | undefined} init
 * @returns {ExportInfo}
 */
const classifyVariable = (kind, init) => {
	const isArrow = init?.type === 'ArrowFunctionExpression';
	const isFn = isArrow || init?.type === 'FunctionExpression';
	return { kind, isFn, isArrow };
};

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
const emitWrapper = (name, info, varName) => {
	if (info.kind === 'function') {
		return `function ${name}(...args){return ${varName}.${name}(...args)}`;
	}
	if ((info.kind === 'const' || info.kind === 'let') && info.isFn) {
		if (info.isArrow) {
			return `${info.kind} ${name} = (...args) => ${varName}.${name}(...args)`;
		}
		return `${info.kind} ${name} = function(...args){return ${varName}.${name}(...args)}`;
	}
	return `${info.kind} ${name} = ${varName}.${name}`;
};
