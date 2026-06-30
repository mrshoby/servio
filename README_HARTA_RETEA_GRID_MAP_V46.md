# SERVIO — Harta Rețea v4.6 OPCOM 403 + ENTSO-E PZU fallback

Build: `servio-grid-map-v4.6-opcom-403-entsoe-pzu-fallback`

Scop:
- păstrează Harta Rețea v4.5 ENTSO-E hover inspector;
- nu modifică shell-ul Claude JSX;
- repară problema GitHub Actions `OPCOM HTTP 403`;
- nu mai lasă workflow-ul roșu când OPCOM blochează runner-ul GitHub;
- păstrează ultimul `latest.json` bun și scrie status clar;
- SERVIO folosește automat ENTSO-E A44 ca fallback PZU live când OPCOM cache este indisponibil sau stale.

Schimbări:
1. `scripts/fetch-opcom-pzu-cache.mjs`
   - dacă OPCOM returnează 403, `latest.json` nu este suprascris;
   - `status.json` primește `ok:false`, `status: opcom-unavailable-preserve-last-cache`, `stale:true`;
   - workflow-ul iese cu cod 0 pentru ca schedule-ul să nu rămână eșuat în GitHub Actions.

2. `.github/workflows/opcom-pzu-cache.yml`
   - Node.js actualizat la 24;
   - workflow-ul poate rula programat fără să pice la fiecare 403 OPCOM.

3. `src/worker.js`
   - build version v4.6;
   - `fetchOpcomDayAheadGithubCache(...)` respinge cache-ul stale pentru `today`;
   - nou fallback `fetchPzuDayAheadBestAvailable(...)`:
     OPCOM GitHub cache/direct → ENTSO-E A44 live → fallback local doar dacă pică ambele;
   - `/api/servio/opcom/day-ahead` și `/api/servio/day-ahead/pzu?source=opcom` folosesc fallback ENTSO-E A44, nu fallback local imediat.

Important:
- Patch-ul NU mai copiază `data/opcom/pzu/*.json` peste repo. Acele fișiere sunt generate de GitHub Actions și nu trebuie resetate de build.
