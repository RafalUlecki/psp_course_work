# PropHover

Chrome plėtinys + Next.js API: ant **betsson.lt** NBA taškų eilutės užvedus pelę matote **hit rate** (kiek rungtynių statistika buvo **virš** linijos) pagal filtrus ir slankiklį. Rungtynių duomenys — Postgres (demo CSV); watchlist — du testiniai klientai **A** / **B** (`X-Client-Id`, be prisijungimo).

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

Įkelia rungtynių CSV, klientus **A** / **B** ir watchlist eilutes; atnaujina `apps/extension/players.json`.

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
4. Izoliacija: extension options A vs B (žvaigždutės) arba:

```bash
curl -s http://localhost:3000/api/watchlist -H "X-Client-Id: A"
curl -s http://localhost:3000/api/watchlist -H "X-Client-Id: B"
```

Daugiau apie DB/CSV: [apps/web/README.md](apps/web/README.md), [apps/web/data/README.md](apps/web/data/README.md).

---

## Testai ir lint

```bash
cd apps/web
npm test
npm run lint
```

AI agentams: [AGENTS.md](AGENTS.md).
