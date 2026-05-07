import * as acorn from 'acorn';
import { describe, expect, it, vi } from 'vitest';
import { vitePluginGasHoist } from '../src/index.js';

const parseAst = (code) => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });

/**
 * Creates a plugin instance with configResolved already called.
 * @param {string} [varName='lib_'] - IIFE variable name
 */
const createPlugin = (varName = 'lib_') => {
	const plugin = vitePluginGasHoist();
	plugin.configResolved({ build: { lib: { name: varName } } });
	return plugin;
};

/** @param {Partial<import('rollup').RenderedChunk>} overrides */
const makeChunk = (overrides = {}) => ({
	isEntry: true,
	exports: ['sayHello'],
	...overrides,
});

const iifeOptions = /** @type {import('rollup').NormalizedOutputOptions} */ ({
	format: 'iife',
});

const esOptions = /** @type {import('rollup').NormalizedOutputOptions} */ ({
	format: 'es',
});

/**
 * Creates a plugin instance, runs configResolved + buildStart, and
 * returns helpers that mirror Rollup's plugin context.
 */
const createReadyPlugin = (varName = 'lib_') => {
	const plugin = vitePluginGasHoist();
	plugin.configResolved({ build: { lib: { name: varName } } });
	plugin.buildStart.call({});

	const ctx = { parse: parseAst, warn: vi.fn() };
	const transform = (code, id = 'src/main.js') => plugin.transform.call(ctx, code, id);
	const render = (code, chunk, options = iifeOptions) => plugin.renderChunk.handler.call(ctx, code, chunk, options);

	return { plugin, ctx, transform, render };
};

describe('vitePluginGasHoist', () => {
	it('has the correct plugin name', () => {
		const plugin = vitePluginGasHoist();
		expect(plugin.name).toBe('vite-plugin-gas-hoist');
	});

	it('applies only to build', () => {
		const plugin = vitePluginGasHoist();
		expect(plugin.apply).toBe('build');
	});

	it('clears the kind map on buildStart between runs', () => {
		const { plugin } = createReadyPlugin();
		expect(() => plugin.buildStart.call({})).not.toThrow();
		expect(() => plugin.buildStart.call({})).not.toThrow();
	});

	it('handles missing build.lib gracefully', () => {
		const plugin = vitePluginGasHoist();
		expect(() => plugin.configResolved({ build: {} })).not.toThrow();
	});

	describe('renderChunk', () => {
		it('appends global wrappers for IIFE entry exports', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('export function sayHello() {}');
			const code = 'var lib_=(function(){})({});';
			const result = plugin.renderChunk.handler.call({ warn: vi.fn() }, code, makeChunk(), iifeOptions);

			expect(result).toContain(code);
			expect(result).toContain('function sayHello(...args){return lib_.sayHello(...args)}');
		});

		it('handles multiple exports', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('export function sayHello() {} export function greet() {} export function add() {}');
			const code = 'var lib_=(function(){})({});';
			const chunk = makeChunk({ exports: ['sayHello', 'greet', 'add'] });
			const result = plugin.renderChunk.handler.call({ warn: vi.fn() }, code, chunk, iifeOptions);

			expect(result).toContain('function sayHello(...args){return lib_.sayHello(...args)}');
			expect(result).toContain('function greet(...args){return lib_.greet(...args)}');
			expect(result).toContain('function add(...args){return lib_.add(...args)}');
		});

		it('uses the configured variable name', () => {
			const { plugin, transform } = createReadyPlugin('myApp_');
			transform('export function sayHello() {}');
			const code = 'var myApp_=(function(){})({});';
			const result = plugin.renderChunk.handler.call({ warn: vi.fn() }, code, makeChunk(), iifeOptions);

			expect(result).toContain('function sayHello(...args){return myApp_.sayHello(...args)}');
		});

		it('returns null for non-IIFE format', () => {
			const plugin = createPlugin();
			const result = plugin.renderChunk.handler('', makeChunk(), esOptions);

			expect(result).toBeNull();
		});

		it('returns null for non-entry chunks', () => {
			const plugin = createPlugin();
			const chunk = makeChunk({ isEntry: false });
			const result = plugin.renderChunk.handler('', chunk, iifeOptions);

			expect(result).toBeNull();
		});

		it('returns null when there are no exports', () => {
			const plugin = createPlugin();
			const chunk = makeChunk({ exports: [] });
			const result = plugin.renderChunk.handler('', chunk, iifeOptions);

			expect(result).toBeNull();
		});

		it('logs hoisted function names (single)', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { plugin, transform } = createReadyPlugin();
			transform('export function sayHello() {}');
			plugin.renderChunk.handler.call({ warn: vi.fn() }, '', makeChunk({ exports: ['sayHello'] }), iifeOptions);

			expect(spy).toHaveBeenCalledWith(
				'[vite-plugin-gas-hoist] Hoisted 1 export to global scope:\n  - sayHello (function)',
			);
			spy.mockRestore();
		});

		it('logs hoisted function names (multiple)', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { plugin, transform } = createReadyPlugin();
			transform('export function sayHello() {} export function greet() {}');
			plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['sayHello', 'greet'] }),
				iifeOptions,
			);

			expect(spy).toHaveBeenCalledWith(
				'[vite-plugin-gas-hoist] Hoisted 2 exports to global scope:\n  - sayHello (function)\n  - greet (function)',
			);
			spy.mockRestore();
		});

		it('skips export default and warns', () => {
			const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { plugin, transform } = createReadyPlugin();
			transform('export default function main() {}');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'var lib_=(function(){})({});',
				makeChunk({ exports: ['default'] }),
				iifeOptions,
			);
			expect(result ?? '').not.toContain('function default');
			expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('Skipped 1 export'));
			spyLog.mockRestore();
		});

		it('logs hoisted exports with their kind', () => {
			const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { plugin, transform } = createReadyPlugin();
			transform('export function foo() {} export const BAR = 1;');
			plugin.renderChunk.handler.call({ warn: vi.fn() }, '', makeChunk({ exports: ['foo', 'BAR'] }), iifeOptions);
			expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('- foo (function)'));
			expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('- BAR (const)'));
			spyLog.mockRestore();
		});
	});

	describe('transform', () => {
		it('records export const as const', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('export const FOO = 42;');
			const chunk = makeChunk({ exports: ['FOO'] });
			const result = plugin.renderChunk.handler.call({ warn: vi.fn() }, '', chunk, iifeOptions);
			expect(result).toContain('const FOO = lib_.FOO');
		});

		it('records export let as let', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('export let counter = 0;');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['counter'] }),
				iifeOptions,
			);
			expect(result).toContain('let counter = lib_.counter');
		});

		it('records export var as var', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('export var legacy = "x";');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['legacy'] }),
				iifeOptions,
			);
			expect(result).toContain('var legacy = lib_.legacy');
		});

		it('records export function as function', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('export function greet(name) { return name; }');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['greet'] }),
				iifeOptions,
			);
			expect(result).toContain('function greet(...args){return lib_.greet(...args)}');
		});

		it('records export { foo } using local declaration kind', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('const helper = () => 1; export { helper };');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['helper'] }),
				iifeOptions,
			);
			expect(result).toContain('const helper = lib_.helper');
		});

		it('records export { foo as bar } under the renamed name', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('const foo = 1; export { foo as bar };');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['bar'] }),
				iifeOptions,
			);
			expect(result).toContain('const bar = lib_.bar');
		});

		it('handles multiple declarators in one export const', () => {
			const { plugin, transform } = createReadyPlugin();
			transform('export const a = 1, b = 2;');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['a', 'b'] }),
				iifeOptions,
			);
			expect(result).toContain('const a = lib_.a');
			expect(result).toContain('const b = lib_.b');
		});

		it('treats re-export from another module as unsupported', () => {
			const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { plugin, transform } = createReadyPlugin();
			transform('export { something } from "./other.js";');
			const result = plugin.renderChunk.handler.call(
				{ warn: vi.fn() },
				'',
				makeChunk({ exports: ['something'] }),
				iifeOptions,
			);
			expect(result).toBeNull();
			expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('Skipped 1 export'));
			spyLog.mockRestore();
		});
	});
});
