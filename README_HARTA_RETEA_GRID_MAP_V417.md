# SERVIO Harta Rețea v4.17 — Subrequest budget + live flows fix

Repară problema Cloudflare `Too many subrequests by single Worker invocation` din v4.16.

- Electricity Maps rămâne provider principal.
- Demo count rămâne 0.
- Mod compact: max 12 zone live implicit, 3 call-uri/zonă.
- Flows Electricity Maps se cer doar pentru zona selectată + RO.
- Dacă flows Electricity Maps nu sunt disponibile, fallback ENTSO-E folosește funcția `gridRomaniaDayWindowUtc`, nu `romaniaDayWindowUtc` inexistent.
- ENTSO-E fallback este limitat implicit la 3 edges ca să nu depășească bugetul de subrequests.
- Păstrează v4.13 white-page fix, v4.14 live arrows, v4.15 no-demo, v4.16 flow parser.
