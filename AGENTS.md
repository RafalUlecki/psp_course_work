# PropHover — instructions for AI agents (including Cloud)

**Read this before implementing any Linear task.** Also apply all rules in `.cursor/rules/`.

## Stack

- `apps/web` — Next.js App Router, TypeScript, Prisma → Postgres, `src/lib/` for business logic
- `apps/extension` — Chrome MV3 (Vite + React + styled-components + TanStack Query); load unpacked from `apps/extension/dist` after `npm run build`
- API: thin `app/api/**/route.ts` handlers → call `src/lib` → JSON (no business logic in routes)
- Query/body validation at the boundary: **Zod** next to the parser (e.g. `hitRate/query/`; or `schemas/` when a domain uses that layout). Keep API error strings in that module’s `errors.ts`.

## Must-follow conventions

### TypeScript

- Functions: `const name = (props: Props): ReturnType => { ... }` (arrow functions, explicit return types)
- **Do not** destructure parameters in `()`; take one object and destructure inside the body
- **`interface`** for object shapes; **`type`** for unions / primitives / aliases (e.g. `type Id = number | null`)
- **No `any` or `unknown`**

### File layout (`apps/web`)

- Routes: keep `page.tsx` / `layout.tsx` thin; UI in `app/_features/<feature>/` or `app/_app/`
- `PascalCase.tsx` for pages and components; **`camelCase.ts`** for utils, types, styles
- `src/lib/<domain>/` per area (`gameLogs/`, `hitRate/`). Shared: `src/lib/prisma.ts`
- Types: `src/lib/<domain>/types/<sameBaseNameAsHelper>.ts` when needed; **`interface`** for option objects

### Tests (`*.test.ts`)

- Names: **`should <outcome> when <condition>`**
- **One assertion** per test; no `// Given` / `// When` / `// Then` comments
- **No real database** in `*.test.ts` — mock ports (e.g. `GameLogReader`). DB + seed only in integration tests with `RUN_DB_TESTS=1`
- Avoid low-value tests (duplicate `callCount`, redundant `every()` after `idsOf`, per-field seed assertions for passthrough helpers)
- Run: `cd apps/web && npm test` (`apps/web/src`, `apps/web/app`, and `apps/extension` `*.test.ts` files)

### Before opening a PR

```bash
cd apps/web
npm test
npm run lint
npm run build
```

If the task touches DB/seed: document `npm run db:migrate` and `npm run seed` in the PR body.

## Task workflow

1. Read the Linear issue and **out of scope** section; do not expand scope.
2. Match existing patterns in `src/lib/` (see `gameLogs/`, `hitRate/`).
3. PR title: `PH-N: <short title>`; include **How to test** steps.
