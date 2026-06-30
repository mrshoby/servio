# SERVIO Harta Rețea v4.21 — Null finite mix values fix

Fix peste v4.20.

## Problemă
Electricity Maps returna payload real în `data.mix` și `activeTotal` era calculat corect, dar `firstFinite(null, valoareDerivată)` întorcea `0`, deoarece JavaScript `Number(null) === 0`. Astfel valorile reale derivate erau ignorate și zonele apăreau live cu `carbonIntensity: 0`, `renewablePct: 0`, `loadMw: 0`, `productionMw: 0`.

## Fix
- `firstFinite(...)` sare peste `null`, `undefined` și string gol.
- `firstNumber(...)` sare peste `null`, `undefined` și string gol.
- Păstrează modul v4.20 full-Europe single signal.
- Păstrează demo count 0, OPCOM PZU principal și ENTSO-E fallback pentru flows.

Build: `servio-grid-map-v4.21-null-finite-mix-values-fix`
