import { describe, expect, it } from 'vitest';
import { hoistExports } from '../lib/hoist-exports.js';

const fn = { kind: 'function', isFn: true, isArrow: false };
const value = { kind: 'const', isFn: false, isArrow: false };

/** @param {Partial<import('rollup').RenderedChunk>} overrides */
const makeChunk = (overrides = {}) => ({
	isEntry: true,
	facadeModuleId: '/entry.js',
	exports: ['sayHello'],
	...overrides,
});

const iifeOptions = /** @type {import('rollup').NormalizedOutputOptions} */ ({
	format: 'iife',
	name: 'lib_',
});

const code = 'var lib_=(function(){})({});';

/** @param {Record<string, object>} bindings */
const entryModule = (bindings = {}) =>
	new Map([['/entry.js', { bindings: new Map(Object.entries(bindings)), stars: [], sources: [], resolutions: [] }]]);

describe('hoistExports', () => {
	it('appends global wrappers after the chunk code', () => {
		const { output } = hoistExports(code, makeChunk(), iifeOptions, entryModule({ sayHello: fn }));

		expect(output).toBe(`${code}\nfunction sayHello(...args){return lib_.sayHello(...args)}\n`);
	});

	it('appends one wrapper per export in chunk order', () => {
		const modules = entryModule({ FOO: value, sayHello: fn });
		const { output } = hoistExports(code, makeChunk({ exports: ['sayHello', 'FOO'] }), iifeOptions, modules);

		expect(output).toBe(`${code}\nfunction sayHello(...args){return lib_.sayHello(...args)}\nconst FOO = lib_.FOO\n`);
	});

	it('uses the output name as the variable name', () => {
		const options = { ...iifeOptions, name: 'myApp_' };
		const { output } = hoistExports(code, makeChunk(), options, entryModule({ sayHello: fn }));

		expect(output).toContain('function sayHello(...args){return myApp_.sayHello(...args)}');
	});

	it('does nothing for a non-IIFE format', () => {
		const options = { ...iifeOptions, format: 'es' };

		expect(hoistExports(code, makeChunk(), options, entryModule({ sayHello: fn }))).toEqual({
			output: null,
			logs: [],
		});
	});

	it('does nothing for a non-entry chunk', () => {
		const chunk = makeChunk({ isEntry: false });

		expect(hoistExports(code, chunk, iifeOptions, entryModule({ sayHello: fn }))).toEqual({
			output: null,
			logs: [],
		});
	});

	it('does nothing when the chunk has no exports', () => {
		expect(hoistExports(code, makeChunk({ exports: [] }), iifeOptions, entryModule())).toEqual({
			output: null,
			logs: [],
		});
	});

	it('logs a single hoisted export with its kind', () => {
		const { logs } = hoistExports(code, makeChunk(), iifeOptions, entryModule({ sayHello: fn }));

		expect(logs).toEqual([{ level: 'info', message: 'Hoisted 1 export to global scope:\n  - sayHello (function)' }]);
	});

	it('logs multiple hoisted exports with their kinds', () => {
		const modules = entryModule({ sayHello: fn, FOO: value });
		const { logs } = hoistExports(code, makeChunk({ exports: ['sayHello', 'FOO'] }), iifeOptions, modules);

		expect(logs).toEqual([
			{ level: 'info', message: 'Hoisted 2 exports to global scope:\n  - sayHello (function)\n  - FOO (const)' },
		]);
	});

	it('skips an export whose kind was not recorded and warns', () => {
		const result = hoistExports(code, makeChunk({ exports: ['default'] }), iifeOptions, entryModule());

		expect(result).toEqual({
			output: null,
			logs: [{ level: 'warn', message: 'Skipped 1 export (unsupported pattern):\n  - default' }],
		});
	});

	it('warns about multiple skipped exports', () => {
		const { logs } = hoistExports(code, makeChunk({ exports: ['default', 'Foo'] }), iifeOptions, entryModule());

		expect(logs).toEqual([
			{ level: 'warn', message: 'Skipped 2 exports (unsupported pattern):\n  - default\n  - Foo' },
		]);
	});

	it('hoists recorded exports and warns about the rest', () => {
		const chunk = makeChunk({ exports: ['sayHello', 'default'] });
		const { output, logs } = hoistExports(code, chunk, iifeOptions, entryModule({ sayHello: fn }));

		expect(output).toBe(`${code}\nfunction sayHello(...args){return lib_.sayHello(...args)}\n`);
		expect(logs).toEqual([
			{ level: 'info', message: 'Hoisted 1 export to global scope:\n  - sayHello (function)' },
			{ level: 'warn', message: 'Skipped 1 export (unsupported pattern):\n  - default' },
		]);
	});
});
