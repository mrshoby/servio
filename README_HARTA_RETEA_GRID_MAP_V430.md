# SERVIO Grid Map v4.30 — Admin Data Learning Center

Patch peste v4.29.

## Ce adaugă

- `Data Learning Center` în Settings, vizibil doar pentru admin.
- Upload multiplu pentru fișiere de training: CSV, TXT, HTML, XLS, XLSX.
- Detecție inițială:
  - consum / producție / consum + producție / import-export / PVGIS / invertor;
  - granularitate 15m / 60m / necunoscut;
  - vendor/source: DEER, Delgaz, PVGIS, FusionSolar, Solis, Fronius, SMA, SolarEdge, Generic;
  - layout: vertical table, matrix day by interval, metadata plus table, multi-table;
  - sheet mode: single_sheet, monthly_sheets, daily_sheets, multi_table_sheet;
  - header row estimat.
- Preview pentru fișiere text/csv/html.
- Salvare locală ca template de bază.

## Păstrează

- Auth/Login/UserMenu din v4.29.
- Loading screen v4.27 cu spinner orange.
- Settings fără vechile carduri `Surse de date · OPCOM & ENTSO-E` și `Conformitate`.
- Overview fără `Necesită atenție`.
- BESS v4.28 curățat.
- Day-Ahead OPCOM/ENTSO-E strict.
- Harta Rețea live, mouse wheel zoom și flow inspector.

## Observație

v4.30 este primul pas din sistemul de învățare. Detecția avansată pentru workbook-uri reale XLSX multi-sheet, sheeturi lunare/zilnice și zone multiple de date este planificată în buildurile următoare.
