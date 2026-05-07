import * as acorn from 'acorn';
import { describe, expect, it, vi } from 'vitest';
import { vitePluginGasHoist } from '../src/index.js';

const parseAst = (code) => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });

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

	it('handles missing build.lib gracefully', () => {
		const plugin = vitePluginGasHoist();
		expect(() => plugin.configResolved({ build: {} })).not.toThrow();
	});

	describe('renderChunk', () => {
		it('appends global wrappers for IIFE entry exports', () => {
			const { transform, render } = createReadyPlugin();
			transform('export function sayHello() {}');
			const code = 'var lib_=(function(){})({});';
			const result = render(code, makeChunk());

			expect(result).toContain(code);
			expect(result).toContain('function sayHello(...args){return lib_.sayHello(...args)}');
		});

		it('handles multiple exports', () => {
			const { transform, render } = createReadyPlugin();
			transform('export function sayHello() {} export function greet() {} export function add() {}');
			const code = 'var lib_=(function(){})({});';
			const result = render(code, makeChunk({ exports: ['sayHello', 'greet', 'add'] }));

			expect(result).toContain('function sayHello(...args){return lib_.sayHello(...args)}');
			expect(result).toContain('function greet(...args){return lib_.greet(...args)}');
			expect(result).toContain('function add(...args){return lib_.add(...args)}');
		});

		it('uses the configured variable name', () => {
			const { transform, render } = createReadyPlugin('myApp_');
			transform('export function sayHello() {}');
			const code = 'var myApp_=(function(){})({});';
			const result = render(code, makeChunk());

			expect(result).toContain('function sayHello(...args){return myApp_.sayHello(...args)}');
		});

		it('returns null for non-IIFE format', () => {
			const { render } = createReadyPlugin();
			expect(render('', makeChunk(), esOptions)).toBeNull();
		});

		it('returns null for non-entry chunks', () => {
			const { render } = createReadyPlugin();
			expect(render('', makeChunk({ isEntry: false }))).toBeNull();
		});

		it('returns null when there are no exports', () => {
			const { render } = createReadyPlugin();
			expect(render('', makeChunk({ exports: [] }))).toBeNull();
		});

		it('logs hoisted function names (single)', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { transform, render } = createReadyPlugin();
			transform('export function sayHello() {}');
			render('', makeChunk({ exports: ['sayHello'] }));

			expect(spy).toHaveBeenCalledWith(
				'[vite-plugin-gas-hoist] Hoisted 1 export to global scope:\n  - sayHello (function)',
			);
			spy.mockRestore();
		});

		it('logs hoisted function names (multiple)', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { transform, render } = createReadyPlugin();
			transform('export function sayHello() {} export function greet() {}');
			render('', makeChunk({ exports: ['sayHello', 'greet'] }));

			expect(spy).toHaveBeenCalledWith(
				'[vite-plugin-gas-hoist] Hoisted 2 exports to global scope:\n  - sayHello (function)\n  - greet (function)',
			);
			spy.mockRestore();
		});

		it('skips export default and warns', () => {
			const { transform, render, ctx } = createReadyPlugin();
			transform('export default function main() {}');
			const result = render('var lib_=(function(){})({});', makeChunk({ exports: ['default'] }));

			expect(result).toBeNull();
			expect(ctx.warn).toHaveBeenCalledWith(expect.stringContaining('Skipped 1 export'));
		});

		it('logs hoisted exports with their kind', () => {
			const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const { transform, render } = createReadyPlugin();
			transform('export function foo() {} export const BAR = 1;');
			render('', makeChunk({ exports: ['foo', 'BAR'] }));

			expect(spy).toHaveBeenCalledWith(expect.stringContaining('- foo (function)'));
			expect(spy).toHaveBeenCalledWith(expect.stringContaining('- BAR (const)'));
			spy.mockRestore();
		});
	});

	describe('transform', () => {
		it('records export const as const', () => {
			const { transform, render } = createReadyPlugin();
			transform('export const FOO = 42;');
			const result = render('', makeChunk({ exports: ['FOO'] }));

			expect(result).toContain('const FOO = lib_.FOO');
			expect(result).not.toContain('function FOO');
		});

		it('records export let as let', () => {
			const { transform, render } = createReadyPlugin();
			transform('export let counter = 0;');
			const result = render('', makeChunk({ exports: ['counter'] }));

			expect(result).toContain('let counter = lib_.counter');
			expect(result).not.toContain('function counter');
		});

		it('records export var as var', () => {
			const { transform, render } = createReadyPlugin();
			transform('export var legacy = "x";');
			const result = render('', makeChunk({ exports: ['legacy'] }));

			expect(result).toContain('var legacy = lib_.legacy');
			expect(result).not.toContain('function legacy');
		});

		it('records export function as function', () => {
			const { transform, render } = createReadyPlugin();
			transform('export function greet(name) { return name; }');
			const result = render('', makeChunk({ exports: ['greet'] }));

			expect(result).toContain('function greet(...args){return lib_.greet(...args)}');
		});

		it('records export { foo } using local declaration kind', () => {
			const { transform, render } = createReadyPlugin();
			transform('const helper = () => 1; export { helper };');
			const result = render('', makeChunk({ exports: ['helper'] }));

			expect(result).toContain('const helper = lib_.helper');
			expect(result).not.toContain('function helper');
		});

		it('records export { foo as bar } under the renamed name', () => {
			const { transform, render } = createReadyPlugin();
			transform('const foo = 1; export { foo as bar };');
			const result = render('', makeChunk({ exports: ['bar'] }));

			expect(result).toContain('const bar = lib_.bar');
			expect(result).not.toContain('function bar');
		});

		it('handles multiple declarators in one export const', () => {
			const { transform, render } = createReadyPlugin();
			transform('export const a = 1, b = 2;');
			const result = render('', makeChunk({ exports: ['a', 'b'] }));

			expect(result).toContain('const a = lib_.a');
			expect(result).toContain('const b = lib_.b');
			expect(result).not.toContain('function a');
			expect(result).not.toContain('function b');
		});

		it('treats re-export from another module as unsupported', () => {
			const { transform, render, ctx } = createReadyPlugin();
			transform('export { something } from "./other.js";');
			const result = render('', makeChunk({ exports: ['something'] }));

			expect(result).toBeNull();
			expect(ctx.warn).toHaveBeenCalledWith(expect.stringContaining('Skipped 1 export'));
		});

		it('does not throw on unparsable input', () => {
			const { transform } = createReadyPlugin();
			expect(() => transform('this is not (valid) javascript ===')).not.toThrow();
		});

		it('clears recorded kinds on buildStart so watch rebuilds are clean', () => {
			const { plugin, transform, render } = createReadyPlugin();
			transform('export const STALE = 1;');
			plugin.buildStart.call({});
			const result = render('', makeChunk({ exports: ['STALE'] }));

			expect(result).toBeNull();
		});
	});
});
