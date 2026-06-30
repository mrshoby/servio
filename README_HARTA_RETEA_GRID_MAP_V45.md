# SERVIO Harta Rețea v4.5 — ENTSO-E hover inspector

Build: `servio-grid-map-v4.5-entsoe-hover-inspector`

## Clarificare surse

Electricity Maps folosește parsere și surse oficiale multiple. Pentru multe zone europene, inclusiv România, Ungaria, Serbia, Germania, Grecia, Polonia, Portugalia, Spania, Slovacia, Slovenia și altele, sursa listată public este ENTSO-E. Alte zone folosesc TSO local sau alt open-data oficial.

SERVIO v4.5 este configurat să folosească ENTSO-E ca sursă primară pentru modulul Harta Rețea:

- `A75 / A16` pentru generation per production type.
- `A65 / A16` pentru actual total load.
- `A11` pentru cross-border physical flows.
- OPCOM cache pentru PZU România.

Ordinea providerilor pentru Harta Rețea este ENTSO-E-first. Dacă există și `ENTSOE_API_TOKEN` și `ELECTRICITY_MAPS_API_KEY`, Worker-ul folosește ENTSO-E. Electricity Maps poate fi forțat doar explicit cu `GRID_MAP_PROVIDER=electricity-maps`.

Carbon intensity nu este furnizat direct de ENTSO-E ca semnal final. În SERVIO este calculat din mixul ENTSO-E și factori de emisii simpli, marcat explicit ca `calculat SERVIO din mix ENTSO-E`.

## Ce adaugă peste v4.4

- Payload-ul zonelor live include acum `powerBreakdownMw`, adică MW pe sursă din ENTSO-E, nu doar procente.
- Hover/click pe o țară afișează un inspector complet:
  - nume zonă și cod;
  - status și calitate date;
  - carbon intensity;
  - renewable %, carbon-free %, fossil %;
  - load, production, net import/export;
  - top 5 surse din mix în MW și %;
  - PZU dacă există;
  - timestamp;
  - sursă date.
- Hover/click pe un flux afișează:
  - direcție;
  - MW;
  - status;
  - timestamp;
  - mențiune ENTSO-E `A11`.
- Interacțiunea este mai robustă: `mouseenter`, `pointerenter`, `focus` și `click` deschid inspectorul.

## Verificări locale v4.5

- `node --check src/worker.js`: ok.
- API live ENTSO-E cu token doar în memorie: 25 zone, 18 fluxuri live în test.
- România live include `powerBreakdownMw`, de exemplu hidro/gaz/cărbune/solar în MW.
- UI live: `sourceMode: entsoe-open-data`.
- Click pe România deschide inspectorul cu 6 metrici principale și 5 surse mix.
- Fără overflow orizontal în testul desktop.
- Tokenul ENTSO-E nu este salvat în repo.

## Limitări

- Nu copiem metodologia proprietară Electricity Maps pentru carbon intensity și flow tracing.
- Pentru paritate strictă ENTSO-E, valorile brute sunt load, generation per type și flows; carbon intensity rămâne calcul SERVIO.
- Zone fără date ENTSO-E stabile rămân fallback/demo/partial, fără crash.
