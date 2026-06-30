# SERVIO Grid Map v4.10 — ENTSO-E A44 force-normalize partial RO day

Build: `servio-grid-map-v4.10-entsoe-a44-force-normalize-partial`

Fix pentru cazul real observat: ENTSO-E A44 România returnează 92/96 intervale, tokenul este valid, dar normalizarea v4.9 respingea seria ca indisponibilă.

Schimbări:
- acceptă serii A44 parțiale >= 1 interval și normalizează robust la 96;
- pentru offset XML absurd, ignoră offsetul și păstrează secvența reală ENTSO-E;
- pentru 92/96 completează doar cele 4 intervale lipsă, fără fallback demo;
- expune diagnostic: rawOffset, offsetIgnored, placedIntervals, normalizationMethod.
