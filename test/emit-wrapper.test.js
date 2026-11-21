import { describe, expect, it } from 'vitest';
import { emitWrapper } from '../lib/emit-wrapper.js';

describe('emitWrapper', () => {
	it('wraps a function declaration as a function declaration', () => {
		const info = { kind: 'function', isFn: true, isArrow: false };

		expect(emitWrapper('greet', info, 'lib_')).toBe('function greet(...args){return lib_.greet(...args)}');
	});

	it.each(['const', 'let', 'var'])('wraps a %s arrow function as an arrow-style callable', (kind) => {
		const info = { kind, isFn: true, isArrow: true };

		expect(emitWrapper('sayHi', info, 'lib_')).toBe(`${kind} sayHi = (...args) => lib_.sayHi(...args)`);
	});

	it.each(['const', 'let', 'var'])('wraps a %s function expression as a function-style callable', (kind) => {
		const info = { kind, isFn: true, isArrow: false };

		expect(emitWrapper('sayHi', info, 'lib_')).toBe(`${kind} sayHi = function(...args){return lib_.sayHi(...args)}`);
	});

	it.each(['const', 'let', 'var'])('binds a %s value directly', (kind) => {
		const info = { kind, isFn: false, isArrow: false };

		expect(emitWrapper('FOO', info, 'lib_')).toBe(`${kind} FOO = lib_.FOO`);
	});

	it('uses the given variable name', () => {
		const info = { kind: 'function', isFn: true, isArrow: false };

		expect(emitWrapper('greet', info, 'myApp_')).toBe('function greet(...args){return myApp_.greet(...args)}');
	});
});
