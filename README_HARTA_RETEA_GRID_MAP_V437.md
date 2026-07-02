# SERVIO v4.37 — Smart Parser Runtime

Build: `servio-grid-map-v4.37-smart-parser-runtime`

Adaugă peste v4.36 un runtime local pentru compararea fișierelor noi cu template-urile active din Data Learning Center.

## Inclus

- `SMART_PARSER_ACTION_LABELS`
- `scoreLearningTemplateMatch(...)`
- `getLearningSmartParserRuntime(...)`
- panou UI `Smart Parser Runtime` pentru fiecare fișier de training
- decizie parser:
  - peste 90%: import automat
  - 70–90%: confirmare template
  - sub 70%: mapare manuală
  - fără template activ: fără template activ
- scor matching după tip fișier, data kind, vendor, granularitate, sheet mode, layout, header, sheet signature, column map și metadata map
- test template actualizat cu scor runtime real

## Păstrat

- shell-ul Claude/SERVIO existent
- Auth/Login/UserMenu v4.29
- Data Learning Center admin-only
- Template Registry v4.36
- Metadata Extraction v4.35
- Column & Matrix Mapping v4.34
- File Type Detection v4.33
- Layout Detection v4.32
- Workbook & Sheet Detection v4.31
- Day-Ahead strict OPCOM/ENTSO-E
- Harta Rețea live
- BESS curățat v4.28

## Verificare

`npm run check` trebuie să afișeze `SERVIO v4.37 smart parser runtime guards OK.`
