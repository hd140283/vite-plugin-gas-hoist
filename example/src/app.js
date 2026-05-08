/*
 * Entry point. Re-exports every declaration kind so vite-plugin-gas-hoist
 * can hoist all 10 ESM export shapes with their original kind and right-hand
 * side preserved. See the kind-grouped modules for what each pattern produces
 * in `dist/app.js`:
 *
 *   - const.js    -> 3 const patterns    (value, arrow, function expression)
 *   - let.js      -> 3 let patterns      (value, arrow, function expression)
 *   - var.js      -> 3 var patterns      (value, arrow, function expression)
 *   - function.js -> 1 function declaration
 */

export { constArrow, constFunction, constValue } from './const.js';
export { functionDecl } from './function.js';
export { letArrow, letFunction, letValue } from './let.js';
export { varArrow, varFunction, varValue } from './var.js';
