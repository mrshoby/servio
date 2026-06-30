# SERVIO Grid Map v4.7 — Day-Ahead unified PZU source fix

Fix pentru diferența mare OPCOM vs ENTSO-E din pagina Day-Ahead PZU.

Problema: butonul ENTSO-E din UI folosea încă endpoint-ul vechi `/api/servio/entsoe/day-ahead`, iar butonul OPCOM folosea `/api/servio/opcom/day-ahead`. Acest lucru putea produce comparații greșite: OPCOM din cache real/stale vs ENTSO-E vechi/fallback/92 intervale.

Fix: ambele butoane trec prin routerul unificat:

- OPCOM: `/api/servio/day-ahead/pzu?source=opcom`
- ENTSO-E: `/api/servio/day-ahead/pzu?source=entsoe`

Routerul unificat folosește:
- OPCOM GitHub cache doar dacă este proaspăt și complet 96/96;
- ENTSO-E A44 cu zi locală România convertită în UTC;
- fallback local doar dacă ambele surse pică.

Build: `servio-grid-map-v4.7-dayahead-unified-pzu-source-fix`.
