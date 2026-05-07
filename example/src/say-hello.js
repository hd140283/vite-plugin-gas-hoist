import { greet } from './greet.js';

/**
 * Greets someone by name.
 * Exported from the entry point, so it WILL be hoisted to the global scope.
 *
 * Declared as `function` (not `const`) so the plugin emits a `function`
 * wrapper, which stays public to GAS library callers. `export const` would
 * be hoisted as `const`, which GAS treats as private.
 *
 * @param {string} name
 * @returns {string}
 */
export function sayHello(name) {
	return greet(name);
}
