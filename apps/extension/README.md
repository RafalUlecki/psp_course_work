# PropHover extension

Chrome MV3 content script for the local fixture page (`http://localhost:3000/fixture/*`).

**Stack:** Vite, React, styled-components, TanStack Query (`useQuery`).

UI lives under `src/components/<feature>/`. Split out `requests/`, `utils/`, or `types/` only when a file would otherwise mix unrelated jobs.

## Develop

1. Start the web app: `cd apps/web && npm run dev`
2. Copy `apps/extension/.env.example` to `apps/extension/.env`. `VITE_HIT_RATE_API_BASE` is baked into `fetchHitRate` at build time. Leave it empty for same-origin `/api/hit-rate` on the fixture page.
3. Build (or watch) the extension:

   ```bash
   cd apps/extension
   npm install
   npm run build
   # or: npm run dev
   ```

4. In Chrome: **Extensions → Load unpacked** → select **`apps/extension/dist`**
5. Open `http://localhost:3000/fixture/props.html` and hover the props row.

Reload the extension after each production build (or after watch rebuilds).
