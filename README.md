# SERVIO Cloudflare Worker — v4.24

Build: `servio-grid-map-v4.25-dayahead-strict-source-fix`

Patch peste v4.23. Repară statisticile Day-Ahead la comutarea OPCOM / ENTSO-E și păstrează Harta Rețea live + zoom wheel.


## v4.25 Day-Ahead strict source fix

OPCOM selector is strict (`strict=1`) and no longer displays ENTSO-E fallback under OPCOM labels. Stale OPCOM cache is explicit via `external-cache-github-stale`.
