# SERVIO v4.35 — Metadata Extraction Trainer

Build: `servio-grid-map-v4.35-metadata-extraction-trainer`

Peste v4.34 adaugă în Data Learning Center un Metadata Extraction Trainer admin-only.

Include:

- detecție și mapare metadate din zone text/celule din fișiere energetice;
- câmpuri pentru Client, Locație, POD, Contor, Perioadă, Unitate, Distribuitor, Putere instalată, Data raportului și Tip fișier;
- candidați de metadate extrași din regiuni înainte de tabel, zone metadata_plus_table și preview-uri din sheeturi;
- corectare manuală din UI;
- salvare în importTemplate prin `metadataMap` și `metadataPatterns`;
- păstrează workbook/sheet detection v4.31, layout detection v4.32, file type detection v4.33 și column/matrix mapping v4.34.

Nu modifică shell-ul Claude/SERVIO, Auth/Login/UserMenu, Day-Ahead strict, Harta Rețea live sau BESS v4.28.
