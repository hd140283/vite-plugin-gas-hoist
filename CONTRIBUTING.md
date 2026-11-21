# Contributing

## Git

- Follow [Conventional Commits](https://www.conventionalcommits.org) for commit messages
- Keep commits small and focused on a single purpose
- All development happens on a single branch, `main`
- Contributions are welcome as pull requests against `main`
- Cut a release with `pnpm version <patch|minor|major> -m "chore: release v%s"`, and remember to push the tag too. Pushing the tag stages the release on npm, where a maintainer approves it to publish
- Versions follow [Semantic Versioning](https://semver.org)

## Coding Conventions

### Formatting

Code style is enforced by [Biome](https://biomejs.dev/). Run before committing:

```bash
pnpm run lint
```

### JavaScript

- One export per file; filename and export name should match
- Use arrow functions instead of classes
- Use async/await for asynchronous code
- Use JSDoc for type definitions
