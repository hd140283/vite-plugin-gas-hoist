/**
 * Optional prefix prepended to every formatted greeting.
 *
 * Declared with `export var` so the plugin hoists it as `var`. GAS treats
 * top-level `var` bindings (and `function` declarations) as PUBLIC at
 * library scope, so consumers can override the value directly:
 *
 *   MyLibrary.API_PREFIX = 'prod-';
 */
export var API_PREFIX = 'demo-';
