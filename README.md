# SERVIO v4.30

Build: `servio-grid-map-v4.30-admin-data-learning-center`

Primul build din roadmapul Energy Data Learning OS.

- adaugă în Settings secțiunea admin-only `Data Learning Center`;
- permite upload multiplu de fișiere de training CSV/TXT/HTML/XLS/XLSX;
- face detecție inițială pentru tip date, vendor, granularitate, sheet mode, layout și header row;
- permite salvarea locală a unui format detectat ca template de bază;
- păstrează shell-ul SERVIO, Auth/Login/UserMenu, Day-Ahead strict, Harta Rețea live, BESS curățat și loading screen-ul cu spinner orange.

Notă: v4.30 este fundația UI/parser-local. Buildurile următoare extind detecția reală de workbook/sheet/layout pentru XLSX multi-sheet.
