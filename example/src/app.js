/*
 * Entry point. Re-exports the library's public surface so vite-plugin-gas-hoist
 * hoists each binding with the kind matching the source declaration:
 *
 *   - `function` declarations  -> hoisted as `function` (public to GAS callers)
 *   - `const` bindings (value or function expression) -> hoisted as `const` (private to callers)
 *   - `let`   bindings         -> hoisted as `let`     (private, mutable)
 *   - `var`   bindings         -> hoisted as `var`     (public, mutable — callers can override)
 */

export { sayHello } from './say-hello.js';
export { formatGreeting } from './format-greeting.js';
export { VERSION } from './version.js';
export { currentLang } from './current-lang.js';
export { API_PREFIX } from './api-prefix.js';
