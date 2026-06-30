# SERVIO v4.7 — Day-Ahead unified PZU source fix

Acest patch repară comparația OPCOM vs ENTSO-E din pagina Day-Ahead PZU.

Build: `servio-grid-map-v4.7-dayahead-unified-pzu-source-fix`

Schimbări cheie:
- UI Day-Ahead nu mai cheamă endpoint-urile vechi separate pentru OPCOM/ENTSO-E.
- Ambele butoane folosesc `/api/servio/day-ahead/pzu` cu `source=opcom` sau `source=entsoe`.
- Endpoint-ul unificat aplică aceleași reguli de 96 intervale, zi locală România și fallback controlat.
- ENTSO-E nu mai poate afișa curba fallback-local veche când trebuie comparat cu OPCOM.
