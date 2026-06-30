# SERVIO Grid Map v4.14 — Live Flow Arrows on v4.13 Stable

Build: `servio-grid-map-v4.14-live-flow-arrows-on-v413-stable`

Implementare din fișierul încărcat `servio-main-harta-retea-v47-live-flow-arrows.zip`, portată peste linia stabilă SERVIO v4.13.

## Ce adaugă din fișierul nou

- Harta Rețea cu săgeți live import/export pe SVG.
- Fluxuri ENTSO-E afișate ca `from → to · MW`.
- Linie animată, arrowhead la destinație, punct exportator și punct importator.
- Etichete limitate vizual pentru a evita aglomerarea.
- Hover/click inspector pe țări și fluxuri.
- Păstrează harta geografică, fără carduri vechi pe hartă.

## Ce se păstrează din v4.13/v4.10

- Fix pagina albă: `/app.jsx` embedded în `src/worker.js` este actualizat, nu doar `public/Servio.jsx`.
- Endpointuri Day-Ahead unificate:
  - `/api/servio/day-ahead/pzu?source=opcom`
  - `/api/servio/day-ahead/pzu?source=entsoe`
- OPCOM GitHub cache ca sursă principală PZU România.
- ENTSO-E A44 92/96 → 96 partial-normalized, fără fallback demo fals.
- Loader anti-white-page din v4.11.
- Shell/UI Claude existent, fără shell nou.

## Validări locale

- `node --check src/worker.js`
- `node --check scripts/fetch-opcom-pzu-cache.mjs`
- `node scripts/check-servio-jsx-syntax-marker.mjs`
