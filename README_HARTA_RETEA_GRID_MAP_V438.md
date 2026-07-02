# SERVIO v4.38 — Granularity Normalization 15m / 60m

Build: `servio-grid-map-v4.38-granularity-normalization`

Continuă peste v4.37 Smart Parser Runtime și adaugă normalizarea granulărității în Data Learning Center.

## Ce adaugă

- detectare pași temporali 15 minute / 60 minute din valori de oră și indicii textuale
- profil de normalizare pentru fiecare training file
- păstrare 15m ca precizie ridicată
- păstrare 60m ca precizie medie pentru analize orare
- extindere 60m → 15m doar estimativ, marcată explicit
- agregare 15m → 60m pentru rapoarte
- detectare unități kWh / MWh / Wh / kW / MW
- reguli de conversie energie/putere în parsingRules
- UI nou “Granularity Normalization” în Data Learning Center
- template-urile salvează normalizedGranularity, normalizationMode, precision, intervalMinutes, canExpandTo15m, canAggregateTo60m, unit și energyOrPower

## Păstrate

- Auth/Login/UserMenu v4.29
- Data Learning Center admin-only
- Template Registry v4.36
- Smart Parser Runtime v4.37
- BESS curățat v4.28
- Day-Ahead OPCOM/ENTSO-E strict
- Harta Rețea live
- flow inspector și mouse wheel zoom
- shell-ul Claude / SERVIO actual

## Validare

`npm run check` trebuie să afișeze `SERVIO v4.38 granularity normalization guards OK.`
