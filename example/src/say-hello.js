import { formatGreeting } from './format-greeting.js';

/**
 * Greets a single person.
 *
 * Declared with `export function` so the plugin emits a top-level
 * `function` declaration at GAS global scope, which keeps it public to
 * library callers.
 *
 * @param {string} name
 * @returns {string}
 */
export function sayHello(name) {
	return formatGreeting(name);
}
