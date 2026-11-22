# PropHover

Chrome plėtinys + Next.js API: ant **betsson.lt** NBA taškų eilutės užvedus pelę matote **hit rate** (kiek rungtynių statistika buvo **virš** linijos) pagal filtrus ir slankiklį. Rungtynių duomenys — Postgres (demo CSV). Klientas (**A** / **B**) yra tenant; watchlist yra **asmeninis kiekvienam vartotojui**. Vienas žmogus = klientas su vienu admin vartotoju. Tapatybė iš prisijungimo žetono (`POST /api/auth/login`).

**Stack (dev):** Node 20 · Next 16 · React 19 · Postgres 16 · Prisma 6 · Chrome MV3 · Vite 6 · Docker Compose

---

## Ko reikia programuotojui

| Reikia | Pastaba |
|--------|---------|
| **Docker** ir **Docker Compose v2** | Viena komanda: `docker compose up --build` |
| **Node.js 20+** ir **npm** | Plėtiniui ir lokaliam `npm run dev` |
| **Google Chrome** | Plėtiniui „Load unpacked“ |

Backend atskirai nėra — API ir svetainė yra tas pats **`apps/web`** procesas (`localhost:3000`).

---

## Visa sistema konteineriuose (viena komanda)

Po `git clone`:

```bash
cp .env.example .env
docker compose up --build
```

Paleidžia **Postgres 16** ir produkcinį Next.js API ant [http://localhost:3000](http://localhost:3000). Web konteineris startuodamas: `prisma migrate deploy` → demo seed (idempotentiškas) → `next start`. Seed įkelia tuos pačius demo vartotojus kaip ir `npm run seed:demo` (`admin-a`, `member-a`, `admin-b`, `member-b` — lentelė žemiau). Pirmas paleidimas trunka ilgiau dėl seed (CSV upsert). Perkrovus seed **nedubliuoja** eilučių.

Sustabdyti: `docker compose down`. Ištrinti DB volume: `docker compose down -v`.

### Aplinkos kintamieji (šaknies `.env`)

Compose ir web konteineris skaito **šaknies** `.env` (pavyzdys committed: `.env.example`; `.env` gitignore’intas, be tikrų secret’ų). Pakeitus reikšmę (pvz. `AUTH_TOKEN_TTL_DAYS`) ir perkrovus konteinerius elgsena keičiasi be kodo keitimo.

| Kintamasis | Ką valdo |
|------------|----------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres konteinerio vartotojas, slaptažodis ir duomenų bazė (turi sutapti su `DATABASE_URL`) |
| `DATABASE_URL` | Prisma / API ryšys su Postgres. Compose tinkle hostas yra **`postgres`** (serviso vardas) |
| `AUTH_TOKEN_TTL_DAYS` | Prisijungimo žetono galiojimas dienomis. Trūksta → 14. Ne skaičius arba `< 1` → startas nutrūksta |
| `AUTH_REQUIRED` | Ar privatūs `/api` maršrutai reikalauja Bearer žetono (numatytai `true`). `POST /api/auth/login` visada viešas |
| `NEXT_PUBLIC_API_BASE_URL` | Viešas API URL naršyklei |

### Chrome plėtinys (vis tiek atskirai)

Plėtinys **nėra** Compose steke. Jį pastatyk su `npm run build` ir įkelk unpacked:

```bash
cp apps/extension/.env.example apps/extension/.env
npm install --prefix apps/extension
npm run build --prefix apps/extension
```

Chrome → `chrome://extensions` → **Load unpacked** → `apps/extension/dist`.  
Pasirink **Client A** arba **B**: PropHover → Details → Extension options.  
`apps/extension/.env` — palik `VITE_HIT_RATE_API_BASE="http://localhost:3000"`.

---

## Pirmas paleidimas be Compose (Node + atskiras Postgres)

**1. Postgres** (jei nenaudoji `docker compose`; Docker pavyzdys):

```bash
docker run --name prophover-postgres \
  -e POSTGRES_USER=prophover \
  -e POSTGRES_PASSWORD=prophover \
  -e POSTGRES_DB=prophover \
  -p 5432:5432 -d postgres:16
```

Arba palik `docker compose up postgres` ir naudok `localhost` `apps/web/.env` faile.

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

Įkelia rungtynių CSV, klientus **A** / **B**, abiejų klientų nustatymus (`defaultLastN=10`), keturis dev vartotojus (admin + member kiekvienam klientui) ir asmeninius watchlist’us (Jokic ant **admin-a** ir **admin-b**, jei tas žaidėjas seed’intas). Atnaujina `apps/extension/data/players.json`. Slaptažodžiai saugomi tik kaip `scrypt` hash. Dev prisijungimai:

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

### Docker Compose (produkcinis web + Postgres)

```bash
cp .env.example .env
docker compose up --build
```

Plėtinys vis tiek: `npm run build --prefix apps/extension` ir Load unpacked (`apps/extension/dist`).

### Kartu (web + extension watch, be Compose)

Iš repozitorijos šaknies (po pirmo setup be Compose):

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

1. `docker compose up --build` (arba `npm start` / web dev + extension build).  
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

# 10. Client settings: A-admin changes defaultLastN to 5
curl -s -w '\nHTTP %{http_code}\n' -X PATCH http://localhost:3000/api/client-settings \
  -H "Authorization: Bearer $TOKEN_A" \
  -H 'Content-Type: application/json' \
  -d '{"defaultLastN":5}'

# 11. Same PATCH as A-member — expect 403
curl -s -w '\nHTTP %{http_code}\n' -X PATCH http://localhost:3000/api/client-settings \
  -H "Authorization: Bearer $TOKEN_A_MEMBER" \
  -H 'Content-Type: application/json' \
  -d '{"defaultLastN":5}'

# 12. Same hit-rate call without lastN: A uses 5, B still uses 10
curl -s -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/api/hit-rate?playerId=203999&stat=PTS&line=24.5' \
  -H "Authorization: Bearer $TOKEN_A"

curl -s -w '\nHTTP %{http_code}\n' \
  'http://localhost:3000/api/hit-rate?playerId=203999&stat=PTS&line=24.5' \
  -H "Authorization: Bearer $TOKEN_B"

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
