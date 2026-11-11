# PropHover extension

Chrome Manifest V3 content script for `https://www.betsson.lt/*`. Full prerequisites, env example, migrate/seed, `npm start`, sample data, and the numbered demo are in the [root README](../../README.md).

## Behaviour

Looks for player-name + line rows (bundled `players.json`) under a points market header containing `taškai` and not `+` (e.g. **Žaidėjo pelnyti taškai**). Hit-rate requests go through the background service worker to `GET /api/hit-rate`. The hover card is a fixed overlay on `document.body` (last-N, venue, line slider, watchlist star).

Pick **Client A** or **Client B** on the options page. That choice is stored in `chrome.storage.local` (`clientId`) and used locally to cache hover-card stars. Watchlist identity on the API comes from the login token, not `X-Client-Id`. After `seed:demo`, both clients start with empty watchlists unless the demo seed added per-user stars.

## Setup

1. From the **repo root**, copy env files, install, migrate, and seed (see the [root README](../../README.md#setup-and-run)). From `apps/web`:

   ```bash
   npm run db:migrate
   npm run seed:demo
   ```

2. Copy `apps/extension/.env.example` to `apps/extension/.env`. Keep the placeholder:

   ```bash
   VITE_HIT_RATE_API_BASE="http://localhost:3000"
   ```

3. Run the API and the extension watch build together (repo root; this is the documented start command):

   ```bash
   npm start
   ```

   Or build the extension once:

   ```bash
   cd apps/extension
   npm run build
   ```

4. Chrome → `chrome://extensions` → Load unpacked → `apps/extension/dist`.

5. Open a Betsson NBA event, market **Žaidėjo pelnyti taškai**, hover a seeded player. If that market is missing, use the curl fallback in the [root README demo](../../README.md#demo).

6. Pick **Client A** or **Client B** in extension options (`chrome://extensions` → PropHover → **Details** → **Extension options**). That picker is local-only; the API watchlist is the signed-in user's.

Reload the extension after each build and after `seed:demo` (it rewrites `players.json`).

Unit tests for this package live in `apps/extension/tests/` and run with:

```bash
cd apps/web
npm test
```
