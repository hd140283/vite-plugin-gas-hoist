/**
 * `export function` declaration — the classic form for GAS-public functions.
 *
 * The plugin emits:
 *
 *   function functionDecl(...args){return lib_.functionDecl(...args)}
 *
 * which is callable and visible to GAS's editor / trigger UI.
 */

export function functionDecl(x) {
	return x;
}
