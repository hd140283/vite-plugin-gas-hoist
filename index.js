import { collectModuleExports } from './lib/collect-module-exports.js';
import { hoistExports } from './lib/hoist-exports.js';

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
	/** @type {Map<string, ModuleRecord>} */
	const modules = new Map();

	return {
		name: 'vite-plugin-gas-hoist',
		apply: 'build',

		buildStart() {
			modules.clear();
		},

		/** @param {import('rollup').ModuleInfo} moduleInfo */
		async moduleParsed({ id, code }) {
			const moduleExports = collectModuleExports(this.parse(code));
			const resolutions = await Promise.all(moduleExports.sources.map((source) => this.resolve(source, id)));
			modules.set(id, { ...moduleExports, resolutions });
		},

		renderChunk: {
			order: 'post',
			/**
			 * @param {string} code
			 * @param {import('rollup').RenderedChunk} chunk
			 * @param {import('rollup').NormalizedOutputOptions} options
			 */
			handler(code, chunk, options) {
				const { output, logs } = hoistExports(code, chunk, options, modules);
				for (const { level, message } of logs) {
					this[level](message);
				}
				return output;
			},
		},
	};
};
