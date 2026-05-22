# Contributing

## Development Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set backend URLs.
3. Start the app with `npm run dev`.
4. Run `npm run lint`, `npm run test`, and `npm run format:check` before submitting changes.

## Code Style

- TypeScript is required for application code.
- Keep comments in English.
- Prefer shared constants from `lib/constants.ts`.
- Put reusable application types in `app/types`.
- Use Prettier for formatting and ESLint for static checks.
- Keep API proxy behavior server-side unless there is a clear client requirement.

## Commit Messages

Use concise, imperative commit messages:

```text
Add LHM approval error handling
Fix attendance filter date parsing
Update dashboard loading state
```

## Pull Request Process

- Describe the problem and the implemented change.
- Include testing evidence.
- Call out environment, migration, or deployment changes.
- Keep PRs focused; split unrelated refactors into separate changes.

## Testing Requirements

- Add or update Vitest tests for changed utilities and business logic.
- Manually verify affected user workflows.
- Run coverage for changes that touch shared utilities or route-handler behavior.
