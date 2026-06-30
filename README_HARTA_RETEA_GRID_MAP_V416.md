# SERVIO Harta Rețea v4.16

- Păstrează v4.15 Electricity Maps first și zero demo zones.
- Repară parserul de electricity flows: citește arrays, maps, import/export breakdowns și perechi FROM->TO.
- Folosește `breakdownType=normal` / `breakdownType=flow-traced` conform API v4.
- Dacă Electricity Maps nu returnează flows pentru token/plan, folosește fallback real ENTSO-E pentru interconectări, nu demo.
- Expune `apiCoverage.flowsProvider` și `apiCoverage.flowErrors` pentru diagnostic.
