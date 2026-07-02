# SERVIO Grid Map v4.24 — Day-Ahead source statistics fix

Patch peste v4.23.

Fix principal:
- Day-Ahead PZU schimbă corect statisticile când comuți între OPCOM și ENTSO-E.
- Frontendul nu mai adaugă `?day=today` peste un endpoint care conține deja `?source=...`; folosește separatorul corect `&`.
- Requesturile Day-Ahead sunt no-store și au cache-buster per sursă.
- KPI-urile, graficul și tabelul au key legat de sursă/zi/request ca să nu rămână randate cu seria veche.

Păstrat:
- v4.23 mouse wheel zoom în Harta Rețea.
- v4.22 flow inspector UI.
- v4.21 24/25 zone live, 0 demo, mix values reale.
- OPCOM PZU principal, ENTSO-E A44 comparație/fallback.
