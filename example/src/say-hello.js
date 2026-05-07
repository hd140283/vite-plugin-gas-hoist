import { DEFAULT_LANG } from './default-lang.js';
import { formatGreeting } from './format-greeting.js';

/**
 * Greets a single person.
 *
 * Declared as `export function` so the plugin emits a `function` wrapper,
 * which keeps it public to GAS library callers.
 *
 * @param {string} name
 * @returns {string}
 */
export function sayHello(name) {
	return formatGreeting(name, DEFAULT_LANG);
}
