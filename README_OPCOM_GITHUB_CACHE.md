# SERVIO OPCOM PZU GitHub Cache

Acest patch face varianta fără VPS/local PC:

```text
OPCOM CSV oficial → GitHub Actions la 15 minute → data/opcom/pzu/latest.json → SERVIO Worker → Day-Ahead PZU
```

Fișiere adăugate:

```text
.github/workflows/opcom-pzu-cache.yml
scripts/fetch-opcom-pzu-cache.mjs
data/opcom/pzu/status.json
```

După push pe `main`, intră în GitHub → Actions → `OPCOM PZU GitHub Cache` → `Run workflow`.

Dacă merge, repo-ul va primi automat:

```text
data/opcom/pzu/latest.json
data/opcom/pzu/YYYY-MM-DD.json
data/opcom/pzu/status.json
```

SERVIO Worker citește implicit:

```text
https://raw.githubusercontent.com/mrshoby/servio/main/data/opcom/pzu/latest.json
```

sau poți suprascrie prin Cloudflare var:

```toml
[vars]
OPCOM_GITHUB_CACHE_URL = "https://raw.githubusercontent.com/mrshoby/servio/main/data/opcom/pzu/latest.json"
```

Statusuri corecte:

```text
sourceMode: external-cache-github  → OPCOM real din GitHub cache
sourceMode: external-live          → ENTSO-E / fetch direct
sourceMode: fallback-local         → nu e live, doar fallback
```
