# SERVIO Grid Map v4.8 — ENTSO-E A44 robust + no fake local fallback

Fix pentru diferențele false OPCOM vs ENTSO-E din Day-Ahead PZU.

## Ce repară

- `source=entsoe` nu mai cade silențios pe curba locală demo/fallback.
- ENTSO-E A44 încearcă mai multe ferestre UTC valide pentru ziua locală România.
- Răspunsul include `entsoeAttempts`, `entsoePeriodStartUtc`, `entsoePeriodEndUtc`, `entsoePeriodMode`.
- Dacă ENTSO-E nu returnează 96 intervale, endpoint-ul întoarce `sourceMode: external-live-unavailable`, nu valori false.
- OPCOM rămâne sursa principală când GitHub cache este fresh.
- Dacă OPCOM este indisponibil, fallback-ul pentru OPCOM folosește ENTSO-E live, nu fallback local, dacă ENTSO-E merge.

## Build

`servio-grid-map-v4.8-entsoe-a44-robust-no-fake-fallback`
