/**
 * Returns a greeting message.
 * This is an internal helper — not exported from the entry point,
 * so it will NOT be hoisted to the global scope.
 *
 * @param {string} name
 * @returns {string}
 */
export const greet = (name) => `Hello, ${name}!`;
