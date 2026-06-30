# SERVIO Grid Map v4.12 — White Page Endpoints Syntax Fix

Build: `servio-grid-map-v4.12-white-page-endpoints-syntax-fix`

Fix punctual pentru pagina albă din Cloudflare Worker:

- repară virgula lipsă din `public/Servio.jsx` în obiectul `ENDPOINTS`;
- păstrează loaderul v4.11;
- păstrează Harta Rețea v4.5/v4.10, ENTSO-E A44 92→96 și OPCOM GitHub cache;
- nu schimbă shell-ul Claude, sidebar, topbar, design tokens sau layoutul global;
- adaugă guard local `scripts/check-servio-jsx-syntax-marker.mjs` ca bugul să nu mai treacă prin apply.

Eroarea reparată:

```text
Unexpected token, expected "," (138:2)
```

Linia corectă:

```js
dayAheadEntsoe: "/api/servio/day-ahead/pzu?source=entsoe",
intraday: "/api/servio/opcom/intraday",
```
