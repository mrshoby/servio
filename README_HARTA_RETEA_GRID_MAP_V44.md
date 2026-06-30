# SERVIO Harta Rețea v4.4 — topologie ENTSO-E extinsă

Build: `servio-grid-map-v4.4-europe-entsoe-topology`

## Ce adaugă peste v4.3

- Harta nu mai este limitată la `RO`, `HU`, `BG`, `RS`.
- UI-ul afișează 25 zone: `RO`, `HU`, `BG`, `RS`, `UA`, `MD`, `AT`, `CZ`, `SK`, `PL`, `DE`, `FR`, `NL`, `BE`, `CH`, `IT`, `SI`, `HR`, `BA`, `ME`, `GR`, `MK`, `AL`, `ES`, `PT`.
- Providerul ENTSO-E interoghează implicit 21 zone live: toate zonele de mai sus care au acoperire stabilă în ENTSO-E, fără `UA`, `MD`, `MK`, `AL`.
- Fluxurile nu mai sunt doar către România. Worker-ul interoghează implicit 20 muchii ENTSO-E între zone vecine: România, Ungaria, Bulgaria, Serbia, Austria, Slovacia, Croația, Balcani și conexiuni Europa Centrală.
- Net import/export se calculează pentru fiecare zonă din fluxurile disponibile, nu doar pentru zona selectată.
- Fallback-ul demo are aceeași hartă extinsă: 25 zone și 24 fluxuri demo.

## Configurare acoperire

Cheile rămân numai în backend/env.

```powershell
npx wrangler secret put ENTSOE_API_TOKEN --config .\wrangler.toml
```

Opțional, pentru licență oficială Electricity Maps:

```powershell
npx wrangler secret put ELECTRICITY_MAPS_API_KEY --config .\wrangler.toml
```

Cap-uri configurabile pentru a evita rate-limit/timeouts:

- `GRID_MAP_MAX_ENTSOE_ZONES` — default `21`, maxim `23`.
- `GRID_MAP_MAX_ENTSOE_FLOW_EDGES` — default `20`, maxim `43`.

## Verificări locale v4.4

- `/api/servio/grid-map/live?zone=RO` cu token ENTSO-E doar în memorie.
- Răspuns live: `sourceMode: entsoe-open-data`, `status: live`.
- Zone totale: 25.
- Zone live ENTSO-E implicite: 21.
- Fluxuri live returnate în test: 19.
- Fallback fără cheie: 25 zone, 24 fluxuri demo, fără crash.
- Responsive verificat:
  - desktop: 25 zone, 18 fluxuri vizibile, 9 KPI, 7 charts, 5 tables, fără overflow orizontal;
  - tablet 820px: KPI pe 2 coloane, hartă/panel într-o coloană, fără overflow;
  - mobile 390px: hartă compactă, KPI pe 2 coloane, fără overflow.

## Limitări corecte

- Carbon intensity este calculat de SERVIO din mixul ENTSO-E cu factori de emisii simpli; nu reproduce metodologia proprietară Electricity Maps.
- Unele zone pot avea fluxuri live, dar load/generation indisponibile pe fereastra curentă. UI-ul le marchează `demo-fallback`, `partial` sau `stale`, fără să oprească pagina.
- `UA` și `MD` rămân fallback până există adapter oficial stabil.
- Implementarea urmărește paritate funcțională, nu copiere vizuală, cod, branding sau assets Electricity Maps.
