import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';
import { collectModuleExports } from '../lib/collect-module-exports.js';

const fn = { kind: 'function', isFn: true, isArrow: false };

/** @param {string} code */
const collect = (code) => collectModuleExports(acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }));

/** @param {string} code */
const bindings = (code) => Object.fromEntries(collect(code).bindings);

describe('collectModuleExports', () => {
	describe('declarations', () => {
		it.each(['const', 'let', 'var'])('records export %s as a value', (kind) => {
			expect(bindings(`export ${kind} FOO = 42;`)).toEqual({ FOO: { kind, isFn: false, isArrow: false } });
		});

		it('records export function as function', () => {
			expect(bindings('export function greet(name) { return name; }')).toEqual({ greet: fn });
		});

		it.each(['const', 'let', 'var'])('records an exported %s arrow function', (kind) => {
			expect(bindings(`export ${kind} sayHi = (name) => name;`)).toEqual({
				sayHi: { kind, isFn: true, isArrow: true },
			});
		});

		it.each(['const', 'let', 'var'])('records an exported %s function expression', (kind) => {
			expect(bindings(`export ${kind} sayHi = function(name) { return name; };`)).toEqual({
				sayHi: { kind, isFn: true, isArrow: false },
			});
		});

		it('records multiple declarators in one export const', () => {
			expect(bindings('export const a = 1, b = 2;')).toEqual({
				a: { kind: 'const', isFn: false, isArrow: false },
				b: { kind: 'const', isFn: false, isArrow: false },
			});
		});

		it('does not record export default', () => {
			expect(bindings('export default function main() {}')).toEqual({});
		});

		it('does not record export class', () => {
			expect(bindings('export class Foo {}')).toEqual({});
		});
	});

	describe('local specifiers', () => {
		it('records export { foo } using the local declaration kind', () => {
			expect(bindings('const helper = 42; export { helper };')).toEqual({
				helper: { kind: 'const', isFn: false, isArrow: false },
			});
		});

		it('records export { foo } of a local function declaration', () => {
			expect(bindings('function helper() {} export { helper };')).toEqual({ helper: fn });
		});

		it('preserves arrow-vs-function shape across specifier exports', () => {
			expect(
				bindings('const helperA = () => 1; const helperB = function() { return 2; }; export { helperA, helperB };'),
			).toEqual({
				helperA: { kind: 'const', isFn: true, isArrow: true },
				helperB: { kind: 'const', isFn: true, isArrow: false },
			});
		});

		it('records export { foo as bar } under the renamed name', () => {
			expect(bindings('const foo = 1; export { foo as bar };')).toEqual({
				bar: { kind: 'const', isFn: false, isArrow: false },
			});
		});

		it('does not record a specifier without a known local binding', () => {
			expect(bindings('import helper from "./m.js"; import * as ns from "./n.js"; export { helper, ns };')).toEqual({});
		});
	});

	describe('re-exports', () => {
		it('links a specifier export of an imported name to its source', () => {
			expect(bindings('import { helper } from "./m.js"; export { helper };')).toEqual({
				helper: { source: './m.js', name: 'helper' },
			});
		});

		it('links a renamed import under the exported name', () => {
			expect(bindings('import { helper as h } from "./m.js"; export { h as run };')).toEqual({
				run: { source: './m.js', name: 'helper' },
			});
		});

		it('links a from-clause re-export to its source', () => {
			expect(bindings('export { HELPER } from "./m.js";')).toEqual({
				HELPER: { source: './m.js', name: 'HELPER' },
			});
		});

		it('links a renamed from-clause re-export under the exported name', () => {
			expect(bindings('export { a as b } from "./m.js";')).toEqual({
				b: { source: './m.js', name: 'a' },
			});
		});

		it('records export * sources', () => {
			expect(collect('export * from "./a.js"; export * from "./b.js";').stars).toEqual(['./a.js', './b.js']);
		});

		it('does not record export * as a namespace', () => {
			const result = collect('export * as ns from "./a.js";');

			expect(result.stars).toEqual([]);
			expect(Object.fromEntries(result.bindings)).toEqual({});
		});
	});

	describe('sources', () => {
		it('lists each re-export source once', () => {
			const result = collect(
				'import { a } from "./m.js"; export { a }; export { b } from "./m.js"; export * from "./n.js";',
			);

			expect(result.sources).toEqual(['./m.js', './n.js']);
		});

		it('omits sources that are imported but not re-exported', () => {
			expect(collect('import { a } from "./m.js"; export const b = a;').sources).toEqual([]);
		});

		it('is empty for a module without exports', () => {
			expect(collect('const a = 1;')).toEqual({ bindings: new Map(), stars: [], sources: [] });
		});
	});
});
