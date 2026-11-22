import { describe, expect, it } from 'vitest';
import { resolveExportKind } from '../lib/resolve-export-kind.js';

const fn = { kind: 'function', isFn: true, isArrow: false };
const value = { kind: 'const', isFn: false, isArrow: false };

/**
 * Builds a module record whose sources resolve to the given module ids.
 *
 * @param {Record<string, object>} bindings
 * @param {{ stars?: string[], resolved?: Record<string, string | null> }} [options]
 */
const record = (bindings, { stars = [], resolved = {} } = {}) => ({
	bindings: new Map(Object.entries(bindings)),
	stars,
	sources: Object.keys(resolved),
	resolutions: Object.values(resolved).map((id) => (id ? { id } : null)),
});

describe('resolveExportKind', () => {
	it('resolves an export declared in the module', () => {
		const modules = new Map([['/entry.js', record({ doGet: fn })]]);

		expect(resolveExportKind(modules, '/entry.js', 'doGet')).toEqual(fn);
	});

	it('ignores a same-named export of a module that is not re-exported', () => {
		const modules = new Map([
			['/entry.js', record({ doGet: fn })],
			['/other.js', record({ doGet: value })],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'doGet')).toEqual(fn);
	});

	it('follows a re-export to the declaring module', () => {
		const modules = new Map([
			['/entry.js', record({ helper: { source: './m.js', name: 'helper' } }, { resolved: { './m.js': '/m.js' } })],
			['/m.js', record({ helper: fn })],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'helper')).toEqual(fn);
	});

	it('follows a renamed re-export by its original name', () => {
		const modules = new Map([
			['/entry.js', record({ run: { source: './m.js', name: 'helper' } }, { resolved: { './m.js': '/m.js' } })],
			['/m.js', record({ helper: fn, run: value })],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'run')).toEqual(fn);
	});

	it('follows a chain of re-exports', () => {
		const modules = new Map([
			['/entry.js', record({ a: { source: './b.js', name: 'b' } }, { resolved: { './b.js': '/b.js' } })],
			['/b.js', record({ b: { source: './c.js', name: 'c' } }, { resolved: { './c.js': '/c.js' } })],
			['/c.js', record({ c: value })],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'a')).toEqual(value);
	});

	it('resolves a name through export *', () => {
		const modules = new Map([
			['/entry.js', record({}, { stars: ['./a.js', './b.js'], resolved: { './a.js': '/a.js', './b.js': '/b.js' } })],
			['/a.js', record({ other: value })],
			['/b.js', record({ starred: fn })],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'starred')).toEqual(fn);
	});

	it('prefers a named export over export *', () => {
		const modules = new Map([
			['/entry.js', record({ doGet: fn }, { stars: ['./a.js'], resolved: { './a.js': '/a.js' } })],
			['/a.js', record({ doGet: value })],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'doGet')).toEqual(fn);
	});

	it('does not resolve default through export *', () => {
		const modules = new Map([
			['/entry.js', record({}, { stars: ['./a.js'], resolved: { './a.js': '/a.js' } })],
			['/a.js', record({ default: fn })],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'default')).toBeUndefined();
	});

	it('returns undefined for an export the module does not have', () => {
		const modules = new Map([['/entry.js', record({ doGet: fn })]]);

		expect(resolveExportKind(modules, '/entry.js', 'missing')).toBeUndefined();
	});

	it('returns undefined for an unknown module', () => {
		expect(resolveExportKind(new Map(), '/entry.js', 'doGet')).toBeUndefined();
		expect(resolveExportKind(new Map(), null, 'doGet')).toBeUndefined();
	});

	it('returns undefined when the re-export source is unresolved', () => {
		const modules = new Map([
			[
				'/entry.js',
				record({ helper: { source: 'missing-pkg', name: 'helper' } }, { resolved: { 'missing-pkg': null } }),
			],
		]);

		expect(resolveExportKind(modules, '/entry.js', 'helper')).toBeUndefined();
	});

	it('returns undefined for circular re-exports', () => {
		const modules = new Map([
			['/a.js', record({ x: { source: './b.js', name: 'x' } }, { stars: ['./b.js'], resolved: { './b.js': '/b.js' } })],
			['/b.js', record({ x: { source: './a.js', name: 'x' } }, { stars: ['./a.js'], resolved: { './a.js': '/a.js' } })],
		]);

		expect(resolveExportKind(modules, '/a.js', 'x')).toBeUndefined();
		expect(resolveExportKind(modules, '/a.js', 'y')).toBeUndefined();
	});
});
