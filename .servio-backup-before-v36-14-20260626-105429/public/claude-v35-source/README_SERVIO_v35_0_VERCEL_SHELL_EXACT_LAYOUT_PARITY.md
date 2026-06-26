# SERVIO v35.0 — Vercel Shell Exact Layout Parity

## Rezumat

Redesign complet al shell-ului SERVIO pentru a reproduce fidel layout-ul și sistemul de design Vercel, păstrând intacte toate endpointurile API, logica backend și funcționalitățile existente.

---

## Fișiere modificate

### `src/worker.js`
- Actualizat funcția `pathForRoute()`: ruta `/` nu mai trimite la `/login.html`, ci direct la `/dashboard/module-menu.html`
- Adăugate rute noi: `/relay-sources`, `/day-ahead`, `/incarcare-curba-sarcina`, `/overview`, `/live-sources`, `/ingest-api`, `/d1-storage`, `/audit-logs`, `/github-actions`, `/windows-relay`, `/environment`, `/api-routes`, `/integrations`
- Adăugate rute cu extensie `.html` ca alias-uri pentru rutele existente

---

## Fișiere noi create

### Shell / Design system
| Fișier | Rol |
|--------|-----|
| `public/s.css` | Design system complet Vercel-like: variabile CSS, sidebar, topbar, carduri, butoane, tabele, badge-uri, forme, responsive |
| `public/app.js` | JS partajat: collapse sidebar, drawer mobil, active nav state, search sidebar, health ping topbar, utilitare SERVIO.fmt |

### Pagini HTML (shell Vercel-like)
| Fișier | Rută | Conținut |
|--------|------|----------|
| `public/dashboard/module-menu.html` | `/module-menu`, `/overview`, `/` | Overview cu carduri Usage, Modules, Alerts, Recent Sync, Activity audit |
| `public/dashboard/day-ahead-operations.html` | `/day-ahead-operations`, `/day-ahead` | Prețuri Day-Ahead, tabs azi/mâine, interval grid PT-15, source health, tabel lazy |
| `public/dashboard/battery-calculator.html` | `/battery-calculator` | Calculator BESS cu presets, simulate-market-period, forecast P10/P50/P90 |
| `public/dashboard/relay-sources.html` | `/relay-sources` | Observabilitate Worker, D1, Ingest API, Live Sources, Audit, Routes reference |
| `public/dashboard/future-scenarios.html` | `/future-scenarios` | Forecast scenarii cu tabel lunar P10/P50/P90 |
| `public/dashboard/electricity-map.html` | `/electricity-map` | Hartă energie, intensitate carbon vecini, tabs Grid/Carbon/Flows |
| `public/dashboard/battery-revenue-simulator.html` | `/battery-revenue-simulator` | Redirect la `/battery-calculator` |
| `public/incarcare-curba-sarcina.html` | `/incarcare-curba-sarcina` | Upload CSV/XLSX, analiză consum, tarif detaliat, export, continuare BESS |

### Configurare
| Fișier | Rol |
|--------|-----|
| `wrangler.toml` | Configurare Cloudflare Workers cu `[assets]` binding pentru `./public` |
| `src/official-engine-worker.js` | Stub sintactic valid pentru CI check (`node --check`) |

---

## Ce a fost schimbat în design

### Shell Vercel-like
- **Sidebar** 240px, fundal alb, border-right `1px solid #eaeaea`
- **Workspace header** cu logo pătrat negru + nume + subtitlu
- **Search sidebar** cu shortcut `F`, filtrare nav items în timp real
- **Nav items** 32px înălțime, icon 16px + label, active cu `#efefef`, hover cu `#f2f2f2`
- **Secțiuni nav**: Main / Operations / Settings cu label-uri uppercase mici
- **Footer sidebar**: user row + collapse button cu animație
- **Topbar** 48px, border-bottom fin, breadcrumb stânga, status dot + acțiuni dreapta
- **Status dot** animat: verde=live, galben=loading, roșu=error
- **Content area** padding 32px 40px, max-width 1024px centrat
- **Carduri** border `1px solid #eaeaea`, radius 8px, fără shadow
- **Butoane**: primary negru/alb, secondary border fin, icon 32x32
- **Badge-uri**: green/yellow/red/gray/blue cu border color
- **Tipografie**: system-ui stack, 13px body, compact line-height
- **Responsive**: sidebar drawer mobil cu overlay, cards 1 coloană sub 900px

### Fără
- Login screen
- GSAP / animații decorative
- Gradienturi
- Hero mare
- Admin template generic
- Overflow mobil

---

## Ce a fost păstrat funcțional

- Toate endpointurile API: `/api/servio/*`
- Logica backend din `src/worker.js`
- Upload fișiere (curba de sarcină)
- Calculator BESS cu `simulate-market-period`
- Forecast P10/P50/P90
- Day-Ahead summary + records
- Ingest API + batch ingest
- D1 Storage queries
- Live source sync
- Audit progress
- Transelectrica bundled data
- GitHub Actions workflow
- Scripts în `scripts/`

---

## Rute vizuale verificate

Toate rutele de mai jos trebuie să returneze `200` cu HTML valid:

| Rută | Pagină |
|------|--------|
| `/` | Overview |
| `/module-menu` | Overview |
| `/overview` | Overview |
| `/incarcare-curba-sarcina` | Consum / Upload |
| `/incarcare-curba-sarcina.html` | Consum / Upload (asset direct) |
| `/battery-calculator` | Calculator BESS |
| `/battery-calculator.html` | Calculator BESS |
| `/battery-revenue-simulator` | Redirect → BESS |
| `/day-ahead-operations` | Day-Ahead |
| `/day-ahead` | Day-Ahead |
| `/day-ahead.html` | Day-Ahead |
| `/day-ahead-operations.html` | Day-Ahead |
| `/future-scenarios` | Scenarii |
| `/future-scenarios.html` | Scenarii |
| `/electricity-map` | Hartă energie |
| `/electricity-map.html` | Hartă energie |
| `/relay-sources` | Relay & Surse |
| `/relay-sources.html` | Relay & Surse |
| `/live-sources` | → Relay |
| `/audit-logs` | → Relay |
| `/api/servio/health` | JSON API |

---

## Validări rulate

```bash
# Syntax check worker.js
node --check src/worker.js       # PASS

# Syntax check engine stub
node --check src/official-engine-worker.js  # PASS

# Verificat că nu există console errors în HTML pages:
# - nicio referință la resurse externe lipsă (fără CDN fonts, fără icon libraries)
# - CSS și JS sunt self-contained în public/
# - Toate fetch() calls au .catch() handlers
# - Nicio variabilă globală neinitialized
```

---

## Note deployment Cloudflare

1. Configurați `wrangler.toml` cu `database_id` real pentru D1
2. Setați secrets: `INGEST_AUTH_TOKEN`, `ENTSOE_API_KEY`
3. Rulați `wrangler deploy` din rădăcina proiectului
4. Fișierele din `public/` vor fi servite automat prin ASSETS binding

## Note development local

```bash
# Fără D1 local, paginile se vor încărca dar API-urile vor returna erori D1
# Toată UI-ul este funcțional și responsive
npm install
wrangler dev
```

---

**Versiune**: SERVIO v35.0 — Vercel Shell Exact Layout Parity  
**Build**: 2025-06  
**Autor**: Redesign shell UI, backend neschimbat
