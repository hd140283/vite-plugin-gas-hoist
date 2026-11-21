import { describe, expect, it } from 'vitest';
import { classifyVariable } from '../lib/classify-variable.js';

describe('classifyVariable', () => {
	it('classifies an arrow function', () => {
		expect(classifyVariable('const', { type: 'ArrowFunctionExpression' })).toEqual({
			kind: 'const',
			isFn: true,
			isArrow: true,
		});
	});

	it('classifies a function expression', () => {
		expect(classifyVariable('var', { type: 'FunctionExpression' })).toEqual({
			kind: 'var',
			isFn: true,
			isArrow: false,
		});
	});

	it('classifies a non-function value', () => {
		expect(classifyVariable('const', { type: 'Literal' })).toEqual({
			kind: 'const',
			isFn: false,
			isArrow: false,
		});
	});

	it('classifies a declarator without an initializer', () => {
		expect(classifyVariable('let', null)).toEqual({
			kind: 'let',
			isFn: false,
			isArrow: false,
		});
	});
});
