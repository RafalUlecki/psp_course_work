# PropHover

`apps/web` is the Next.js app. `apps/extension` is the Chrome MV3 extension stub.

## `apps/web` structure

Each **page** or **app shell feature** lives in a private folder under `app/` (prefix `_` so it is not a URL segment). Inside the feature:

```
app/
  page.tsx              # route entry only (Next.js)
  layout.tsx
  _features/            # all page features (private — not in URL)
    home/               # `/` feature
      HomePage.tsx
      components/       # PascalCase.tsx
      styles/           # camelCase.ts (e.g. homeHeading.ts)
      types/            # camelCase.ts (e.g. providersProps.ts)
      utils/            # camelCase.ts (e.g. getQueryClient.ts) — add when needed
    settings/           # example: `/settings` → app/settings/page.tsx
      SettingsPage.tsx
      …
  _app/                 # root layout shell (providers, etc.)
    Providers.tsx
    utils/
      getQueryClient.ts
    types/
```

**Naming:** `PascalCase.tsx` for pages and components; `camelCase.ts` for utils, types, and style modules (e.g. `getQueryClient.ts`, `homeHeading.ts`).

**New route example:** `app/settings/page.tsx` imports `./_features/settings/SettingsPage`.
