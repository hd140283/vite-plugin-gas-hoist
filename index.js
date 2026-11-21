import { collectExportKinds } from './lib/collect-export-kinds.js';
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
	/** @type {Map<string, ExportInfo>} */
	const exportKinds = new Map();

	return {
		name: 'vite-plugin-gas-hoist',
		apply: 'build',

		buildStart() {
			exportKinds.clear();
		},

		/** @param {import('rollup').ModuleInfo} moduleInfo */
		moduleParsed({ code }) {
			for (const [name, info] of collectExportKinds(this.parse(code))) {
				exportKinds.set(name, info);
			}
		},

		renderChunk: {
			order: 'post',
			/**
			 * @param {string} code
			 * @param {import('rollup').RenderedChunk} chunk
			 * @param {import('rollup').NormalizedOutputOptions} options
			 */
			handler(code, chunk, options) {
				const { output, logs } = hoistExports(code, chunk, options, exportKinds);
				for (const { level, message } of logs) {
					this[level](message);
				}
				return output;
			},
		},
	};
};
