# ENTSO-E Romania local-day time fix

ENTSO-E Transparency returnează intervalele în UTC. Pentru România, ziua locală Europe/Bucharest nu este 00:00 UTC → 00:00 UTC. În timpul verii este 21:00 UTC ziua precedentă → 21:00 UTC ziua curentă.

Acest patch schimbă endpointul `/api/servio/entsoe/day-ahead` ca să interogheze A44 Day-Ahead pentru ziua locală România și să returneze 96 intervale local-label 00:00–23:45, comparabile cu OPCOM PZU / ROPEX_DAM_15min.

OPCOM GitHub cache rămâne sursa principală PZU România. ENTSO-E rămâne sursă alternativă/validare.
