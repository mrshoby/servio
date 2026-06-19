# SERVIO v32.98 — GitHub Official Source Ingestion API

## Scop

v32.98 mută ingestia oficială într-un flux controlat de noi:

```text
GitHub Actions / relay gratuit
  -> ENTSO-E API cu token
  -> OPCOM CSV oficial din runner/relay, nu din Cloudflare Worker
  -> Transelectrica official-source probe/status
  -> POST securizat în SERVIO API
  -> Cloudflare D1
  -> SERVIO Worker/API/site
```

Astfel SERVIO rămâne API-ul central, dar nu mai depinde de fetch direct OPCOM din Cloudflare, care a fost blocat cu 403.

## Ce adaugă

- `POST /api/servio/ingest/market-records`
- `POST /api/servio/ingest/opcom`
- `POST /api/servio/ingest/entsoe`
- `POST /api/servio/ingest/transelectrica`
- `GET /api/servio/ingest/status`
- GitHub Actions workflow: `.github/workflows/servio-official-source-ingestion.yml`
- Node relay script: `scripts/servio-official-source-ingestion-v3298.mjs`
- Local runner script: `scripts/RUN_SERVIO_V32_98_OFFICIAL_SOURCE_INGESTION_LOCAL.ps1`
- Secret helper: `scripts/SET_SERVIO_V32_98_GITHUB_SECRETS_EXAMPLE.ps1`
- Test script: `scripts/TEST_SERVIO_V32_98_SECURE_INGEST_API.ps1`

## Secrete necesare

În Cloudflare Worker:

```powershell
cd "D:\01_digitalizare_automatizare\07_servio\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX"
$secret = "<secret-lung-random>"
$secret | npx wrangler secret put SERVIO_INGEST_SECRET
```

În GitHub repo, la **Settings → Secrets and variables → Actions**:

```text
SERVIO_INGEST_SECRET = același secret ca în Cloudflare Worker
SERVIO_URL = https://servio.vlad-it-taran.workers.dev
ENTSOE_API_TOKEN = tokenul tău ENTSO-E
```

Opțional, la GitHub Variables:

```text
SERVIO_EUR_RON = 5.23
TRANSELECTRICA_BALANCING_URLS = listă URL-uri separate prin virgulă
```

## Aplicare locală

```powershell
cd "D:\SERVIO_v32_98_GITHUB_OFFICIAL_SOURCE_INGESTION_API"
Set-ExecutionPolicy -Scope Process Bypass -Force

.\APPLY_SERVIO_V32_98_GITHUB_OFFICIAL_SOURCE_INGESTION_API.ps1 `
  -RepoPath "D:\01_digitalizare_automatizare\07_servio\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX" `
  -IngestSecret "<secret-lung-random>" `
  -Deploy
```

## Test API ingest

```powershell
$Url = "https://servio.vlad-it-taran.workers.dev"
cd "D:\01_digitalizare_automatizare\07_servio\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX"
.\scripts\TEST_SERVIO_V32_98_SECURE_INGEST_API.ps1 -Url $Url -IngestSecret "<secret-lung-random>"
```

## Rulare locală relay

```powershell
.\scripts\RUN_SERVIO_V32_98_OFFICIAL_SOURCE_INGESTION_LOCAL.ps1 `
  -Url "https://servio.vlad-it-taran.workers.dev" `
  -From "2026-06-19" `
  -To "2026-06-19" `
  -Source "all" `
  -IngestSecret "<secret-lung-random>" `
  -EntsoeToken "<token-entsoe>"
```

## GitHub Actions

Workflow-ul rulează automat la minutul 8 și 38 al fiecărei ore. Se poate porni și manual din tab-ul **Actions** cu `workflow_dispatch`.

## Status implementare

- ENTSO-E live cu token: implementat în relay și Worker.
- OPCOM live: implementat prin relay/GitHub runner/local import, apoi push securizat în SERVIO API. Cloudflare direct rămâne fallback diagnostic deoarece OPCOM blochează Cloudflare cu 403.
- Transelectrica: v32.98 include source-health/probe pentru paginile oficiale și păstrează datele bundled validate; parserul exact live se finalizează când endpointul/documentul oficial stabil este confirmat.

## Progres

```text
SERVIO Secure Ingest API: 100%
GitHub Actions ingestion relay: 96%
ENTSO-E token ingestion: 96–100% după verificarea următorului run live
OPCOM ingestion through relay/API: 96–100% dacă GitHub runner nu este blocat de OPCOM
Transelectrica live parser: 88%, surse oficiale identificate, parser exact rămâne next build
```
