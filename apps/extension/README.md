# PropHover extension

Chrome MV3 content script for local fixture pages (`http://localhost/fixture/*`, any port).

**Stack:** Vite, React, styled-components, TanStack Query (`useQuery`).

UI lives under `src/components/<feature>/`. Split out `requests/`, `utils/`, or `types/` only when a file would otherwise mix unrelated jobs.

## API base URL

The content script calls `{VITE_HIT_RATE_API_BASE}/api/hit-rate`. That value is a single Vite env constant, read in `fetchHitRate` at **build** time (no options page).

| Setup | `VITE_HIT_RATE_API_BASE` | Also required |
| --- | --- | --- |
| Local Next API (typical unpacked dev) | `http://localhost:3000` — same as `NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.example` | `host_permissions` already include `http://localhost:3000/*` |
| Same-origin fixture on the Next app | empty string (relative `/api/hit-rate`) | none |
| Packaged extension → hosted API | the hosted origin, e.g. `https://api.example.com` | replace `https://YOUR_HOSTED_API_ORIGIN.example/*` in `manifest.src.json` `host_permissions` |

Copy `.env.example` to `.env` before building. Do not commit `.env`. Production deploy automation is out of scope.

If the fixture page is on a different origin than the API (another localhost port, or `127.0.0.1` vs `localhost`), the Next route `/api/hit-rate` sends CORS headers so the content-script `fetch` can succeed.

## Develop

1. Start the web app: `cd apps/web && npm run dev`
2. Copy `apps/extension/.env.example` to `apps/extension/.env`. Keep `VITE_HIT_RATE_API_BASE="http://localhost:3000"` to call the local Next API from any fixture origin.
3. Build (or watch) the extension:

   ```bash
   cd apps/extension
   npm install
   npm run build
   # or: npm run dev
   ```

4. In Chrome: **Extensions → Load unpacked** → select **`apps/extension/dist`**
5. Open `http://localhost:3000/fixture/props.html` and hover the props row.

To confirm a **cross-origin** call, serve the same fixture from another port (the content script matches any localhost fixture path) and hover again — the card should still show a hit-rate percent, not `error`:

```bash
python3 -m http.server 4173 --directory apps/web/public
# then open http://localhost:4173/fixture/props.html
```

Reload the extension after each production build (or after watch rebuilds). After `npm run seed:demo` in `apps/web` (it rewrites `players.json` and the fixture player id), rebuild the extension and reload it in Chrome.
