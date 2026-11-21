# Contributing

## Git

- Follow [Conventional Commits](https://www.conventionalcommits.org) for commit messages
- Keep commits small and focused on a single purpose
- All development happens on a single branch, `main`
- Contributions are welcome as pull requests against `main`
- Cut a release with `pnpm version <patch|minor|major> -m "chore: release v%s"`, then push the commit and the tag together with `git push --follow-tags`. Pushing the tag stages the release on npm, where a maintainer approves it to publish
- Versions follow [Semantic Versioning](https://semver.org)

## Coding Conventions

Code style is enforced by [Biome](https://biomejs.dev/). Run `pnpm run lint` before committing.

Entry points and tool configuration files follow the format each tool requires. The conventions below apply to all other code.

- One export per file; name the file after its export
- Use arrow functions instead of classes
- Use async/await for asynchronous code
- Use kebab-case for file names
- Use camelCase for function and variable names

## Testing

- Use [Vitest](https://vitest.dev) for unit tests
- Run tests with `pnpm run test`
- Name test files `*.test.js` and place them in the `test/` directory

## Documentation

- Use [JSDoc](https://jsdoc.app) for API documentation, generated into `docs/` with `pnpm run docs`
- Write types and descriptions in JSDoc, and make sure generation produces no warnings
- Write types in JSDoc type syntax, not TypeScript syntax: `{*}` for any type, `{Object.<string, function>}` for key-value maps, `{function(T): R}` for function types
- Add `@function` to arrow functions assigned to `const` / `export const`; without it, the parameter and return tables are not generated. The name can be omitted, since it is inferred from the variable name
- Add `@private` to file-local functions that are not exported, so they are excluded from the docs and not mistaken for public API
