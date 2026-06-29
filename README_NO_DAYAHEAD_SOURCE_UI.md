# SERVIO patch — Day-Ahead fără afișări de status/sursă

Build patch: `claude-good-bess-db-pzu-github-cache-v3.2-no-dayahead-source-ui`

Schimbări UI:
- elimină bannerul/warning-ul de sursă live/fallback din Day-Ahead PZU;
- elimină badge-ul `Fallback local` / `GitHub cache` / `Live real`;
- elimină textul vizibil `OPCOM PZU` / `ENTSO-E Transparency` de lângă badge;
- elimină sursa din titlul graficului;
- păstrează doar selectorul OPCOM / ENTSO-E, KPI-urile, graficul și tabelul.

Verificarea sursei se face în terminal prin endpoint-uri API, nu în UI.
