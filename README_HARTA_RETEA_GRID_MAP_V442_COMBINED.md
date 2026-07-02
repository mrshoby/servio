# SERVIO v4.42 — Combined Dataset Analyzer

Build: `servio-grid-map-v4.42-combined-dataset-analyzer`

## Roadmap corect

Acest build NU este un patch de mousewheel. Mousewheel zoom există deja din v4.23 și este păstrat. v4.42 continuă roadmap-ul Data Learning Center început în v4.30 și dus până la v4.41.

## Ce adaugă

- `Combined Dataset Analyzer` în Data Learning Center.
- Aliniere consum + producție PV din fișiere combinate/full balance/import-export sau din preview compatibil.
- Extrage coloane pentru consum, producție, import și export folosind mapările existente și fallback pe header.
- Calculează:
  - kWh autoconsumat;
  - acoperire consum din PV;
  - utilizare locală a producției PV;
  - import kWh;
  - export kWh;
  - pondere export din producție;
  - peak surplus/interval;
  - peak deficit/interval;
  - surplus prânz și deficit seară pentru potențial BESS.
- Marchează readiness pentru autoconsum PV, autoconsum real, BESS, BESS dispatch și raport client.
- Template-ul salvat include `combinedDatasetRules` cu `selfConsumedKwh`, `coveragePct`, `pvUtilizationPct`, `exportSharePct`, `importSharePct`, `peakSurplusKwh`, `peakDeficitKwh` și readiness.
- Storage migrat la `servio.dataLearning.v442`, cu fallback pe v4.41 și buildurile anterioare.

## Păstrate strict

- Shell/UI Claude SERVIO neschimbat.
- Auth/Login/UserMenu v4.29.
- Loading screen curat v4.27.
- Settings fără vechile carduri `Surse de date · OPCOM & ENTSO-E` și `Conformitate`.
- Overview fără `Necesită atenție`.
- BESS curățat v4.28.
- Day-Ahead strict OPCOM/ENTSO-E.
- Harta Rețea live, flow inspector și mouse wheel zoom existent.
- Consumption Dataset Analyzer v4.40.
- Production Dataset Analyzer v4.41.

## Validare

`npm run check` trebuie să afișeze `SERVIO v4.42 combined dataset analyzer guards OK.`
