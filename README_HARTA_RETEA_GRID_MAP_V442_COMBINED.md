# SERVIO v4.42 — Combined Dataset Analyzer FINAL

Build ID: `servio-grid-map-v4.42-combined-dataset-analyzer-final`

## Scope

Roadmap build pentru **SERVIO Energy Data Learning OS**: Combined Dataset Analyzer.

Input acceptat:
- consum + producție;
- import/export;
- full balance.

Calcule:
- autoconsum estimat/real;
- surplus;
- import;
- export;
- acoperire consum;
- grad autoconsum / utilizare PV locală;
- balanță energetică.

Regulă critică:
- dacă fișierul nu conține import/export, SERVIO nu marchează exportul sau autoconsumul ca real;
- pentru consum + producție fără import/export, SERVIO afișează explicit `autoconsum estimat`, `surplus estimat` și `deficit estimat`;
- export/import real apar doar când există coloane reale de import/export.

## Preservări obligatorii

Păstrate:
- shell-ul global dark professional Energy Market OS;
- sidebar/topbar/cards/layout/design tokens;
- Auth/Login/UserMenu v4.29;
- Day-Ahead OPCOM/ENTSO-E strict;
- Harta Rețea live;
- BESS curățat v4.28;
- Data Learning Center admin-only;
- Energy Lab clean upload workspace;
- fără debugging text / JSON brut în UI;
- fără secțiuni eliminate reintroduse.

## Validare

`npm run check` trece cu guarduri pentru:
- combined analyzer;
- import/export mode;
- real vs estimated rule;
- surplus/deficit/balanță energetică;
- Auth;
- Day-Ahead strict;
- Harta Rețea live;
- Energy Lab clean.
