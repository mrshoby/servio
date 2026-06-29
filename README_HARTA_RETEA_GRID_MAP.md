# SERVIO Harta Rețea — Grid Map v4.0

Build: `claude-good-bess-db-grid-map-v4.0-electricitymaps-ready`

## Ce include
- Modul nativ `Harta Rețea` integrat în shell-ul existent, fără sidebar/topbar/wrapper nou.
- Rută SPA `/harta-retea` și `/grid-map`.
- Componente: `MapView`, `GridNetworkMap`, `GridZoneDetailsPanel`, `GridKpiCards`, `GridMapLegend`, `GridSignalsCharts`, `GridZonesTable`.
- Adapter frontend `electricityMapsAdapter` și service `gridMapService`.
- Endpoint backend securizat `/api/servio/grid-map/live`.
- Fallback demo realist dacă `ELECTRICITY_MAPS_API_KEY` lipsește.

## Secrete Cloudflare recomandate
```powershell
npx wrangler secret put ELECTRICITY_MAPS_API_KEY --config .\wrangler.toml
```

Variabile opționale în `wrangler.toml`:
- `ELECTRICITY_MAPS_BASE_URL=https://api.electricitymap.org`
- `ELECTRICITY_MAPS_DEFAULT_ZONE=RO`

## Verificări
```powershell
npm run check
Invoke-RestMethod "https://servio.vlad-it-taran.workers.dev/api/servio/grid-map/live?zone=RO" | ConvertTo-Json -Depth 8
```
