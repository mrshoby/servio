# SERVIO v32.99 — Hybrid Official Source Relay + Local OPCOM Scheduler

## Scop

v32.98 a confirmat arhitectura corectă: GitHub Actions rulează cu succes și împinge date prin API-ul securizat SERVIO în D1. Testul real a arătat însă două probleme rămase:

- GitHub runner poate fi blocat de OPCOM la fel ca Cloudflare, deci `opcomRecords=0` în workflow.
- ENTSO-E poate fi complet pentru ziua curentă, dar D+1 poate rămâne parțial până la publicarea completă sau până la următorul retry.

v32.99 adaugă stratul practic lipsă: **Windows local scheduled relay**. Acesta rulează pe PC-ul tău, unde OPCOM a fost deja confirmat 96/96, și împinge tot prin API-ul securizat SERVIO. Deci datele intră în continuare prin API-ul nostru, nu manual în site.

## Ce adaugă

- `scripts/servio-official-source-ingestion-v3299.mjs`
  - aceeași logică GitHub/local pentru ENTSO-E + OPCOM + Transelectrica probe;
  - raport final cu `finalHealth` după push;
  - `relayMode`: `github-actions` sau `windows-local-task`;
  - opțional `--strict` dacă vrei exit code fail când finalul nu este 96/96.

- `scripts/RUN_SERVIO_V32_99_HYBRID_SOURCE_RELAY_LOCAL.ps1`
  - rulează relay-ul local pentru azi + mâine;
  - citește configurarea din `%APPDATA%\SERVIO\servio-v3299-relay-config.json`;
  - trimite OPCOM/ENTSO-E prin `/api/servio/ingest/*`.

- `scripts/INSTALL_SERVIO_V32_99_LOCAL_OPCOM_RELAY_TASK.ps1`
  - instalează Task Scheduler zilnic;
  - ore default: `11:45, 12:15, 13:15, 14:15, 15:15, 16:15, 17:15`;
  - poate rula imediat cu `-RunOnceNow`.

- `.github/workflows/servio-official-source-ingestion.yml`
  - Node 24;
  - retry-uri suplimentare;
  - folosește v3299 script.

- Worker:
  - versiune `v32.99-hybrid-official-source-relay`;
  - `/api/servio/relay/status`;
  - progres audit actualizat.

## Aplicare rapidă

```powershell
$ZipPath = "C:\Users\Vlad Taran\Downloads\SERVIO_v32_99_HYBRID_OFFICIAL_SOURCE_RELAY.zip"
$ExtractPath = "D:\SERVIO_v32_99_HYBRID_OFFICIAL_SOURCE_RELAY"
$RepoPath = "D:\01_digitalizare_automatizare\07_servio\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX"
$IngestSecret = "SVIO_v3298_R9mX7qP4tL2aH8zN6cV3bY5dK1sF0wE7uG4jT6pQ8rM2nB9xA"

Set-ExecutionPolicy -Scope Process Bypass -Force
if(Test-Path $ExtractPath){ Remove-Item $ExtractPath -Recurse -Force }
Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force
$Apply = Get-ChildItem $ExtractPath -Recurse -Filter "APPLY_SERVIO_V32_99_HYBRID_OFFICIAL_SOURCE_RELAY.ps1" | Select-Object -First 1
cd (Split-Path $Apply.FullName -Parent)
.\APPLY_SERVIO_V32_99_HYBRID_OFFICIAL_SOURCE_RELAY.ps1 -RepoPath $RepoPath -IngestSecret $IngestSecret -Deploy -GitPush -InstallLocalRelayTask
```

Dacă vrei să dai și token ENTSO-E în task local:

```powershell
$EntsoeToken = Read-Host "Token ENTSO-E"
.\APPLY_SERVIO_V32_99_HYBRID_OFFICIAL_SOURCE_RELAY.ps1 -RepoPath $RepoPath -IngestSecret $IngestSecret -EntsoeToken $EntsoeToken -Deploy -GitPush -InstallLocalRelayTask
```

## Test

```powershell
cd "D:\01_digitalizare_automatizare\07_servio\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX"
.\scripts\TEST_SERVIO_V32_99_HYBRID_RELAY_STATUS.ps1 -Url "https://servio.vlad-it-taran.workers.dev" -IngestSecret "SVIO_v3298_R9mX7qP4tL2aH8zN6cV3bY5dK1sF0wE7uG4jT6pQ8rM2nB9xA"
```

## Run manual local relay

```powershell
cd "D:\01_digitalizare_automatizare\07_servio\SERVIO_v32_77_UPLOADED_ELECTRICITY_DATA_LIVE_SYNC_FIX"
.\scripts\RUN_SERVIO_V32_99_HYBRID_SOURCE_RELAY_LOCAL.ps1
```

## Status sincer

- API SERVIO: 100% activ.
- GitHub Actions: activ, confirmat.
- ENTSO-E: activ, cu retry.
- OPCOM: GitHub/Cloudflare pot fi blocate; local relay rezolvă partea practică gratuită.
- Transelectrica: încă are nevoie de parser exact pe endpoint/export oficial; momentan rămâne bundled + probe.
