/**
 * Currently active greeting language.
 *
 * Declared with `export let` so the plugin hoists it as `let`. GAS treats
 * top-level `let` bindings as private to library callers (just like `const`),
 * but unlike `const` the binding can be reassigned from inside the library
 * — useful for runtime-mutable settings.
 */
export let currentLang = 'en';
