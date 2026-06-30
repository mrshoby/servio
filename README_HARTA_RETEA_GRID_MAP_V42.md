# SERVIO Harta Rețea v4.2 — Functional parity module

Build: `servio-grid-map-v4.2-functional-parity`

## Ce include

- Păstrează shell-ul SERVIO existent: fără sidebar, topbar, wrapper, temă sau card system nou.
- Ruta existentă `/harta-retea` randă `HartaReteaPage` în același conținut principal.
- Fallback demo realist pentru România, Ungaria, Bulgaria, Serbia, Ucraina și Moldova.
- Hartă interactivă cu zone selectabile, hover, click, fluxuri, zoom și pan.
- Layer switcher: carbon intensity, mix energetic, renewable %, carbon-free %, flows, load, production, PZU/day-ahead, forecast.
- Timeline controls: Live, ultimele 24h, Forecast, slider pe intervale de 15 minute și refresh periodic live.
- KPI cards compacte pentru carbon, renewable, carbon-free, net import/export, production, load, dominant source, PZU și ultima actualizare.
- Panou detalii zonă cu mix, calitatea datelor, sursă, warning demo/partial/stale.
- Grafice Recharts native pentru carbon 24h, renewable/carbon-free, import/export/load, PZU, mix 24h și forecast.
- Istoric demo/API normalizat la 96 intervale de 15 minute pentru ultimele 24h.
- Comparație între zone pentru carbon, renewable și load/producție.
- Tabele native cu sortare/filtrare/stări pentru zone, mix, flows, forecast și price.
- Endpointul intern `/api/servio/grid-map/live` rămâne punctul de integrare; cheia API nu se expune în client.

## Verificări efectuate

- `node --check src/worker.js`
- `node --check scripts/fetch-opcom-pzu-cache.mjs`
- `public/Servio.jsx` verificat prin esbuild JSX.
- Browser responsive smoke test: desktop 1366x900, tablet 820x1100, mobile 390x844.
- Anti-duplicate runtime: 1 sidebar, 1 topbar, 1 item Harta Rețea, fără overflow orizontal.

## Limitări

- Datele live complete necesită `ELECTRICITY_MAPS_API_KEY` sau un adapter open-data echivalent.
- Demo/forecast sunt structurate pentru API real, dar nu reprezintă măsurători oficiale.
- Harta este nativă/funcțională, nu copiază assets, branding sau identitate vizuală Electricity Maps.
