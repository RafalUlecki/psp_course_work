# PropHover

Chrome plėtinys + Next.js API: ant **betsson.lt** NBA taškų eilutės užvedus pelę matote **hit rate** (kiek rungtynių statistika buvo **virš** linijos) pagal filtrus ir slankiklį. Rungtynių duomenys — Postgres (demo CSV). Klientas (**A** / **B**) yra tenant; watchlist yra **asmeninis kiekvienam vartotojui**. Vienas žmogus = klientas su vienu admin vartotoju. Tapatybė iš prisijungimo žetono (`POST /api/auth/login`).

**Stack (dev):** Node 20 · Next 16 · React 19 · Postgres 16 · Prisma 6 · Chrome MV3 · Vite 6

---

## Ko reikia programuotojui

| Reikia | Pastaba |
|--------|---------|
| **Node.js 20+** ir **npm** | |
| **Postgres 16** | Lokalus arba Docker (žemiau) |
| **Google Chrome** | Plėtiniui „Load unpacked“ |

Backend atskirai nėra — API ir svetainė yra tas pats **`apps/web`** procesas (`localhost:3000`).

---

## Pirmas paleidimas (vienkartinis)

**1. Postgres** (Docker pavyzdys):

```bash
docker run --name prophover-postgres \
  -e POSTGRES_USER=prophover \
  -e POSTGRES_PASSWORD=prophover \
  -e POSTGRES_DB=prophover \
  -p 5432:5432 -d postgres:16
```

**2. Konfigūracija**

```bash
cp apps/web/.env.example apps/web/.env
cp apps/extension/.env.example apps/extension/.env
```

`apps/web/.env` — nustatyk `DATABASE_URL`, pvz.:

`postgresql://prophover:prophover@localhost:5432/prophover`

`apps/extension/.env` — palik `VITE_HIT_RATE_API_BASE="http://localhost:3000"`.

**3. Priklausomybės**

```bash
npm install
npm install --prefix apps/web
npm install --prefix apps/extension
```

**4. DB migracija ir demo duomenys**

```bash
cd apps/web
npm run db:migrate
npm run seed:demo
```

Įkelia rungtynių CSV, klientus **A** / **B**, keturis dev vartotojus (admin + member kiekvienam klientui) ir asmeninius watchlist’us (Jokic ant **admin-a** ir **admin-b**, jei tas žaidėjas seed’intas). Atnaujina `apps/extension/data/players.json`. Slaptažodžiai saugomi tik kaip `scrypt` hash. Dev prisijungimai:

| Email | Slaptažodis | Klientas | Rolė |
|-------|-------------|----------|------|
| `admin-a@prophover.local` | `password-admin-a` | A | admin |
| `member-a@prophover.local` | `password-member-a` | A | member |
| `admin-b@prophover.local` | `password-admin-b` | B | admin |
| `member-b@prophover.local` | `password-member-b` | B | member |

**5. Plėtinys Chrome**

```bash
cd apps/extension
npm run build
```

Chrome → `chrome://extensions` → **Load unpacked** → `apps/extension/dist`.  
Pasirink **Client A** arba **B**: PropHover → Details → Extension options.

Po kiekvieno `seed:demo` ar plėtinio build — **perkrauk plėtinį** Chrome.

---

## Kaip paleisti

### Kartu (web + extension watch)

Iš repozitorijos šaknies (po pirmo setup):

```bash
npm start
```

- Web + API: [http://localhost:3000](http://localhost:3000)  
- Plėtinys persibuildina į `apps/extension/dist` keičiant kodą  

### Atskiriai

| Dalis | Komanda | Ką daro |
|-------|---------|---------|
| **Web + API** | `cd apps/web && npm run dev` | Next dev serveris, hit-rate ir watchlist API |
| **Plėtinys** | `cd apps/extension && npm run dev` | Vite watch → `dist/` (Chrome vis tiek load unpacked) |
| **Plėtinys (vienas build)** | `cd apps/extension && npm run build` | |

Produkcinis web (be hot reload): `cd apps/web && npm run build && npm run start`.

---

## Demo (trumpai)

1. `npm start` (arba web dev + extension build).  
2. **betsson.lt** — NBA eventas, rinka **Žaidėjo pelnyti taškai**.  
3. Užvesk pelę ant seed’into žaidėjo (pvz. Luka / Jokic) — kortelė su % ir slankikliu.  
4. Izoliacija: watchlist yra **per user**. A-admin ir A-member (tas pats klientas) nemato vienas kito eilučių; A-admin, paprašęs B įrašo `id`, gauna 403 ir B duomenys nesikeičia. GET/POST/DELETE — ir admin, ir member, bet tik **savo** eilutes. Visų kliento watchlist'ų sąrašas (`GET /api/client/watchlists`) ir trending (`GET /api/client/watchlists/trending`) — tik **admin** (member → 403).

```bash
# 1. Login as client A admin
TOKEN_A=$(curl -s http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin-a@prophover.local","password":"password-admin-a"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

# 2. Login as A-member (same client) and as B-admin
TOKEN_A_MEMBER=$(curl -s http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"member-a@prophover.local","password":"password-member-a"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

TOKEN_B=$(curl -s http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin-b@prophover.local","password":"password-admin-b"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

A_ITEM_ID=$(curl -s http://localhost:3000/api/watchlist \
  -H "Authorization: Bearer $TOKEN_A" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["id"])')

B_ITEM_ID=$(curl -s http://localhost:3000/api/watchlist \
  -H "Authorization: Bearer $TOKEN_B" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["id"])')

# 3. Same-client: A-member reads A-admin's item id — expect 403
curl -s -w '\nHTTP %{http_code}\n' \
  "http://localhost:3000/api/watchlist?id=$A_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN_A_MEMBER"

# 4. Cross-client: A-admin reads B's item id — expect 403; B's list unchanged
curl -s -w '\nHTTP %{http_code}\n' \
  "http://localhost:3000/api/watchlist?id=$B_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN_A"

curl -s -w '\nHTTP %{http_code}\n' -X DELETE \
  "http://localhost:3000/api/watchlist?id=$B_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN_A"

curl -s http://localhost:3000/api/watchlist -H "Authorization: Bearer $TOKEN_B"

# 5. List every user's watchlist in client A as A-admin — 200, only A's users (no passwordHash)
curl -s -w '\nHTTP %{http_code}\n' http://localhost:3000/api/client/watchlists \
  -H "Authorization: Bearer $TOKEN_A"

# 6. Same list as A-member — expect 403
curl -s -w '\nHTTP %{http_code}\n' http://localhost:3000/api/client/watchlists \
  -H "Authorization: Bearer $TOKEN_A_MEMBER"

# 7. Trending watchlisted players in client A as A-admin (count desc, playerId asc)
curl -s -w '\nHTTP %{http_code}\n' 'http://localhost:3000/api/client/watchlists/trending?limit=10' \
  -H "Authorization: Bearer $TOKEN_A"

# 8. Trending as A-member — expect 403
curl -s -w '\nHTTP %{http_code}\n' http://localhost:3000/api/client/watchlists/trending \
  -H "Authorization: Bearer $TOKEN_A_MEMBER"

# 9. Invalid trending limit — expect 400
curl -s -w '\nHTTP %{http_code}\n' 'http://localhost:3000/api/client/watchlists/trending?limit=51' \
  -H "Authorization: Bearer $TOKEN_A"

# Wrong password — expect 401 {"error":"invalid_credentials"} (same body for unknown email)
curl -s -w '\nHTTP %{http_code}\n' http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin-a@prophover.local","password":"wrong"}'

# Token A + X-Client-Id: B — still A's watchlist (header ignored)
curl -s http://localhost:3000/api/watchlist \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "X-Client-Id: B"

# No token — 401
curl -s -w '\nHTTP %{http_code}\n' http://localhost:3000/api/watchlist
```

Watchlist visada reikalauja vartotojo sesijos (be žetono — 401). Tapatybė tik iš žetono: `X-Client-Id` ignoruojamas (pvz. token A + `X-Client-Id: B` vis tiek grąžina A watchlist'ą).

Daugiau apie DB/CSV: [apps/web/README.md](apps/web/README.md), [apps/web/data/README.md](apps/web/data/README.md).

---

## Testai ir lint

```bash
cd apps/web
npm test
npm run lint
```

AI agentams: [AGENTS.md](AGENTS.md).
