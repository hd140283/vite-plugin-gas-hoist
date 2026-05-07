/*
 * Entry point. Re-exports the library's public surface so vite-plugin-gas-hoist
 * hoists each binding with the kind that matches its source declaration:
 *
 *   - `function` declarations -> hoisted as `function` (public to GAS callers)
 *   - `const` bindings        -> hoisted as `const`   (private to GAS callers,
 *                                still callable from inside the library)
 *
 * Pick the kind in the source module to match what library consumers should see.
 */

export { DEFAULT_LANG } from './default-lang.js';
export { formatGreeting } from './format-greeting.js';
export { greetAll } from './greet-all.js';
export { onOpen } from './on-open.js';
export { sayHello } from './say-hello.js';
export { VERSION } from './version.js';
