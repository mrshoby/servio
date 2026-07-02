# SERVIO v4.42.3 — Data Learning Center KPI-only Settings Cleanup

Build intermediar peste v4.42 Combined Dataset Analyzer FINAL.

Schimbare principală:
- Settings · Data Learning Center afișează doar dashboardul de statistici/KPI-uri și upload-ul admin.
- Fișierele uploadate, numele lor, sheeturile, preview-urile, warningurile, registry-ul și mapările nu mai sunt randate pe pagină.
- Motorul intern de training rămâne în cod: workbook/sheet/layout detection, mapping drafts, metadata extraction, quality profile, consumption/production/combined profiles și template objects rămân în localStorage/back-end logic.

Păstrat:
- shell-ul SERVIO / Claude dark professional;
- Auth/Login/UserMenu v4.29;
- Day-Ahead OPCOM/ENTSO-E strict;
- Harta Rețea live;
- BESS v4.28;
- Energy Lab clean;
- Combined Dataset Analyzer v4.42 și regula real vs estimat.
