# SERVIO Grid Map v4.9 — ENTSO-E A44 92/96 interval normalization

Build:

`servio-grid-map-v4.9-entsoe-a44-92-interval-normalization`

Fix pentru Day-Ahead PZU / ENTSO-E:

- ENTSO-E A44 pentru România poate returna 92/96 intervale pe fereastra locală România.
- SERVIO nu mai declară sursa indisponibilă inutil dacă seria este normalizabilă.
- Parsează perioada XML ENTSO-E (`Period/timeInterval/start/end`) și rezoluția.
- Normalizează seria ENTSO-E la 96 intervale de 15 minute fără fallback demo local.
- Marchează clar răspunsul ca `external-live-partial-normalized` când a completat marginile lipsă.
- Include diagnostic: `entsoeRawIntervals`, `entsoeNormalizedIntervals`, `entsoeInsertedBefore`, `entsoeInsertedAfter`, `entsoeOffsetIntervals`, `entsoeNormalization`.
- Repară parserul CSV OPCOM ca să nu mai împartă greșit virgulele zecimale din CSV-ul românesc.

Important:

- OPCOM rămâne sursa principală când GitHub cache este fresh.
- ENTSO-E rămâne sursă de comparație/backup, dar nu mai afișează fallback fals 278/1025/581.
