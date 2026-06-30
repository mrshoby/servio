# SERVIO Grid Map v4.15 — Electricity Maps first, no fake demo grid

- Provider implicit pentru Harta Rețea: Electricity Maps API, ca să fie apropiat de `app.electricitymaps.com/map/live/fifteen_minutes`.
- Folosește endpointuri Electricity Maps v4 pentru carbon intensity, renewable, carbon-free, electricity mix, total load și electricity flows cu `temporalGranularity=15_minutes`.
- Zonele fără răspuns live sunt marcate `unavailable`, nu umplute cu valori demo.
- Fluxurile live sunt colectate pentru mai multe zone și deduplicate ca să apară mai multe săgeți reale pe hartă.
- OPCOM rămâne sursa principală pentru PZU România.
- ENTSO-E rămâne fallback pentru grid/PZU dacă nu există cheia Electricity Maps.
- Păstrează v4.13 white page fix și v4.14 live flow arrows.
