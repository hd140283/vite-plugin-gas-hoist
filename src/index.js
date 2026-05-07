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
export const vitePluginGasHoist = () => {
	/** @type {string} IIFE variable name from build.lib.name */
	let varName;

	/** @type {Map<string, 'function' | 'const' | 'let' | 'var'>} */
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
			let ast;
			try {
				ast = this.parse(code);
			} catch {
				return null;
			}

			/** @type {Map<string, 'function' | 'const' | 'let' | 'var'>} */
			const localKinds = new Map();
			for (const node of ast.body) {
				if (node.type === 'FunctionDeclaration' && node.id) {
					localKinds.set(node.id.name, 'function');
				} else if (node.type === 'VariableDeclaration') {
					for (const decl of node.declarations) {
						if (decl.id.type === 'Identifier') {
							localKinds.set(decl.id.name, node.kind);
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
							exportKinds.set(decl.id.name, kind);
						}
					}
				} else if (node.declaration?.type === 'FunctionDeclaration') {
					if (node.declaration.id?.type === 'Identifier') {
						exportKinds.set(node.declaration.id.name, 'function');
					}
				} else if (node.specifiers.length > 0 && !node.source) {
					for (const spec of node.specifiers) {
						if (spec.type !== 'ExportSpecifier') continue;
						const kind = localKinds.get(spec.local.name);
						if (kind) {
							exportKinds.set(spec.exported.name, kind);
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

				const { exports } = chunk;
				if (exports.length === 0) return null;

				/** @type {Array<{ name: string, kind: 'function' | 'const' | 'let' | 'var' }>} */
				const known = [];
				/** @type {string[]} */
				const skipped = [];

				for (const name of exports) {
					const kind = exportKinds.get(name);
					if (!kind) {
						skipped.push(name);
						continue;
					}
					known.push({ name, kind });
				}

				const wrappers = known
					.map(({ name, kind }) => {
						if (kind === 'function') {
							return `function ${name}(...args){return ${varName}.${name}(...args)}`;
						}
						return `${kind} ${name} = ${varName}.${name}`;
					})
					.join('\n');

				if (known.length > 0) {
					const label = known.length === 1 ? 'export' : 'exports';
					const list = known.map(({ name, kind }) => `  - ${name} (${kind})`).join('\n');
					console.log(`[vite-plugin-gas-hoist] Hoisted ${known.length} ${label} to global scope:\n${list}`);
				}

				if (skipped.length > 0) {
					const label = skipped.length === 1 ? 'export' : 'exports';
					const list = skipped.map((name) => `  - ${name}`).join('\n');
					console.log(`[vite-plugin-gas-hoist] Skipped ${skipped.length} ${label} (unsupported pattern):\n${list}`);
				}

				if (known.length === 0) return null;
				return `${code}\n${wrappers}\n`;
			},
		},
	};
};
