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
			 * Appends global wrapper functions for each export.
			 *
			 * Given `export { sayHello }` with `lib.name = 'lib_'`, produces:
			 * ```js
			 * function sayHello(...args){return lib_.sayHello(...args)}
			 * ```
			 *
			 * @param {string} code
			 * @param {import('rollup').RenderedChunk} chunk
			 * @param {import('rollup').NormalizedOutputOptions} options
			 */
			handler(code, chunk, options) {
				if (options.format !== 'iife' || !chunk.isEntry) return null;

				const { exports } = chunk;
				if (exports.length === 0) return null;

				const wrappers = exports
					.map((name) => {
						const kind = exportKinds.get(name);
						if (kind === 'const' || kind === 'let' || kind === 'var') {
							return `${kind} ${name} = ${varName}.${name}`;
						}
						return `function ${name}(...args){return ${varName}.${name}(...args)}`;
					})
					.join('\n');

				const label = exports.length === 1 ? 'function' : 'functions';
				const list = exports.map((name) => `  - ${name}`).join('\n');
				console.log(`[vite-plugin-gas-hoist] Hoisted ${exports.length} ${label} to global scope:\n${list}`);

				return `${code}\n${wrappers}\n`;
			},
		},
	};
};
