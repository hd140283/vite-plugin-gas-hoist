import { greet } from './greet.js';

/**
 * Greets someone by name.
 * Exported from the entry point, so it WILL be hoisted to the global scope.
 *
 * @param {string} name
 * @returns {string}
 */
export const sayHello = (name) => greet(name);
