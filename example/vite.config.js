/**
 * Example Vite config for a Google Apps Script project.
 *
 * Bundles server code as IIFE, hoisting exports to the global scope
 * so they can be called directly from GAS.
 *
 * Environment:
 *   VITE_SCRIPT_ID — Google Apps Script project ID (set in .env.local)
 */

import { writeFile } from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { vitePluginGasHoist } from '../src/index.js';

export default defineConfig(async ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), 'VITE_');
	const minify = mode === 'production';

	// Generate .clasp.json dynamically from environment variables
	await writeFile('.clasp.json', JSON.stringify({ scriptId: env.VITE_SCRIPT_ID, rootDir: 'dist' }));

	return {
		plugins: [
			vitePluginGasHoist(),
			viteStaticCopy({
				targets: [{ src: 'src/appsscript.json', dest: '' }],
			}),
		],
		build: {
			lib: {
				entry: 'src/app.js',
				formats: ['iife'],
				name: 'lib_',
				fileName: (_, entryName) => `${entryName}.js`,
			},
			minify,
		},
	};
});
