/**
 * `export const` patterns.
 *
 * GAS treats top-level `const` bindings as private to library callers.
 * The plugin preserves the declaration kind and the right-hand-side shape:
 *
 *   - constValue    -> `const constValue = lib_.constValue`                                      (alias to value)
 *   - constArrow    -> `const constArrow = (...args) => lib_.constArrow(...args)`                (arrow wrapper)
 *   - constFunction -> `const constFunction = function(...args){return lib_.constFunction(...args)}` (function-expression wrapper)
 *
 * The wrapper forms keep the binding callable AND visible to GAS's editor /
 * trigger UI (so you can attach triggers), while `const` keeps it private
 * from external library callers.
 */

export const constValue = 42;

export const constArrow = (x) => x;

export const constFunction = function (x) {
	return x;
};
