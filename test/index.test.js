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
			const plugin = createPlugin();
			const code = 'var lib_=(function(){})({});';
			const result = plugin.renderChunk.handler(code, makeChunk(), iifeOptions);

			expect(result).toContain(code);
			expect(result).toContain('function sayHello(...args){return lib_.sayHello(...args)}');
		});

		it('handles multiple exports', () => {
			const plugin = createPlugin();
			const code = 'var lib_=(function(){})({});';
			const chunk = makeChunk({ exports: ['sayHello', 'greet', 'add'] });
			const result = plugin.renderChunk.handler(code, chunk, iifeOptions);

			expect(result).toContain('function sayHello(...args){return lib_.sayHello(...args)}');
			expect(result).toContain('function greet(...args){return lib_.greet(...args)}');
			expect(result).toContain('function add(...args){return lib_.add(...args)}');
		});

		it('uses the configured variable name', () => {
			const plugin = createPlugin('myApp_');
			const code = 'var myApp_=(function(){})({});';
			const result = plugin.renderChunk.handler(code, makeChunk(), iifeOptions);

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
			const plugin = createPlugin();
			plugin.renderChunk.handler('', makeChunk(), iifeOptions);

			expect(spy).toHaveBeenCalledWith('[vite-plugin-gas-hoist] Hoisted 1 function to global scope:\n  - sayHello');
			spy.mockRestore();
		});

		it('logs hoisted function names (multiple)', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const plugin = createPlugin();
			const chunk = makeChunk({ exports: ['sayHello', 'greet'] });
			plugin.renderChunk.handler('', chunk, iifeOptions);

			expect(spy).toHaveBeenCalledWith(
				'[vite-plugin-gas-hoist] Hoisted 2 functions to global scope:\n  - sayHello\n  - greet',
			);
			spy.mockRestore();
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
	});
});
