/**
 * Library version constant.
 *
 * Declared with `export const` so vite-plugin-gas-hoist hoists it as
 * `const VERSION = lib_.VERSION`. GAS treats top-level `const` bindings
 * as private to library callers, but they remain accessible from the
 * library's own functions and triggers.
 */
export const VERSION = '0.2.0';
