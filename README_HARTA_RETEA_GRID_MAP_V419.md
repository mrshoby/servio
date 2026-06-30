# SERVIO Harta Rețea v4.19 — Full Europe Live Single-Signal

Obiectiv: afișare live pentru toate zonele configurate în hartă, fără demo și fără depășirea limitei de subrequest Cloudflare Worker.

Schimbări:
- Electricity Maps rămâne provider principal pentru hartă.
- Default `GRID_MAP_MAX_ELECTRICITY_ZONES` devine toate zonele configurate.
- Pentru fiecare zonă se face un singur request Electricity Maps `electricity-mix/latest?breakdownType=normal&temporalGranularity=15_minutes`.
- Carbon intensity / renewable / carbon-free / load sunt citite din payload sau derivate din mix.
- Fluxurile rămân Electricity Maps dacă sunt disponibile, altfel ENTSO-E fallback real.
- Demo count trebuie să rămână 0.
- Păstrează v4.18: live flow arrows, OPCOM PZU, ENTSO-E A44 partial-normalized, white page fix.
