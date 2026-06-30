# Harta Retea v4.22 - Live More Countries + Flow Inspector

Build: `servio-grid-map-v4.22-live-more-countries-flow-inspector`

## Baza folosita

Aceasta versiune este aplicata peste `servio-grid-map-v4.21-null-finite-mix-values-fix`, pastrand configuratia ENTSO-E existenta pentru mai multe tari live si fixul pentru valori `null` / finite in mixul energetic.

## Ce adauga

- Cardul de hover/click pe tara include acum fluxurile directe ale tarii:
  - `Primeste` - total import live si primele conexiuni care trimit energie catre tara.
  - `Da` - total export live si primele conexiuni catre care tara trimite energie.
- Sagetile de flow conectate la tara inspectata sunt evidentiate.
- Sagetile fara legatura cu tara inspectata sunt estompate.
- Layout responsive: blocul `Primeste/Da` este pe doua coloane pe desktop si o coloana pe telefon.

## Ce nu s-a schimbat

- Nu s-a modificat shell-ul aplicatiei.
- Nu s-au schimbat sidebar-ul, topbar-ul, tema globala sau cardurile generale.
- Nu s-au schimbat domeniile ENTSO-E, ordinea de tari, provider fallback, flows provider sau logica backend de live data din v4.21.
- Cheia ENTSO-E ramane exclusiv in backend/env si nu este scrisa in client.

## Verificari

- `public/Servio.jsx` compileaza prin esbuild.
- `src/worker.js` se importa corect ca modul.
- Worker-ul embedded contine `gridhoverflows`, `related` si `muted`.
- Configuratia `GRID_ENTSOE_ZONES` si variabilele `GRID_MAP_MAX_ENTSOE_ZONES` / `GRID_MAP_MAX_ENTSOE_FLOW_EDGES` sunt pastrate.

