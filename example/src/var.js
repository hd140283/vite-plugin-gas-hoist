/**
 * `export var` patterns. GAS treats top-level `var` as public — library
 * callers can read and reassign these bindings (e.g. `MyLib.varValue = ...`).
 *
 * The plugin preserves the kind and the right-hand-side shape, the same way
 * it does for `const` / `let`. The difference is purely in `var` semantics
 * (public + reassignable from outside the library):
 *
 *   - varValue    -> `var varValue = lib_.varValue`                                            (alias to value)
 *   - varArrow    -> `var varArrow = (...args) => lib_.varArrow(...args)`                       (arrow wrapper)
 *   - varFunction -> `var varFunction = function(...args){return lib_.varFunction(...args)}`    (function-expression wrapper)
 *
 * The wrapper forms keep the binding visible to GAS's editor / trigger UI
 * (the right-hand side is a function literal), which a plain alias would not
 * be — so use these forms when callers should be able to attach triggers or
 * pick the function from the editor's "Run" dropdown.
 */

export var varValue = 'public';

export var varArrow = (x) => x;

export var varFunction = function (x) {
	return x;
};
