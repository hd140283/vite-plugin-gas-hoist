import { API_PREFIX } from './api-prefix.js';
import { currentLang } from './current-lang.js';

/**
 * Formats a greeting in the requested language and prepends API_PREFIX.
 *
 * Declared as a function expression (`export const ... = (args) => ...`)
 * so vite-plugin-gas-hoist hoists it as a `const` binding, not a `function`
 * one. The runtime behaviour is the same — it remains callable from inside
 * the library — but library callers see a `const` at GAS global scope,
 * which GAS treats as private.
 *
 * @param {string} name
 * @param {string} [lang]
 * @returns {string}
 */
export const formatGreeting = (name, lang = currentLang) => {
	const greeting = lang === 'ja' ? `こんにちは、${name}さん!` : `Hello, ${name}!`;
	return `${API_PREFIX}${greeting}`;
};
