import { emitWrapper } from './emit-wrapper.js';

/** @typedef {{ level: 'info' | 'warn', message: string }} HoistLog */

/**
 * Appends kind-appropriate global hoist bindings for each entry export,
 * skipping unsupported patterns (e.g. `export default`, `export class`,
 * re-exports) whose declaration kind was not recorded.
 *
 * @param {string} code
 * @param {import('rollup').RenderedChunk} chunk
 * @param {import('rollup').NormalizedOutputOptions} options
 * @param {Map<string, ExportInfo>} exportKinds
 * @returns {{ output: string | null, logs: HoistLog[] }}
 */
export const hoistExports = (code, chunk, options, exportKinds) => {
	if (options.format !== 'iife' || !chunk.isEntry) return { output: null, logs: [] };

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

	/** @type {HoistLog[]} */
	const logs = [];

	if (known.length > 0) {
		const label = known.length === 1 ? 'export' : 'exports';
		const list = known.map(({ name, info }) => `  - ${name} (${info.kind})`).join('\n');
		logs.push({ level: 'info', message: `Hoisted ${known.length} ${label} to global scope:\n${list}` });
	}

	if (skipped.length > 0) {
		const label = skipped.length === 1 ? 'export' : 'exports';
		const list = skipped.map((name) => `  - ${name}`).join('\n');
		logs.push({ level: 'warn', message: `Skipped ${skipped.length} ${label} (unsupported pattern):\n${list}` });
	}

	if (known.length === 0) return { output: null, logs };

	const wrappers = known.map(({ name, info }) => emitWrapper(name, info, options.name)).join('\n');

	return { output: `${code}\n${wrappers}\n`, logs };
};
