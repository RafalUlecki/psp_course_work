# PropHover extension

Chrome MV3 content script for `https://www.betsson.lt/*`.

## Behaviour

Looks for player-name + line rows (bundled `players.json`) under a points market header containing `taškai` and not `+` (e.g. **Žaidėjo pelnyti taškai**). Hit-rate requests go through the background service worker to the Next API. The hover card is a fixed overlay on `document.body`.

## Setup

1. From `apps/web`, migrate and seed (all CSV players by default):

   ```bash
   npm run db:migrate
   npm run seed:demo
   npm run start
   ```

2. Copy `apps/extension/.env.example` to `apps/extension/.env`. Keep `VITE_HIT_RATE_API_BASE="http://localhost:3000"`.

3. Build (PowerShell):

   ```powershell
   cd apps\extension
   npm run build
   ```

   Or: `$env:VITE_HIT_RATE_API_BASE = "http://localhost:3000"; npm run build`

4. Chrome → `chrome://extensions` → Load unpacked → `apps/extension/dist`.

5. Open a Betsson NBA event, market **Žaidėjo pelnyti taškai**, hover a seeded player.

6. Pick **Client A** or **Client B** in extension options (`chrome://extensions` → PropHover → **Details** → **Extension options**). The hover-card star adds/removes that player on the selected client’s watchlist. Switching A/B changes which stars are filled.

Reload the extension after each build and after `seed:demo` (it rewrites `players.json`). The selected client is stored in `chrome.storage.local` (`clientId`) and sent as `X-Client-Id` on watchlist requests.
