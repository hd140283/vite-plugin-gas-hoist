import { sayHello } from './say-hello.js';

/**
 * Greets multiple people, returning a single newline-joined string.
 *
 * @param {string[]} names
 * @returns {string}
 */
export function greetAll(names) {
	return names.map((name) => sayHello(name)).join('\n');
}
