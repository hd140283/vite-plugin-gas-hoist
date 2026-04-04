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

	return {
		name: 'vite-plugin-gas-hoist',

		/** @param {import('vite').ResolvedConfig} config */
		configResolved(config) {
			varName = config.build.lib.name;
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
					.map((name) => `function ${name}(...args){return ${varName}.${name}(...args)}`)
					.join('\n');

				console.log(`vite-plugin-gas-hoist: hoisted ${exports.length} function(s)`);
				return `${code}\n${wrappers}\n`;
			},
		},
	};
};
