# SERVIO Harta Rețea v4.3 — ENTSO-E open-data provider

Build: `servio-grid-map-v4.3-entsoe-open-data`

## Ce adaugă peste v4.2.1

- Provider server-side ENTSO-E pentru `/api/servio/grid-map/live`.
- Dacă există `ELECTRICITY_MAPS_API_KEY`, Worker-ul folosește în continuare API-ul oficial Electricity Maps.
- Dacă nu există `ELECTRICITY_MAPS_API_KEY`, dar există `ENTSOE_API_TOKEN`, Worker-ul construiește Harta Rețea din ENTSO-E + OPCOM PZU GitHub cache.
- Dacă nu există niciun token, rămâne fallback demo realist.
- Cheile rămân exclusiv în backend/env; browserul nu primește tokenuri.

## Date live ENTSO-E implementate

Pentru `RO`, `HU`, `BG`, `RS`:

- `A75` + `A16`: actual generation per production type.
- `A65` + `A16`: actual total load.
- `A11`: cross-border physical flows pentru interconectările configurate.

Pentru `RO`:

- PZU / Day-Ahead rămâne din OPCOM GitHub cache, prin logica existentă.

Pentru `UA` și `MD`:

- Fallback demo/partial până la configurarea unei surse oficiale stabile.

## Secrete Cloudflare

Nu hardcoda tokenuri în repo.

```powershell
npx wrangler secret put ENTSOE_API_TOKEN --config .\wrangler.toml
```

Opțional, dacă ai licență Electricity Maps:

```powershell
npx wrangler secret put ELECTRICITY_MAPS_API_KEY --config .\wrangler.toml
```

## Verificări live efectuate local

- `/api/servio/grid-map/live?zone=RO` cu `ENTSOE_API_TOKEN` în memorie.
- Răspuns: `sourceMode: entsoe-open-data`, `status: live`.
- Zone live: `RO`, `HU`, `BG`, `RS`.
- Fluxuri live RO: `HU -> RO`, `BG -> RO`, `RS -> RO`.
- History: 96 intervale x 15 minute.
- Forecast fallback: 32 intervale x 15 minute.

## Limitări

- Carbon intensity este calculat local cu factori de emisii simpli pe mix ENTSO-E, nu cu metodologia proprietară Electricity Maps.
- ENTSO-E nu oferă mereu toate datele imediat; zonele fără date cad pe fallback demo/partial.
- Harta rămâne nativă SERVIO; nu copiază branding, assets, iconuri sau cod Electricity Maps.
