# SERVIO Harta Rețea v4.20 — Electricity Maps Mix Payload Parser Fix

Fix peste v4.19: păstrează strategia full-Europe single-signal, dar repară parserul pentru payloadurile `electricity-mix/latest`.

## De ce era nevoie
v4.19 încărca 24/25 zone ca `live`, dar valorile erau 0 pentru carbon, renewable, carbon-free și load. Asta înseamnă că API-ul răspundea, dar parserul accepta payloadul ca live fără să extragă corect obiectele nested/array din Electricity Maps.

## Ce repară
- parsează valori numerice nested: `power`, `value`, `mw`, `production`, `consumption`, `total`;
- parsează breakdow-uri în format object, array și object nested;
- alege consumption breakdown dacă există, altfel production breakdown;
- derivă renewable/carbon-free/carbon-intensity din mix când lipsesc câmpurile directe;
- nu mai marchează o zonă ca `live` dacă payloadul are toate valorile 0/gol;
- expune diagnostic pe zonă: `payloadKeys`, `payloadInnerKeys`, `activeTotal`, `productionTotal`, `consumptionTotal`.

## Păstrate
- Electricity Maps first;
- 25 zone configurate;
- demo count = 0;
- ENTSO-E fallback real pentru flows;
- OPCOM principal pentru PZU România;
- white page fixes / live flow arrows.
