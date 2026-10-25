# PropHover extension

Chrome MV3 content script for local fixture pages (`http://localhost/fixture/*`, any port) and `https://www.betsson.lt/*`.

**Stack:** Vite, React, styled-components, TanStack Query (`useQuery`).

UI lives under `src/components/<feature>/`. Split out `requests/`, `utils/`, or `types/` only when a file would otherwise mix unrelated jobs.

The fixture `data-prophover-*` path runs first. If that row is missing, a generic text/structure detector looks for player-name rows (bundled `players.json`) under a points market header containing `taškai` and not `+`. The hover card is a fixed overlay on `document.body`.

## API base URL

Hit-rate requests go through the background service worker to `{VITE_HIT_RATE_API_BASE}/api/hit-rate`. That value is a Vite env constant, read at **build** time (no options page). It defaults to `http://localhost:3000`.

| Setup | `VITE_HIT_RATE_API_BASE` | Also required |
| --- | --- | --- |
| Local Next API (typical unpacked dev) | `http://localhost:3000` — same as `NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.example` | `host_permissions` already include `http://localhost:3000/*` |
| Packaged extension → hosted API | the hosted origin, e.g. `https://api.example.com` | replace `https://YOUR_HOSTED_API_ORIGIN.example/*` in `manifest.src.json` `host_permissions` |

Copy `.env.example` to `.env` before building. Do not commit `.env`. Production deploy automation is out of scope.

## Develop

1. Start the web app: `cd apps/web && npm run dev`
2. Copy `apps/extension/.env.example` to `apps/extension/.env`. Keep `VITE_HIT_RATE_API_BASE="http://localhost:3000"` to call the local Next API.
3. Build (or watch) the extension:

   ```bash
   cd apps/extension
   npm install
   npm run build
   # or: npm run dev
   ```

4. In Chrome: **Extensions → Load unpacked** → select **`apps/extension/dist`**
5. Open `http://localhost:3000/fixture/props.html` and hover the props row.
6. Generic detector (no `data-prophover-*`): `http://localhost:3000/fixture/generic-rows.html`

Reload the extension after each production build (or after watch rebuilds). After `npm run seed:demo` in `apps/web` (it rewrites `players.json` and the fixture player id), rebuild the extension and reload it in Chrome.
