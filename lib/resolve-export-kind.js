/** @typedef {ModuleExports & { resolutions: Array<{ id: string } | null> }} ModuleRecord */

/**
 * Resolves the declaration kind of a module's export, following re-exports
 * to the module that declares it.
 *
 * @param {Map<string, ModuleRecord>} modules
 * @param {string | null | undefined} id
 * @param {string} name
 * @param {Set<string>} [seen]
 * @returns {ExportInfo | undefined}
 */
export const resolveExportKind = (modules, id, name, seen = new Set()) => {
	const record = modules.get(id);
	const key = `${id}\0${name}`;
	if (!record || seen.has(key)) return undefined;
	seen.add(key);

	/** @param {string} source */
	const idOf = (source) => record.resolutions[record.sources.indexOf(source)]?.id;

	const binding = record.bindings.get(name);
	if (binding) {
		return 'source' in binding ? resolveExportKind(modules, idOf(binding.source), binding.name, seen) : binding;
	}

	// `export *` never re-exports the default export.
	if (name === 'default') return undefined;

	for (const source of record.stars) {
		const info = resolveExportKind(modules, idOf(source), name, seen);
		if (info) return info;
	}
	return undefined;
};
