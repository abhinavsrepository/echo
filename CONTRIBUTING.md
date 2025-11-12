# Contributing to Echo

First off, thank you for considering contributing to Echo!

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues list. When you create a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples
- Describe the behavior you observed and what you expected
- Include screenshots if relevant
- Include your environment details (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Explain why this enhancement would be useful
- List any similar features in other products

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes (`pnpm test`)
4. Make sure your code lints (`pnpm lint`)
5. Update documentation as needed
6. Write a clear commit message

## Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Start development
pnpm dev
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc comments for public APIs

## Testing

- Write unit tests for new functions
- Add integration tests for new features
- Aim for 80%+ code coverage
- Run `pnpm test` before submitting PR

## Commit Messages

Follow conventional commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting, missing semicolons, etc.
- `refactor:` code restructuring
- `test:` adding tests
- `chore:` maintenance tasks

Example: `feat: add voice call recording feature`

## Release Process

We use semantic-release for automated versioning:

- Commits to `main` trigger releases
- Version bumps based on commit messages
- Changelog automatically generated

## Questions?

Feel free to open an issue with the `question` label or join our Discord.
