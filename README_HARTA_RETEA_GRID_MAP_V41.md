# SERVIO Harta Rețea v4.1 — Grid data normalization

Build: `claude-good-bess-db-grid-map-v4.1-grid-data-normalization`

Fixes over v4.0:
- PZU price in Harta Rețea is no longer taken from Electricity Maps as Lei/MWh. For RO it uses the OPCOM GitHub cache current 15-minute interval.
- Electricity Maps flows are normalized from import/export breakdowns and invalid `RO -> ? / 0 MW` rows are filtered out.
- Neighbor zones are queried with lightweight Electricity Maps latest signals; if unavailable they remain estimated/demo, not falsely marked as fully live.
- `apiCoverage` now reports per-zone coverage and OPCOM price source separately.
- UI keeps the existing SERVIO shell and only updates the Harta Rețea content.
