/**
 * GAS-reserved simple trigger. Apps Script calls `onOpen` automatically
 * when a bound Google Sheet, Doc, or Form is opened.
 *
 * Declared with `export function` so the plugin hoists it as a top-level
 * `function` declaration — the shape GAS expects for trigger handlers
 * (the trigger configuration UI also requires `function` declarations).
 */
export function onOpen() {
	console.log('onOpen trigger fired');
}
