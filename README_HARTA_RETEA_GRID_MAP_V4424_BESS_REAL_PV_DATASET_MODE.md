# SERVIO v4.42.4 — BESS Real PV Dataset Mode

Build intermediar peste v4.42.3. Adauga in Simulatorul Revenue & ROI bifa **BESS cu productie PV reala**. Cand este activa, utilizatorul poate incarca CSV/XLSX/XLS si configura mappingul A=data, B=ora, C=productie, D=consum, inclusiv curbe PVGIS normalizate la 1 kWp. Simularea ruleaza interval cu interval si depinde de curbele energetice, puterea PV, configuratia BESS, dispatch, costurile de import/export, eficienta si degradare.

Fara coloane masurate import/export, autoconsumul, importul si exportul sunt afisate ca estimari, nu valori reale. Shell-ul, Auth, Day-Ahead strict, Harta Retea, Energy Lab si Data Learning Center KPI-only raman neschimbate.
