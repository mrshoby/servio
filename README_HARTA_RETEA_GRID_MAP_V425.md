# SERVIO v4.25 — Day-Ahead strict source fix

Build: `servio-grid-map-v4.25-dayahead-strict-source-fix`

Fix: selectorul Day-Ahead nu mai maschează OPCOM cu fallback ENTSO-E.

- Butonul OPCOM cere `/api/servio/day-ahead/pzu?source=opcom&strict=1`.
- Backendul returnează OPCOM cache/direct strict; dacă ultimul cache OPCOM este din altă zi, îl afișează explicit ca `external-cache-github-stale`, cu warning.
- Dacă OPCOM strict nu există deloc, nu mai afișează ENTSO-E sub etichetă OPCOM.
- Butonul ENTSO-E rămâne ENTSO-E A44 live/normalizat.
- Păstrează Harta Rețea v4.22, mouse-wheel zoom v4.23 și query/stat refresh v4.24.

Expected: statisticile OPCOM și ENTSO-E nu mai sunt identice decât dacă seriile reale sunt identice. Dacă OPCOM nu e disponibil, UI afișează warning/OPCOM cache stale, nu fallback ENTSO-E mascat.
