# Contributing

## Git

- Follow [Conventional Commits](https://www.conventionalcommits.org) for commit messages
- Keep commits small and focused on a single purpose

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
