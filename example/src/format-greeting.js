/**
 * Formats a greeting in the requested language.
 *
 * Declared as a function expression (`export const ... = (args) => ...`)
 * so vite-plugin-gas-hoist hoists it as a `const` binding, not a `function`
 * one. The runtime behaviour is the same — it's still callable from inside
 * the library — but consumers see it as a `const` at GAS global scope,
 * which GAS treats as private to the library.
 *
 * @param {string} name
 * @param {string} lang
 * @returns {string}
 */
export const formatGreeting = (name, lang) => (lang === 'ja' ? `こんにちは、${name}さん!` : `Hello, ${name}!`);
