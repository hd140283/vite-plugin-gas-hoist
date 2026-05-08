/**
 * `export let` patterns. Same library visibility as `const` (private to
 * external callers), but the binding is reassignable from inside the library.
 *
 *   - letValue    -> `let letValue = lib_.letValue`
 *   - letArrow    -> `let letArrow = (...args) => lib_.letArrow(...args)`
 *   - letFunction -> `let letFunction = function(...args){return lib_.letFunction(...args)}`
 */

export let letValue = 0;

export let letArrow = (x) => x;

export let letFunction = function (x) {
	return x;
};
