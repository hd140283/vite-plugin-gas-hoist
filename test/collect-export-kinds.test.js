import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';
import { collectExportKinds } from '../lib/collect-export-kinds.js';

const fn = { kind: 'function', isFn: true, isArrow: false };

/** @param {string} code */
const collect = (code) =>
	Object.fromEntries(collectExportKinds(acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })));

describe('collectExportKinds', () => {
	it.each(['const', 'let', 'var'])('records export %s as a value', (kind) => {
		expect(collect(`export ${kind} FOO = 42;`)).toEqual({ FOO: { kind, isFn: false, isArrow: false } });
	});

	it('records export function as function', () => {
		expect(collect('export function greet(name) { return name; }')).toEqual({ greet: fn });
	});

	it.each(['const', 'let', 'var'])('records an exported %s arrow function', (kind) => {
		expect(collect(`export ${kind} sayHi = (name) => name;`)).toEqual({
			sayHi: { kind, isFn: true, isArrow: true },
		});
	});

	it.each(['const', 'let', 'var'])('records an exported %s function expression', (kind) => {
		expect(collect(`export ${kind} sayHi = function(name) { return name; };`)).toEqual({
			sayHi: { kind, isFn: true, isArrow: false },
		});
	});

	it('records multiple declarators in one export const', () => {
		expect(collect('export const a = 1, b = 2;')).toEqual({
			a: { kind: 'const', isFn: false, isArrow: false },
			b: { kind: 'const', isFn: false, isArrow: false },
		});
	});

	it('records export { foo } using the local declaration kind', () => {
		expect(collect('const helper = 42; export { helper };')).toEqual({
			helper: { kind: 'const', isFn: false, isArrow: false },
		});
	});

	it('records export { foo } of a local function declaration', () => {
		expect(collect('function helper() {} export { helper };')).toEqual({ helper: fn });
	});

	it('preserves arrow-vs-function shape across specifier exports', () => {
		expect(
			collect('const helperA = () => 1; const helperB = function() { return 2; }; export { helperA, helperB };'),
		).toEqual({
			helperA: { kind: 'const', isFn: true, isArrow: true },
			helperB: { kind: 'const', isFn: true, isArrow: false },
		});
	});

	it('records export { foo as bar } under the renamed name', () => {
		expect(collect('const foo = 1; export { foo as bar };')).toEqual({
			bar: { kind: 'const', isFn: false, isArrow: false },
		});
	});

	it('does not record a specifier export of an imported name', () => {
		expect(collect('import { helper } from "./m.js"; export { helper };')).toEqual({});
	});

	it('does not record a from-clause re-export', () => {
		expect(collect('export { HELPER } from "./m.js";')).toEqual({});
	});

	it('does not record export default', () => {
		expect(collect('export default function main() {}')).toEqual({});
	});

	it('does not record export class', () => {
		expect(collect('export class Foo {}')).toEqual({});
	});

	it('returns an empty map for a module without exports', () => {
		expect(collect('const a = 1;')).toEqual({});
	});
});
