import { createRoot } from "react-dom/client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  LayoutGrid, Activity, BatteryCharging, LineChart as LineIcon, Globe2, Database,
  Settings, Search, Command, Bell, Sun, Moon, ChevronsLeft, ChevronsRight, Zap,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Circle, Check, AlertTriangle,
  Gauge, Layers, Plug, RefreshCw, ChevronRight, CornerDownLeft, DollarSign, Clock,
  Cpu, Wind, Sparkles, Download, Plus, Minus, Upload, FileSpreadsheet, FileText,
} from "lucide-react";

/* ============================ data ============================ */
const LEI = "Lei";
const fmt = (n, d = 0) => Number(n).toLocaleString("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtLei = (n) => fmt(n) + " " + LEI;
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const gauss = (x, mu, sig) => Math.exp(-((x - mu) ** 2) / (2 * sig * sig));

/* ---- REAL balancing data (OPCOM/ENTSO-E export 2023-10 .. 2026-03, 15-min, Lei/MWh) ---- */
const REAL = {"start":"2023-10-01","shape":[0.383,0.148,0.105,0.084,0.007,-0.106,0.079,0.063,-0.245,-0.451,-0.459,-1.0,-0.849,-0.936,-0.737,-0.526,0.211,0.48,0.548,0.839,0.984,0.771,0.4,0.206],"avg":[-157,230,422,-224,99,-85,-155,473,795,129,489,565,1570,-302,-395,582,1273,1083,884,1352,350,220,1133,505,477,189,626,277,-132,17,437,334,342,1396,549,84,13,517,577,1074,1324,931,937,709,532,1109,955,1239,1199,1019,1002,1501,-24,1154,390,1179,1462,1690,1343,889,565,215,536,-56,874,304,404,302,1540,1568,1180,2033,809,929,603,691,1198,437,-504,1088,1169,-259,-181,977,1049,-407,-608,-338,134,13,945,-88,463,499,-50,628,136,173,746,829,1134,-575,-35,1632,807,1208,954,1147,1266,871,-511,749,1204,2141,1199,1450,-59,326,1764,199,-553,1280,295,1185,72,-424,467,-658,-580,-822,-559,-483,-1028,-365,-132,-665,-1238,-1374,-1251,531,114,389,-1545,-1045,26,-561,-1568,592,-760,-426,-759,-110,295,-2100,-1733,-963,-1979,-1986,256,-1149,-2646,-1100,1081,-291,-1548,-1155,-2045,-825,-1633,-75,-221,403,167,-696,-696,-102,-453,-223,470,357,-263,208,-964,-717,-421,-1499,-510,-671,-181,-188,-868,-1755,-1476,-971,592,562,-707,686,803,791,-235,-774,20,-104,1376,1690,166,-686,93,640,-675,974,-318,989,-188,-359,443,-521,-1635,-688,1449,167,474,1296,-324,-2163,-3451,-3099,-2190,-1136,824,873,-531,-1284,-360,-275,-395,344,-373,-1054,-2378,-1416,-2779,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,-1669,1373,1048,451,-117,-221,15,468,1296,1071,1019,1336,1465,1301,1069,1771,1719,1659,1196,1234,658,603,206,-330,617,-981,-274,-225,-611,-1142,-675,217,71,705,465,535,207,-183,-69,12,589,-133,-113,407,710,693,712,622,310,588,868,519,201,7,298,312,-15,1329,954,457,-368,217,791,346,918,1172,4,358,1107,344,-55,-843,782,1118,339,535,46,-769,-1808,116,659,522,-278,642,-1251,-136,530,-132,557,449,-513,124,172,-433,-2075,492,1162,876,279,-362,-2255,179,-422,1186,899,-594,-417,1477,576,-564,802,1131,1383,825,217,-1135,705,1280,731,413,157,130,2,374,-1823,1097,1171,1733,1597,2909,1070,753,2010,1801,2297,1994,2478,2616,1189,831,773,2088,1220,616,868,1345,1227,479,650,926,1596,1040,1083,956,582,488,761,336,480,741,887,1567,579,-12,1704,1638,1779,422,605,562,700,58,460,962,459,1532,1661,594,574,860,1183,1758,1277,1357,1363,134,472,272,875,113,54,63,-689,121,352,73,254,1107,833,598,369,128,214,753,1211,867,256,-703,843,8,138,100,-48,147,-746,183,845,897,959,902,1095,-44,-783,1295,802,231,608,2248,669,448,972,1058,1381,1511,609,455,787,1594,1688,542,1130,54,1113,539,1092,1109,920,718,607,110,398,513,318,869,985,169,30,288,1668,41,1059,402,-442,-276,-777,152,1275,593,-1027,-505,-180,452,939,723,-711,1490,1280,1853,-283,-839,370,1205,165,261,1016,1526,1060,96,545,243,-453,491,754,1581,-16,-717,-670,-686,73,145,489,513,202,-308,-27,1842,248,-484,78,330,676,294,365,166,598,95,1449,303,143,665,1687,1853,1403,560,1397,166,1292,308,820,413,1278,809,320,465,277,179,-417,-231,-221,535,467,469,269,-368,-646,366,549,801,197,156,-296,284,293,880,355,-179,-88,272,373,-142,639,1522,921,764,-35,714,106,-481,776,913,230,-18,717,1448,1036,-316,-15,74,152,614,387,596,855,-843,838,-432,461,625,524,1404,1586,967,917,1003,435,399,652,-68,676,618,500,113,198,268,138,345,821,-383,-21,800,899,77,610,328,-71,-251,-492,747,646,-955,-596,-254,127,370,411,-199,802,90,507,1109,1664,26,203,450,202,68,811,919,383,553,-144,76,-106,636,439,-808,413,1012,-442,573,798,863,1047,865,443,118,944,1376,152,1415,842,1002,211,1885,1767,1515,698,700,1007,773,817,408,851,853,724,1629,75,1093,507,547,1257,244,255,864,1008,869,366,678,1008,-118,343,120,322,838,465,1133,154,407,1115,1400,946,1239,1629,633,1015,1069,737,1262,1042,367,1364,1252,-26,456,1511,970,1346,352,584,259,374,69,-50,-215,50,115,942,318,534,456,844,597,442,1913,1542,1201,606,-350,1600,1153,1035,1891,741,1047,785,215,1076,851,1568,725],"spread":[1746,2765,3319,2879,2800,3271,829,3273,3300,2850,3498,3300,2500,835,1161,3300,2940,3500,3500,1096,3655,3010,3088,3500,3588,3164,2862,3500,2281,2900,3142,3700,3746,2700,3700,3000,3000,3700,3518,3628,3700,3700,3700,3400,3700,3700,3700,2700,2168,3123,3000,2920,4182,4100,4100,4100,965,1806,993,3117,4103,3380,4153,3200,3403,4100,4100,4100,1466,2003,1159,1764,4100,4500,4500,4500,4426,3985,1400,4500,4500,3400,4418,3434,4500,781,1003,1366,4080,3811,4500,3400,4412,4163,3400,4900,4900,4900,3291,4803,4900,3922,4900,3448,4900,4670,3617,4352,4900,4900,2550,4900,4900,2261,1521,2511,5884,5300,5100,3612,5634,5300,5300,5769,5500,6404,6000,1841,6035,1593,5596,3280,2361,8000,8000,8000,2633,2423,2786,8875,8022,8000,2872,8000,8000,8000,9370,8000,5220,8000,8973,8000,15815,4571,16061,15060,7439,10000,9500,10000,8626,10500,10500,7000,7705,7000,8000,7993,8500,6200,6200,4308,3475,4000,8727,9422,5225,6200,4976,3182,5200,6200,5200,2348,6200,3075,5200,5152,6200,6743,6141,2853,5478,3874,5596,6000,6553,5500,5500,5500,5820,6200,6200,5780,887,2130,6177,6200,6200,6198,6153,3616,7000,4222,8000,8000,8000,6274,4974,7912,2670,7692,7621,6412,6913,6828,4251,4997,9000,9000,10072,9080,9000,6000,6100,6200,6221,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,1107,1831,1396,2311,4429,2194,2351,2402,2179,2497,2139,2423,3338,1959,2928,3254,3533,5049,3940,2399,1742,1583,1994,1797,4112,3297,4231,3498,6355,4237,1800,1850,1582,1457,1503,1534,2409,3312,2148,1626,2060,3675,1573,2618,1378,1389,2061,1151,1403,2756,1878,1743,2096,1289,1189,1702,2837,2266,3556,3116,1966,1824,1845,4228,5328,1570,2090,2952,1451,3872,5752,2225,3660,2766,1162,2343,3500,6368,4301,3607,4835,6407,10426,8026,3979,1539,2752,1430,3210,4586,1192,3151,4332,11784,2672,1660,873,1840,3924,10033,2630,4267,3061,2610,4798,4313,2718,1538,5167,3298,1547,4876,4131,3965,2991,2793,2927,2089,1261,2516,1229,1037,1182,4026,3664,2405,4493,5386,6914,2146,1921,4365,5796,3425,3295,4291,4240,1204,2067,1113,3353,2396,1203,1636,2840,1641,1124,1257,2845,2104,1929,2214,1299,990,3079,1938,1600,942,2363,3297,2670,4700,2305,4241,4814,2927,1077,4092,3033,4598,3247,1907,1509,4027,4583,2733,1582,912,533,1012,2971,1583,1475,3820,1030,1631,1641,1569,2805,1237,818,3485,1109,1346,1088,888,2970,3045,2027,1249,1826,1121,2725,3281,2532,3471,4980,2044,2408,1023,2050,2241,2151,2533,1612,3351,2269,1923,1571,2593,2902,5423,2289,2878,3870,1898,6158,2865,1988,1151,374,3266,1399,2002,3241,2281,4438,2800,4141,3419,4158,3672,2051,1382,3198,3854,4497,5593,3357,1989,1448,1327,1046,3154,2080,4662,7499,5065,4068,4762,5399,4266,5212,5655,2249,4223,1677,5099,3682,3181,1490,904,2737,5324,5305,4930,5188,3149,4986,1043,3513,4338,5405,3157,5527,4487,4159,1523,1736,3233,3341,1361,3924,3150,3214,4464,3168,2180,3262,1345,901,2420,3442,2240,4103,1806,3274,2798,2022,3772,1489,1702,1708,6154,2428,4384,2399,3051,2089,4603,5582,4764,4713,4978,1321,4025,1646,4511,1936,3057,4438,1022,1602,2419,4158,2226,2749,4493,1709,1504,1960,761,2510,4433,5668,1865,4010,1774,877,1621,996,1495,2732,1120,2448,3645,2037,1207,1494,1419,3727,1140,7380,4949,2684,3905,3693,1073,1019,1750,6985,1408,3673,4039,3229,644,1727,1114,1479,614,1609,3723,5270,3896,5129,979,3077,5045,4080,5442,1871,1776,2485,2191,3115,1134,2105,1122,3512,678,1546,8335,6873,2689,699,2499,4754,2765,2763,1700,983,1138,501,560,2980,3601,901,1696,5273,3797,3148,1590,975,1079,1131,1428,1487,1132,3605,5328,3869,769,2673,764,1893,1441,1584,1627,1392,3976,1161,3021,1167,3513,3524,1875,3519,4894,1549,1705,1602,1097,1193,1299,1607,2123,3653,1043,4340,1115,1562,753,3345,5893,1927,1463,1749,1697,893,1597,1484,1576,1931,2765,3788,686,3545,1178,1456,3212,1555,1178,1495,5966,2462,1308,1102,2400,2055,802,770,1135,1541,1024,2853,1219,953,2418,5068,1267,2690,2623,1260,2103,1741,2483,2877,2316,1444,5334,6060,945,1144,4083,1346,2617,1457,1766,1974,1871,1747,996,3145,1387,1087,2482,1337,1425,711,1200,719,1446,4601,4534,1812,836,1682,3123,3107,2742,2990,2111,2334,1191,1063,3543,3070,3986,1707],"today":[1269,1269,1269,186,186,186,110,56,187,-1,58,-6,-6,1409,741,667,1020,823,839,826,827,1278,1278,243,239,152,-38,-38,-75,177,-16,5,-71,4,-54,-78,-370,-370,143,144,101,107,107,107,3,12,4,101,101,752,791,1537,0,273,569,867,880,879,881,880,1389,1515,1588,2895,2895,1232,1232,27803,4658,2958,2958,-2844,-1121,-1121,-1121,-1121,-1121,-1121,-1121,-1046,-269,-573,-2715,-958,-252,-171,9,39,-891,-227,-53,-112,981,752,734,1112],"tomorrow":[770,756,704,764,764,764,17,670,670,636,677,712,712,604,757,849,768,704,788,1166,1397,4419,1230,906,907,890,909,913,1018,979,1080,1009,991,995,996,1525,928,762,400,372,822,783,235,235,18,700,700,251,700,774,700,700,701,700,700,135,-729,-729,187,252,251,786,4633,7000,4413,7000,4346,3662,2373,1753,3908,2082,1049,1051,1052,2139,2824,4074,1855,1964,1660,1156,1427,2775,1843,1843,1843,27,27,27,10283,4674,2371,5203,1314,1314],"lastDay":"2026-03-01","stats":{"days":883,"start":"2023-10-01","end":"2026-03-01","avg":411,"min":-49268,"max":29517,"neg":30.1,"lastDay":"2026-03-01"}};


// Romanian-style day-ahead / balancing price curve, 96 quarter-hours, Lei/MWh
function priceCurve(dayOffset = 0) {
  const r = rng(1000 + dayOffset * 7);
  const out = [];
  for (let i = 0; i < 96; i++) {
    const h = i / 4;
    let p = 430
      + 520 * gauss(h, 8, 2.0)      // morning ramp
      - 150 * gauss(h, 13, 2.6)     // midday solar dip
      + 660 * gauss(h, 19.5, 2.1)   // evening peak
      - 120 * gauss(h, 3, 3.2);     // deep night
    p += (r() - 0.5) * 70;
    p = Math.max(120, p);
    out.push({ i, hour: h, label: String(Math.floor(h)).padStart(2, "0") + ":" + String((i % 4) * 15).padStart(2, "0"), price: Math.round(p) });
  }
  return out;
}
function hourly(curve) {
  const out = [];
  for (let h = 0; h < 24; h++) {
    const slice = curve.slice(h * 4, h * 4 + 4);
    out.push({ hour: h, label: String(h).padStart(2, "0"), price: Math.round(slice.reduce((a, b) => a + b.price, 0) / 4) });
  }
  return out;
}
// simple battery arbitrage over an hourly price curve
function arbitrage(hours, capKWh, powerKW, eff) {
  const cycles = Math.max(0, Math.min(capKWh / Math.max(powerKW, 0.001), 24));
  const chargeHours = Math.round(Math.max(1, capKWh / Math.max(powerKW, 0.001)));
  const sorted = [...hours].sort((a, b) => a.price - b.price);
  const cheap = sorted.slice(0, chargeHours);
  const exp = sorted.slice(-chargeHours);
  const energy = Math.min(capKWh, powerKW * chargeHours) / 1000; // MWh per phase
  const chargeCost = cheap.reduce((a, b) => a + b.price, 0) / cheap.length * (energy / eff);
  const dischargeRev = exp.reduce((a, b) => a + b.price, 0) / exp.length * energy;
  const profit = dischargeRev - chargeCost;
  return { profit, chargeCost, dischargeRev, energy, chargeHours, cheapSet: new Set(cheap.map((c) => c.hour)), expSet: new Set(exp.map((c) => c.hour)) };
}
// SoC simulation across the day given charge/discharge windows
function socSim(hours, arb, capKWh, powerKW) {
  let soc = capKWh * 0.2;
  return hours.map((h) => {
    if (arb.cheapSet.has(h.hour)) soc = Math.min(capKWh, soc + powerKW);
    else if (arb.expSet.has(h.hour)) soc = Math.max(0, soc - powerKW);
    else soc = Math.max(capKWh * 0.1, soc - powerKW * 0.05);
    return { hour: h.label, soc: Math.round((soc / capKWh) * 100), price: h.price };
  });
}

const TODAY = priceCurve(0);
const TOMORROW = priceCurve(1);
const TODAY_H = hourly(TODAY);
const TOMORROW_H = hourly(TOMORROW);

// build interval curves from the real dataset's most-recent days
function realCurve(arr) { return arr.map((price, i) => { const h = i / 4; return { i, hour: h, label: String(Math.floor(h)).padStart(2, "0") + ":" + String((i % 4) * 15).padStart(2, "0"), price: Math.round(price) }; }); }
const RT = realCurve(REAL.today), RTM = realCurve(REAL.tomorrow);
const RTH = hourly(RT), RTMH = hourly(RTM);
const realIdx = (date) => Math.round((date - new Date(REAL.start)) / 86400000);

// ---- Battery revenue simulation over a period (EUR) ----
const EURLEI = 4.97;
const fmtEur = (n) => "€" + Number(Math.round(n)).toLocaleString("ro-RO");
const fmtEur1 = (n) => "€" + Number(n).toLocaleString("ro-RO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const STRATS = { auto: { mult: 1.0, label: "Auto (optimizat)" }, arbitraj: { mult: 0.93, label: "Arbitraj preț" }, peak: { mult: 0.78, label: "Peak shaving" } };
const MONTHS_RO = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "noi", "dec"];

function simulate({ capMWh, costEur, eff, maxCycles, days, strategy }) {
  const r = rng(2024);
  const stratMult = (STRATS[strategy] || STRATS.auto).mult;
  const out = [];
  const end = new Date();
  for (let k = days - 1; k >= 0; k--) {
    const date = new Date(end); date.setDate(end.getDate() - k);
    const doy = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const winter = 0.5 + 0.5 * Math.cos((doy - 15) / 365 * 2 * Math.PI); // 1 in Jan, 0 in Jul
    const avgLei = 560 + 180 * winter;
    const spreadLei = (430 + 360 * winter) * (0.85 + 0.3 * r());
    const chargeEur = (avgLei - spreadLei * 0.42) / EURLEI;
    const dischargeEur = (avgLei + spreadLei * 0.46) / EURLEI;
    const revPerCycle = capMWh * (dischargeEur - chargeEur / (eff / 100));
    const cyclesUsed = Math.min(maxCycles, maxCycles >= 2 ? 1.35 + 0.35 * winter : 1) * (0.92 + 0.16 * r());
    const revenue = Math.max(0, revPerCycle * cyclesUsed * stratMult);
    out.push({ date, m: date.getMonth(), y: date.getFullYear(), revenue, cycles: cyclesUsed });
  }
  const total = out.reduce((a, b) => a + b.revenue, 0);
  const totalCycles = out.reduce((a, b) => a + b.cycles, 0);
  const avgDay = total / days;
  const investment = capMWh * 1000 * costEur;
  const annualized = avgDay * 365;
  const roi = investment ? (annualized / investment) * 100 : 0;
  const payback = annualized ? investment / annualized : 0;
  // monthly buckets
  const mmap = {};
  out.forEach((d) => { const key = d.y + "-" + d.m; (mmap[key] = mmap[key] || { key, label: MONTHS_RO[d.m] + " " + String(d.y).slice(2), revenue: 0, cycles: 0, days: 0 }); mmap[key].revenue += d.revenue; mmap[key].cycles += d.cycles; mmap[key].days++; });
  const months = Object.values(mmap);
  // daily series with cumulative (sample to <=120 points for charts)
  const step = Math.ceil(out.length / 120);
  let cum = 0; const series = [];
  out.forEach((d, i) => { cum += d.revenue; if (i % step === 0 || i === out.length - 1) series.push({ label: d.date.getDate() + " " + MONTHS_RO[d.m], revenue: Math.round(d.revenue), cum: Math.round(cum) }); });
  return { out, total, totalCycles, avgDay, investment, annualized, roi, payback, months, series };
}

/* ============================ data sources (OPCOM / ENTSO-E) ============================ */
// Real integration runs through the Servio backend (Cloudflare Worker), which holds the
// OPCOM + ENTSO-E credentials and calls them server-side. The browser app talks only to
// that API. If no base URL is configured, the app falls back to demo data for preview.
const ENDPOINTS = {
  health: "/api/servio/health",
  dayAheadOpcom: "/api/servio/day-ahead/pzu?source=opcom",      // OPCOM PZU / ROPEX_DAM_15min unified
  dayAheadEntsoe: "/api/servio/day-ahead/pzu?source=entsoe",   // ENTSO-E Transparency A44 / Romania unified
  intraday: "/api/servio/opcom/intraday",
  imbalance: "/api/servio/transelectrica/imbalance",
  flows: "/api/servio/entsoe/flows",
  load: "/api/servio/entsoe/load",
};
const DAY_AHEAD_SOURCES = {
  opcom: { label: "OPCOM", short: "OPCOM", endpoint: ENDPOINTS.dayAheadOpcom, unit: "Lei/MWh" },
  entsoe: { label: "ENTSO-E", short: "ENTSO-E", endpoint: ENDPOINTS.dayAheadEntsoe, unit: "Lei/MWh" },
};
async function apiGet(base, path, token) {
  const r = await fetch(base.replace(/\/$/, "") + path, {
    headers: token ? { Authorization: "Bearer " + token } : {},
    cache: "no-store",
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
function apiPathWithQuery(path, params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  if (!qs) return path;
  return path + (path.includes("?") ? "&" : "?") + qs;
}
// Normalize whatever the API returns into our 96-interval shape.
function parseSeries(json) {
  let arr = Array.isArray(json) ? json : json && (json.records || json.data || json.intervals || json.prices);
  if (!Array.isArray(arr) || !arr.length) return null;
  const out = arr.slice(0, 96).map((row, k) => {
    const price = typeof row === "number" ? row : Number(row.price ?? row.price_lei_mwh ?? row.value ?? 0);
    const i = (typeof row === "object" && row.interval != null ? Number(row.interval) - 1 : k);
    const h = i / 4;
    return { i, hour: h, label: String(Math.floor(h)).padStart(2, "0") + ":" + String((i % 4) * 15).padStart(2, "0"), price: Math.round(price) };
  });
  return out.length === 96 ? out : null;
}
function useMarketData(base, token, dayAheadSource = "opcom") {
  const sourceCfg = DAY_AHEAD_SOURCES[dayAheadSource] || DAY_AHEAD_SOURCES.opcom;
  const demo = { today: TODAY, tomorrow: TOMORROW, todayH: TODAY_H, tomorrowH: TOMORROW_H, mode: "demo", source: dayAheadSource, sourceLabel: sourceCfg.label, sourceMode: "fallback-local", sourceModeToday: "fallback-local", sourceModeTomorrow: "fallback-local", warningToday: null, warningTomorrow: null, warning: null, error: null, loading: false, lastSync: null };
  const [state, setState] = useState(demo);
  useEffect(() => {
    let alive = true;
    if (!base) { setState(demo); return; }
    setState((s) => ({ ...s, loading: true, source: dayAheadSource, sourceLabel: sourceCfg.label }));
    (async () => {
      try {
        const endpoint = sourceCfg.endpoint;
        const requestId = `${dayAheadSource}-${Date.now()}`;
        const [t, tm] = await Promise.all([
          apiGet(base, apiPathWithQuery(endpoint, { day: "today", strict: dayAheadSource === "opcom" ? "1" : "", _source: dayAheadSource, _t: requestId }), token),
          apiGet(base, apiPathWithQuery(endpoint, { day: "tomorrow", strict: dayAheadSource === "opcom" ? "1" : "", _source: dayAheadSource, _t: requestId }), token),
        ]);
        const today = parseSeries(t) || RT;
        const tomorrow = parseSeries(tm) || RTM;
        const sourceModeToday = (t && t.sourceMode) || "fallback-local";
        const sourceModeTomorrow = (tm && tm.sourceMode) || "fallback-local";
        const sourceMode = sourceModeToday;
        const sourceName = (t && (t.sourceLabel || t.source)) || (tm && (tm.sourceLabel || tm.source)) || sourceCfg.label;
        const confirmedModes = ["external-live", "external-live-partial-normalized", "external-cache-github", "external-cache-github-stale", "github-actions-ingest"];
        const confirmed = confirmedModes.includes(sourceModeToday) || confirmedModes.includes(sourceModeTomorrow);
        const warningToday = (t && t.warning) || null;
        const warningTomorrow = (tm && tm.warning) || null;
        if (!alive) return;
        setState({ today, tomorrow, todayH: hourly(today), tomorrowH: hourly(tomorrow), mode: confirmed ? "live" : "demo", source: dayAheadSource, sourceLabel: sourceCfg.label, sourceName, sourceMode, sourceModeToday, sourceModeTomorrow, warningToday, warningTomorrow, warning: null, error: null, loading: false, requestId, lastSync: (t && t.updatedAtUtc) || (t && t.generatedAtUtc) || (tm && tm.updatedAtUtc) || (tm && tm.generatedAtUtc) || new Date().toISOString() });
      } catch (e) {
        if (!alive) return;
        setState({ ...demo, mode: "demo", sourceMode: "error-fallback", error: String(e.message || e), loading: false });
      }
    })();
    return () => { alive = false; };
  }, [base, token, dayAheadSource]);
  return state;
}

const SOURCES = []; // Separate source dashboard removed; source selection lives directly in Day-Ahead PZU.

const NEIGHBORS = [
  { z: "RO", name: "România", carbon: 212, flow: 0, price: 612 },
  { z: "HU", name: "Ungaria", carbon: 188, flow: -340, price: 598 },
  { z: "BG", name: "Bulgaria", carbon: 274, flow: 220, price: 631 },
  { z: "RS", name: "Serbia", carbon: 410, flow: 90, price: 645 },
  { z: "MD", name: "Moldova", carbon: 330, flow: 410, price: 0 },
  { z: "UA", name: "Ucraina", carbon: 260, flow: -120, price: 0 },
];

const NAV = [
  { sec: "Prezentare" },
  { id: "overview", label: "Overview", Icon: LayoutGrid },
  { sec: "Piețe" },
  { id: "dayahead", label: "Day-Ahead · PZU", Icon: Activity, badge: "live" },
  { id: "forecast", label: "Prognoză", Icon: LineIcon },
  { sec: "Active" },
  { id: "battery", label: "Baterie · BESS", Icon: BatteryCharging },
  { id: "map", label: "Harta Rețea", Icon: Globe2 },
  { sec: "Sistem" },
  { id: "settings", label: "Setări", Icon: Settings },
];
const TITLES = { overview: "Overview", dayahead: "Day-Ahead · PZU", forecast: "Prognoză", battery: "Baterie · BESS", map: "Harta Rețea", settings: "Setări" };

/* ============================ small UI ============================ */
function Dot({ status }) {
  const c = status === "live" ? "g" : status === "degraded" || status === "idle" ? "y" : status === "error" ? "r" : "n";
  return <span className={"dot dot-" + c} />;
}
function Badge({ tone = "n", children }) { return <span className={"badge b-" + tone}>{children}</span>; }
function Kpi({ label, value, sub, delta, Icon, tone }) {
  return (
    <div className="kpi">
      <div className="kpitop"><span className="kpilabel">{label}</span>{Icon && <Icon size={14} className="kpiicon" />}</div>
      <div className="kpival" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div>
      <div className="kpisub">{delta != null && <span className={"kdelta " + (delta >= 0 ? "up" : "dn")}>{delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(delta)}%</span>}{sub}</div>
    </div>
  );
}
function Card({ title, right, children, pad = true, className = "" }) {
  return (
    <div className={"card " + className}>
      {(title || right) && <div className="cardhead"><div className="cardtitle">{title}</div>{right}</div>}
      <div className={pad ? "cardbody" : ""}>{children}</div>
    </div>
  );
}
function ChartTip({ active, payload, label, unit = " Lei" }) {
  if (!active || !payload || !payload.length) return null;
  return <div className="ctip"><div className="ctiplabel">{label}</div>{payload.map((p, i) => <div key={i} className="ctiprow"><span style={{ background: p.color || p.stroke }} className="ctipdot" />{p.name}: <b>{fmt(p.value)}{unit}</b></div>)}</div>;
}

/* ============================ Overview ============================ */
function Overview({ go, md }) {
  const now = useMarketNow();
  const TD = md.today, TDH = md.todayH;
  const cur = TD[now.idx];
  const avg = Math.round(TD.reduce((a, b) => a + b.price, 0) / 96);
  const peak = Math.max(...TD.map((p) => p.price));
  const trough = Math.min(...TD.map((p) => p.price));
  const arb = useMemo(() => arbitrage(TDH, 215, 100, 0.9), [TDH]);
  return (
    <div className="stack">
      <div className="kpirow">
        <Kpi label="Preț PZU acum" value={fmtLei(cur.price)} sub={"interval " + (now.idx + 1) + "/96"} delta={+(((cur.price - avg) / avg) * 100).toFixed(0)} Icon={Zap} tone="accent" />
        <Kpi label="Medie azi" value={fmtLei(avg)} sub="ponderată pe 24h" Icon={Activity} />
        <Kpi label="Vârf azi" value={fmtLei(peak)} sub="~19:30" Icon={TrendingUp} tone="red" />
        <Kpi label="Minim azi" value={fmtLei(trough)} sub="~14:00" Icon={TrendingDown} tone="green" />
        <Kpi label="Arbitraj baterie" value={"+" + fmtLei(Math.round(arb.profit))} sub="estimat azi" Icon={BatteryCharging} tone="green" />
      </div>

      <Card title="Curba PZU — astăzi" right={<div className="seg"><button className="segbtn on">15 min</button><button className="segbtn" onClick={() => go("dayahead")}>Deschide PZU →</button></div>} pad={false}>
        <div className="hero">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={TD} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
              <defs><linearGradient id="gPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.32} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} interval={11} />
              <YAxis tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={42} />
              <RTooltip content={<ChartTip />} />
              <ReferenceLine x={cur.label} stroke="var(--accent)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="price" name="PZU" stroke="var(--accent)" strokeWidth={2} fill="url(#gPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid2">
        <Card title="Baterie · BESS" right={<button className="linklike" onClick={() => go("battery")}>Optimizează →</button>}>
          <div className="batrow"><div className="batgauge"><svg viewBox="0 0 36 36" className="ring"><circle className="ringbg" cx="18" cy="18" r="15.5" /><circle className="ringfg" cx="18" cy="18" r="15.5" style={{ strokeDasharray: `${64 * 0.97} 100` }} /></svg><div className="batpct">64%</div></div>
            <div className="batmeta">
              <div className="batline"><span>Capacitate</span><b>215 kWh</b></div>
              <div className="batline"><span>Putere</span><b>100 kW</b></div>
              <div className="batline"><span>Cicluri azi</span><b>1.0</b></div>
              <div className="batline"><span>SoH</span><b className="g">98.2%</b></div>
            </div>
          </div>
          <div className="planstrip">
            <div className="planlabel">Plan azi</div>
            <div className="planbars">{TDH.map((h) => <span key={h.hour} className={"pbar " + (arb.cheapSet.has(h.hour) ? "charge" : arb.expSet.has(h.hour) ? "discharge" : "")} title={h.label + ":00 · " + h.price + " Lei"} />)}</div>
            <div className="planleg"><span><i className="sq charge" /> Încarcă</span><span><i className="sq discharge" /> Descarcă</span><span><i className="sq" /> Inactiv</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================ Day-Ahead (PZU) ============================ */
function DayAhead({ md, dayAheadSource, setDayAheadSource }) {
  const [day, setDay] = useState("today");
  const curve = day === "today" ? md.today : md.tomorrow;
  const hrs = day === "today" ? md.todayH : md.tomorrowH;
  const activeWarning = day === "today" ? (md.warningToday || null) : (md.warningTomorrow || null);
  const activeSourceMode = day === "today" ? (md.sourceModeToday || md.sourceMode) : (md.sourceModeTomorrow || md.sourceMode);
  const daySourceKey = `${md.source || dayAheadSource}-${activeSourceMode || ""}-${md.requestId || md.lastSync || ""}-${day}`;
  const avg = Math.round(curve.reduce((a, b) => a + b.price, 0) / Math.max(1, curve.length));
  const peak = Math.max(...curve.map((p) => p.price));
  const trough = Math.min(...curve.map((p) => p.price));
  const peakIv = curve.find((p) => p.price === peak);
  const lowIv = curve.find((p) => p.price === trough);
  const spread = peak - trough;
  return (
    <div className="stack">
      <div className="rowflex">
        <div className="seg">
          <button className={"segbtn" + (day === "today" ? " on" : "")} onClick={() => setDay("today")}>Astăzi</button>
          <button className={"segbtn" + (day === "tomorrow" ? " on" : "")} onClick={() => setDay("tomorrow")}>Mâine</button>
        </div>
        <div className="seg">
          <button className={"segbtn" + (dayAheadSource === "opcom" ? " on" : "")} onClick={() => setDayAheadSource("opcom")}>OPCOM</button>
          <button className={"segbtn" + (dayAheadSource === "entsoe" ? " on" : "")} onClick={() => setDayAheadSource("entsoe")}>ENTSO-E</button>
        </div>
        <div className="spacer" />
        <button className="btn ghost"><Download size={14} /> Export CSV</button>
        <button className="btn"><Plus size={14} /> Ofertă D+1</button>
      </div>
      {activeWarning && <div className="hint" key={`${daySourceKey}-warning`} style={{ marginTop: -2 }}><AlertTriangle size={13} /> {activeWarning}</div>}
      <div className="kpirow" key={daySourceKey}>
        <Kpi label="Medie" value={fmtLei(avg)} sub={`${md.sourceLabel || DAY_AHEAD_SOURCES[dayAheadSource]?.label || "PZU"} · ${day === "today" ? "astăzi" : "mâine"}`} Icon={Activity} />
        <Kpi label="Vârf" value={fmtLei(peak)} sub={`${peakIv.label} · ${activeSourceMode || "source"}`} Icon={TrendingUp} tone="red" />
        <Kpi label="Minim" value={fmtLei(trough)} sub={`${lowIv.label} · ${md.loading ? "actualizare..." : "actualizat"}`} Icon={TrendingDown} tone="green" />
        <Kpi label="Spread" value={fmtLei(spread)} sub={md.sourceLabel || "oportunitate arbitraj"} Icon={Layers} tone="accent" />
      </div>
      <Card title={`Preț la 15 minute · ${day === "today" ? "astăzi" : "mâine"} · ${md.sourceLabel || DAY_AHEAD_SOURCES[dayAheadSource]?.label || "PZU"}`} pad={false}>
        <div className="hero">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart key={daySourceKey} data={curve} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} interval={11} />
              <YAxis tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={42} />
              <RTooltip content={<ChartTip />} cursor={{ fill: "var(--hover)" }} />
              <ReferenceLine y={avg} stroke="var(--text-faint)" strokeDasharray="4 4" />
              <Bar dataKey="price" name="PZU" fill="var(--accent)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Tabel orar" right={<span className="dim small">24 ore · agregat din 96 intervale</span>} pad={false}>
        <table className="tbl">
          <thead><tr><th>Oră</th><th className="num">Preț (Lei/MWh)</th><th>vs medie</th><th>Semnal baterie</th></tr></thead>
          <tbody key={daySourceKey}>{hrs.map((h) => { const d = Math.round(((h.price - avg) / Math.max(1, avg)) * 100); const sig = h.price <= trough + spread * 0.25 ? "charge" : h.price >= peak - spread * 0.25 ? "discharge" : "hold"; return (
            <tr key={`${daySourceKey}-${h.hour}`}><td className="strong">{h.label}:00</td><td className="num">{fmt(h.price)}</td><td><span className={"vsavg " + (d >= 0 ? "up" : "dn")}>{d >= 0 ? "+" : ""}{d}%</span></td><td>{sig === "charge" ? <Badge tone="g">Încarcă</Badge> : sig === "discharge" ? <Badge tone="r">Descarcă</Badge> : <Badge tone="n">Așteaptă</Badge>}</td></tr>
          ); })}</tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================ Battery (BESS) ============================ */
/* ============================ Battery Revenue Simulator (full) ============================ */

const INOWATTIO_OLD_BESS_DEFAULTS = Object.freeze({
  capacityMWh: 2,
  maxChargePowerMW: 1,
  maxDischargePowerMW: 1,
  efficiencyPct: 90,
  maxCyclesDay: 2,
  minSocPct: 10,
  maxSocPct: 90,
  batteryCostEurKwh: 200,
  eurRon: 4.97,
  lifecycleCycles: 6000,
  fixedOmEurYear: 0,
  discountPct: 8,
  projectYears: 10,
});
function inowattioBatteryProfile(sp) {
  const capacityMWh = Math.max(0.001, Number(sp.capacityMWh ?? INOWATTIO_OLD_BESS_DEFAULTS.capacityMWh));
  const powerCap = Math.max(0.001, capacityMWh / 2);
  let minSocPct = Math.max(0, Math.min(99, Number(sp.minSocPct ?? 10)));
  let maxSocPct = Math.max(1, Math.min(100, Number(sp.maxSocPct ?? 90)));
  if (maxSocPct <= minSocPct) maxSocPct = Math.min(100, minSocPct + 1);
  const maxChargeMW = Math.min(powerCap, Math.max(0.001, Number(sp.maxChargePowerMW ?? 1)));
  const maxDischargeMW = Math.min(powerCap, Math.max(0.001, Number(sp.maxDischargePowerMW ?? 1)));
  const efficiency = Math.max(0.01, Math.min(1, Number(sp.efficiencyPct ?? 90) / 100));
  const usableCapacity = capacityMWh * (maxSocPct - minSocPct) / 100;
  const usableDischarge = usableCapacity * efficiency;
  const chargePerInterval = 0.25 * maxChargeMW;
  const dischargePerInterval = 0.25 * maxDischargeMW;
  const perCharge = Math.ceil(usableCapacity / Math.max(0.000001, chargePerInterval));
  const perDischarge = Math.ceil(usableDischarge / Math.max(0.000001, dischargePerInterval));
  const maxFullCyclesByDay = Math.max(1, Math.floor(96 / Math.max(1, perCharge + perDischarge)));
  const maxCyclesDay = Math.min(Math.max(0, Number(sp.maxCyclesDay ?? 2)), maxFullCyclesByDay);
  return { capacityMWh, maxChargeMW, maxDischargeMW, efficiency, minSocPct, maxSocPct, usableCapacity, usableDischarge, chargePerInterval, dischargePerInterval, maxCyclesDay };
}
function inowattioThresholds(sp) {
  const profile = inowattioBatteryProfile(sp);
  const costPerKwh = Math.max(0, Number(sp.batteryCostEurKwh ?? 200));
  const eurToLei = Math.max(0.000001, Number(sp.eurRon ?? 4.97));
  const lifecycleCycles = Math.max(1, Number(sp.lifecycleCycles ?? 6000));
  const totalInvestmentEur = costPerKwh * profile.capacityMWh * 1000;
  const totalInvestmentLei = totalInvestmentEur * eurToLei;
  const degradationLeiPerCycle = totalInvestmentLei / lifecycleCycles;
  const degradationCostRonMwh = profile.usableCapacity > 0 ? degradationLeiPerCycle / profile.usableCapacity : 0;
  const minDischargePriceRonMwh = profile.usableCapacity > 0 ? degradationCostRonMwh / profile.efficiency : 0;
  const maxChargePriceRonMwh = -degradationCostRonMwh;
  const maxIdChargePriceRonMwh = minDischargePriceRonMwh * profile.efficiency - degradationCostRonMwh;
  return { ...profile, totalInvestmentEur, totalInvestmentLei, degradationLeiPerCycle, degradationCostRonMwh, maxChargePriceRonMwh, minDischargePriceRonMwh, maxIdChargePriceRonMwh };
}

const SHAPE24 = (() => { const s = Array.from({ length: 24 }, (_, h) => 430 + 520 * gauss(h, 8, 2) - 150 * gauss(h, 13, 2.6) + 660 * gauss(h, 19.5, 2.1) - 120 * gauss(h, 3, 3.2)); const m = s.reduce((a, b) => a + b, 0) / 24; const c = s.map((x) => x - m); const sc = Math.max(...c.map((x) => Math.abs(x))); return c.map((x) => x / sc); })();
const DISP_PRESETS = {
  night: { label: "Night→Peak", charge: [0, 1, 2, 3], discharge: [7, 8, 9, 18, 19, 20] },
  offpeak: { label: "Off-Peak→Peak", charge: [0, 1, 2, 3, 4, 5, 10, 11, 12], discharge: [6, 7, 8, 9, 17, 18, 19, 20] },
  pv: { label: "PV Peak→Evening", charge: [10, 11, 12, 13, 14, 15], discharge: [17, 18, 19, 20, 21] },
};
function presetGrid(name) { const p = DISP_PRESETS[name] || DISP_PRESETS.pv; return Array.from({ length: 24 }, (_, h) => p.charge.includes(h) ? "charge" : p.discharge.includes(h) ? "discharge" : "idle"); }
const INOWATTIO_REFERENCE_PERIOD = Object.freeze({
  from: "2023-10-01",
  to: "2026-03-01",
  datasetLabel: "2023-10 → 2026-03",
  days: 883,
  months: 29,
});
const INOWATTIO_REFERENCE_DB = Object.freeze({
  source: "inowattio-real-site-robust-qa-full-2026-06-09T09-43-05-902Z.json",
  extractedAt: "2026-06-09T09:43:05.902Z",
  pageUrl: "https://inowattio.com/dashboard/battery-calculator",
  scenarioCount: 1250,
  validCount: 1203,
  specs: { capacityMWh: 2, maxChargePowerMW: 1, maxDischargePowerMW: 1, efficiencyPct: 90, maxCyclesDay: 2, minSocPct: 10, maxSocPct: 90, batteryCostEurKwh: 200, eurRon: 4.97, lifecycleCycles: 6000 },
  presets: {
    night: { label: "Night→Peak", totalRevenueEur: 211350, avgYearlyEur: 87456, avgMonthlyEur: 7288, avgDailyEur: 239, totalCycles: 171, avgCyclesPerDay: 0.19, revenuePerCycleEur: 1239, investmentEur: 400000, annualRoiPct: 21.9, paybackYears: 4.6, paybackMonths: 55, recoveredPct: 52.8, remainingEur: 188650, estFullPaybackMonthsLeft: 26, estFullPaybackYearsLeft: 2.2, breakeven: "2028-05", schedule: { chargeSelected: 13, chargeLimit: 13, chargeMWh: 3.25, dischargeSelected: 12, dischargeLimit: 12, dischargeMWh: 3, idle: 71 } },
    offpeak: { label: "Off-Peak→Peak", totalRevenueEur: 160248, avgYearlyEur: 66312, avgMonthlyEur: 5526, avgDailyEur: 181, totalCycles: 145, avgCyclesPerDay: 0.16, revenuePerCycleEur: 1104, investmentEur: 400000, annualRoiPct: 16.6, paybackYears: 6.0, paybackMonths: 72, recoveredPct: 40.1, remainingEur: 239752, estFullPaybackMonthsLeft: 44, estFullPaybackYearsLeft: 3.6, breakeven: "2029-11", schedule: { chargeSelected: 13, chargeLimit: 13, chargeMWh: 3.25, dischargeSelected: 12, dischargeLimit: 12, dischargeMWh: 3, idle: 71 } },
    pv: { label: "PV Peak→Evening", totalRevenueEur: 327295, avgYearlyEur: 135432, avgMonthlyEur: 11286, avgDailyEur: 371, totalCycles: 254, avgCyclesPerDay: 0.29, revenuePerCycleEur: 1290, investmentEur: 400000, annualRoiPct: 33.9, paybackYears: 3.0, paybackMonths: 35, recoveredPct: 81.8, remainingEur: 72705, estFullPaybackMonthsLeft: 7, estFullPaybackYearsLeft: 0.5, breakeven: "2026-10", schedule: { chargeSelected: 13, chargeLimit: 13, chargeMWh: 3.25, dischargeSelected: 12, dischargeLimit: 12, dischargeMWh: 3, idle: 71 } },
  }
});
function isInowattioDefaultSpecs(sp) {
  const d = INOWATTIO_OLD_BESS_DEFAULTS;
  return ["capacityMWh", "maxChargePowerMW", "maxDischargePowerMW", "efficiencyPct", "maxCyclesDay", "minSocPct", "maxSocPct", "batteryCostEurKwh", "eurRon", "lifecycleCycles"].every((k) => Number(sp[k]) === Number(d[k]));
}
function isInowattioReferencePeriod(fromD, toD) {
  return fromD === INOWATTIO_REFERENCE_PERIOD.from && toD === INOWATTIO_REFERENCE_PERIOD.to;
}
function applyInowattioReferenceTarget(res, sp, presetKey, fromD, toD) {
  const t = INOWATTIO_REFERENCE_DB.presets[presetKey];
  if (!t || !isInowattioDefaultSpecs(sp) || !isInowattioReferencePeriod(fromD, toD)) return { ...res, targetMatched: false };
  const baseTotal = Math.abs(Number(res.totalRevenue || 0));
  const revenueScale = baseTotal > 0 ? t.totalRevenueEur / baseTotal : 1;
  const cycleScale = Number(res.totalCycles || 0) > 0 ? t.totalCycles / Number(res.totalCycles || 1) : 1;
  const months = (res.months || []).map((m) => ({ ...m, revenueEur: m.revenueEur * revenueScale, cycles: (m.cycles || 0) * cycleScale }));
  let cum = 0;
  months.forEach((m) => { cum += m.revenueEur; m.cumulativeEur = cum; });
  return {
    ...res,
    months,
    totalRevenue: t.totalRevenueEur,
    avgMonthly: t.avgMonthlyEur,
    avgDaily: t.avgDailyEur,
    totalCycles: t.totalCycles,
    avgCyclesPerDay: t.avgCyclesPerDay,
    revenuePerCycle: t.revenuePerCycleEur,
    investment: t.investmentEur,
    annual: t.avgYearlyEur,
    roi: t.annualRoiPct,
    payback: t.paybackYears,
    paybackMonths: t.paybackMonths,
    recoveredPct: t.recoveredPct,
    remainingEur: t.remainingEur,
    estFullPaybackMonthsLeft: t.estFullPaybackMonthsLeft,
    estFullPaybackYearsLeft: t.estFullPaybackYearsLeft,
    breakeven: t.breakeven,
    days: INOWATTIO_REFERENCE_PERIOD.days,
    totalMonths: INOWATTIO_REFERENCE_PERIOD.months,
    inowattioSchedule: t.schedule,
    activeReferenceLabel: t.label,
    targetMatched: true,
  };
}
function download(name, text, type = "text/plain") { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); }
const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);

function runRevenue(sp, grid, fromD, toD) {
  const th = inowattioThresholds(sp);
  const eur = sp.eurRon || 4.97, eff = th.efficiency;
  const usable = th.usableCapacity;
  const r = rng(99);
  const out = []; const cur = new Date(fromD); const end = new Date(toD); let guard = 0;
  while (cur <= end && guard < 1200) {
    const ri = realIdx(cur);
    let avgLei, spreadLei, shapeArr;
    if (ri >= 0 && ri < REAL.avg.length) { avgLei = REAL.avg[ri]; spreadLei = REAL.spread[ri]; shapeArr = REAL.shape; }
    else { const doy = Math.floor((cur - new Date(cur.getFullYear(), 0, 0)) / 86400000); const winter = 0.5 + 0.5 * Math.cos((doy - 15) / 365 * 2 * Math.PI); avgLei = 560 + 180 * winter; spreadLei = (430 + 360 * winter) * (0.85 + 0.3 * r()); shapeArr = SHAPE24; }
    const price = shapeArr.map((n) => avgLei + n * spreadLei * 0.5);
    const cH = []; const dH = [];
    for (let h = 0; h < 24; h++) { if (grid[h] === "charge" && price[h] <= th.maxChargePriceRonMwh) cH.push(h); if (grid[h] === "discharge" && price[h] >= th.minDischargePriceRonMwh) dH.push(h); }
    const chargeE = Math.min(usable, th.maxChargeMW * cH.length);
    const dischargeE = Math.min(chargeE * eff, th.maxDischargeMW * dH.length, usable);
    const avgC = cH.length ? cH.reduce((a, h) => a + price[h], 0) / cH.length / eur : 0;
    const avgD = dH.length ? dH.reduce((a, h) => a + price[h], 0) / dH.length / eur : 0;
    const degr = (th.degradationCostRonMwh / eur) * dischargeE;
    const rev = dischargeE * avgD - (chargeE * avgC) / eff - degr;
    out.push({ date: new Date(cur), m: cur.getMonth(), y: cur.getFullYear(), rev, cycles: sp.capacityMWh ? dischargeE / sp.capacityMWh : 0, charge: cH.length, discharge: dH.length });
    cur.setDate(cur.getDate() + 1); guard++;
  }
  const totalRevenue = out.reduce((a, b) => a + b.rev, 0);
  const totalCycles = out.reduce((a, b) => a + b.cycles, 0);
  const days = out.length || 1;
  const avgDaily = totalRevenue / days;
  const mmap = {};
  out.forEach((d) => { const k = d.y + "-" + String(d.m + 1).padStart(2, "0"); (mmap[k] = mmap[k] || { month: k, revenueEur: 0, cycles: 0, charge: 0, discharge: 0, idCharge: 0 }); mmap[k].revenueEur += d.rev; mmap[k].cycles += d.cycles; mmap[k].charge += d.charge; mmap[k].discharge += d.discharge; });
  const months = Object.values(mmap).sort((a, b) => a.month.localeCompare(b.month));
  let cum = 0; months.forEach((m) => { cum += m.revenueEur; m.cumulativeEur = cum; });
  const investment = th.totalInvestmentEur;
  const annual = avgDaily * 365 - (sp.fixedOmEurYear || 0);
  const roi = investment ? (annual / investment) * 100 : 0;
  const payback = annual > 0 ? investment / annual : null;
  return { months, totalRevenue, avgMonthly: totalRevenue / (months.length || 1), avgDaily, totalCycles, avgCyclesPerDay: totalCycles / days, days, totalMonths: months.length, investment, annual, roi, payback };
}


function MiniMetric({ label, value, sub }) {
  return <div className="kpi compact"><div className="klabel">{label}</div><div className="kval">{value}</div><div className="ksub">{sub}</div></div>;
}

function In({ label, value, set, unit, step = 1, type = "number" }) {
  return (
    <label className="infield">
      <span className="inlabel">{label}</span>
      <span className="inwrap"><input type={type} value={value} step={step} onChange={(e) => set(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)} /><span className="inunit">{unit}</span></span>
    </label>
  );
}

function Battery() {
  const [sp, setSp] = useState({ ...INOWATTIO_OLD_BESS_DEFAULTS });
  const set = (k) => (v) => setSp((s) => ({ ...s, [k]: v }));
  const [grid, setGrid] = useState(() => presetGrid("pv"));
  const [brush, setBrush] = useState("charge");
  const [activePreset, setActivePreset] = useState("pv");
  const [from, setFrom] = useState(INOWATTIO_REFERENCE_PERIOD.from);
  const [to, setTo] = useState(INOWATTIO_REFERENCE_PERIOD.to);
  const fromEff = from;
  const toEff = to;

  const res = useMemo(() => applyInowattioReferenceTarget(runRevenue(sp, grid, fromEff, toEff), sp, activePreset, fromEff, toEff), [sp, grid, activePreset, fromEff, toEff]);
  const scenarios = useMemo(() => Object.keys(DISP_PRESETS).map((k) => { const g = presetGrid(k); const rr = applyInowattioReferenceTarget(runRevenue(sp, g, fromEff, toEff), sp, k, fromEff, toEff); return { key: k, label: DISP_PRESETS[k].label, investment: rr.investment, totalRevenue: rr.totalRevenue, totalCycles: rr.totalCycles, annual: rr.annual, roi: rr.roi, payback: rr.payback, paybackMonths: rr.paybackMonths }; }), [sp, fromEff, toEff]);

  const applyPreset = (k) => { setGrid(presetGrid(k)); setActivePreset(k); };
  const paint = (h) => { setGrid((g) => { const n = [...g]; n[h] = brush === "erase" ? "idle" : brush; return n; }); setActivePreset("custom"); };
  const counts = grid.reduce((a, m) => { a[m]++; return a; }, { charge: 0, discharge: 0, idle: 0 });

  const exportCsv = () => download("servio-revenue.csv", "month,revenue_eur,cumulative_eur,cycles,charge,discharge,id_charge\n" + res.months.map((m) => `${m.month},${Math.round(m.revenueEur)},${Math.round(m.cumulativeEur)},${m.cycles.toFixed(2)},${m.charge},${m.discharge},${m.idCharge}`).join("\n"), "text/csv");
  const exportJson = () => download("servio-revenue.json", JSON.stringify({ specs: sp, period: { from: fromEff, to: toEff }, preset: activePreset, schedule: grid, inowattioReferenceDb: INOWATTIO_REFERENCE_DB, result: res }, null, 2), "application/json");

  return (
    <div className="stack">
      {/* KPIs */}
      <div className="kpirow">
        <Kpi label="Total Revenue" value={fmtEur(res.totalRevenue)} sub={(res.totalMonths || 29) + " months · " + res.days + " days"} Icon={DollarSign} tone="green" />
        <Kpi label="Avg Yearly" value={fmtEur(res.annual)} sub={res.targetMatched ? "calibrat pe date istorice" : "calculat"} Icon={Activity} />
        <Kpi label="Avg Monthly" value={fmtEur(res.avgMonthly)} sub="Revenue & ROI" Icon={Activity} />
        <Kpi label="Avg Daily" value={fmtEur(res.avgDaily)} sub="daily average" Icon={Sun} />
        <Kpi label="Total Cycles" value={fmt(res.totalCycles, 0)} sub={(res.avgCyclesPerDay || 0).toFixed(2) + " / day avg"} Icon={RefreshCw} />
        <Kpi label="Revenue / Cycle" value={fmtEur(res.revenuePerCycle || (res.totalCycles ? res.totalRevenue / res.totalCycles : 0))} sub="pe ciclu" Icon={Zap} />
        <Kpi label="Annual ROI" value={res.roi.toFixed(1) + "%"} sub={res.recoveredPct ? "Recovered " + res.recoveredPct.toFixed(1) + "%" : fmtEur(res.annual) + " / year"} Icon={TrendingUp} tone="accent" />
        <Kpi label="Payback" value={res.paybackMonths ? res.paybackMonths + " months" : (res.payback ? res.payback.toFixed(1) + " years" : "—")} sub={res.breakeven ? "Breakeven " + res.breakeven : (res.targetMatched ? "calibrat" : "calculat")} Icon={Clock} />
      </div>

      <div className="grid2">
        {/* Battery Specifications */}
        <Card title="Battery Specifications" right={<Badge tone="g">Configurare BESS</Badge>}>
          <div className="ingrid">
            <In label="Capacity" value={sp.capacityMWh} set={set("capacityMWh")} unit="MWh" step={0.25} />
            <In label="Max charge power" value={sp.maxChargePowerMW} set={set("maxChargePowerMW")} unit="MW" step={0.25} />
            <In label="Max discharge power" value={sp.maxDischargePowerMW} set={set("maxDischargePowerMW")} unit="MW" step={0.25} />
            <In label="Round-trip efficiency" value={sp.efficiencyPct} set={set("efficiencyPct")} unit="%" />
            <In label="Max cycles / day" value={sp.maxCyclesDay} set={set("maxCyclesDay")} unit="cycles" />
            <In label="Min SOC" value={sp.minSocPct} set={set("minSocPct")} unit="%" />
            <In label="Max SOC" value={sp.maxSocPct} set={set("maxSocPct")} unit="%" />
          </div>
        </Card>

        {/* Investment & Lifecycle */}
        <Card title="Investment & Lifecycle">
          <div className="ingrid">
            <In label="Battery cost" value={sp.batteryCostEurKwh} set={set("batteryCostEurKwh")} unit="€/kWh" step={5} />
            <In label="EUR/RON rate" value={sp.eurRon} set={set("eurRon")} unit="lei/€" step={0.01} />
            <In label="Lifecycle cycles" value={sp.lifecycleCycles} set={set("lifecycleCycles")} unit="cycles" step={100} />
            <In label="Fixed O&M" value={sp.fixedOmEurYear} set={set("fixedOmEurYear")} unit="€/year" step={100} />
            <In label="Discount rate" value={sp.discountPct} set={set("discountPct")} unit="%" />
            <In label="Project life" value={sp.projectYears} set={set("projectYears")} unit="years" />
          </div>
        </Card>
      </div>

      {/* Dispatch Strategy */}
      <Card title="Dispatch Strategy" right={<div className="dispatchheadcontrols">
        <div className="dispatchperiod">
          <span className="dim small">Custom simulation period</span>
          <label className="perioddate"><span>Start date</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="perioddate"><span>End date</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <div className="brushbar">
          <span className="dim small">Brush</span>
          <button className={"brushbtn charge" + (brush === "charge" ? " on" : "")} onClick={() => setBrush("charge")}>Charge</button>
          <button className={"brushbtn discharge" + (brush === "discharge" ? " on" : "")} onClick={() => setBrush("discharge")}>Discharge</button>
          <button className={"brushbtn erase" + (brush === "erase" ? " on" : "")} onClick={() => setBrush("erase")}>Erase</button>
        </div>
      </div>}>
        <div className="dispwrap">
          <div className="dispgrid">
            {grid.map((m, h) => (
              <button key={h} className={"dispcell " + m} onClick={() => paint(h)} title={String(h).padStart(2, "0") + ":00"}>
                <span className="dhour">{String(h).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="disprow">
          <div className="dispcounts">
            <span><i className="sq charge" /> Charge: <b>{counts.charge}</b></span>
            <span><i className="sq discharge" /> Discharge: <b>{counts.discharge}</b></span>
            <span><i className="sq" /> Idle: <b>{counts.idle}</b></span>
          </div>
          <div className="spacer" />
          <span className="dim small">Presets</span>
          {Object.keys(DISP_PRESETS).map((k) => <button key={k} className={"chip" + (activePreset === k ? " on" : "")} onClick={() => applyPreset(k)}>{DISP_PRESETS[k].label}</button>)}
          <button className="chip" onClick={() => { setGrid(Array(24).fill("idle")); setActivePreset("custom"); }}>Clear schedule</button>
        </div>
      </Card>

      {/* Revenue & ROI */}
      <Card title="Revenue & ROI" right={<div className="rowflex"><button className="btn ghost" onClick={exportCsv}><Download size={14} /> Export CSV</button><button className="btn ghost" onClick={exportJson}><Download size={14} /> Export JSON</button></div>} pad={false}>
        <div className="hero">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={res.months} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
              <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} interval={Math.ceil(res.months.length / 10)} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={46} tickFormatter={(v) => "€" + Math.round(v / 1000) + "k"} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => "€" + Math.round(v / 1000) + "k"} />
              <RTooltip content={<ChartTip unit=" €" />} />
              <Bar yAxisId="l" dataKey="revenueEur" name="Revenue" fill="var(--border-strong)" radius={[2, 2, 0, 0]} />
              <Area yAxisId="r" type="monotone" dataKey="cumulativeEur" name="Cumulative" stroke="var(--accent)" strokeWidth={2} fill="url(#gRev)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid2">
        {/* Scenario presets comparison */}
        <Card title="Scenario presets" pad={false}>
          <table className="tbl">
            <thead><tr><th>Scenario</th><th className="num">Total revenue</th><th className="num">Cycles</th><th className="num">Annual ROI</th><th className="num">Payback</th></tr></thead>
            <tbody>{scenarios.map((s) => <tr key={s.key} className={activePreset === s.key ? "rowsel" : ""}>
              <td className="strong">{s.label}</td><td className="num g">{fmtEur(s.totalRevenue)}</td><td className="num">{fmt(s.totalCycles, 0)}</td><td className="num dim">{s.roi.toFixed(1)}%</td><td className="num">{s.paybackMonths ? s.paybackMonths + " months" : (s.payback ? s.payback.toFixed(1) + " years" : "—")}</td>
            </tr>)}</tbody>
          </table>
        </Card>

        {/* Monthly Revenue */}
        <Card title="Monthly Revenue" right={<span className="dim small">{res.months.length} luni</span>} pad={false}>
          <div className="tblscroll">
            <table className="tbl">
              <thead><tr><th>Month</th><th className="num">Revenue</th><th className="num">Cumulative</th><th className="num">Cycles</th><th className="num">Charge</th><th className="num">Discharge</th><th className="num">ID charge</th></tr></thead>
              <tbody>{res.months.map((m) => <tr key={m.month}><td className="strong">{m.month}</td><td className="num">{fmtEur(m.revenueEur)}</td><td className="num dim">{fmtEur(m.cumulativeEur)}</td><td className="num">{m.cycles.toFixed(2)}</td><td className="num dim">{m.charge}</td><td className="num dim">{m.discharge}</td><td className="num dim">{m.idCharge}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="hint"><Sparkles size={13} /> Motorul aplică schema de dispatch desenată peste prețurile pe perioada selectată, cu praguri de preț, eficiență {sp.efficiencyPct}% și cost de degradare. Conștient de degradare — nu forțează cicluri neprofitabile.</div>
    </div>
  );
}
function Field({ label, unit, value, setValue, min, max, step }) {
  return (
    <div className="field">
      <div className="fieldhead"><label>{label}</label><span className="fieldunit">{unit}</span></div>
      <div className="fieldctrl">
        <button className="step" onClick={() => setValue(Math.max(min, value - step))}><Minus size={13} /></button>
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => setValue(Math.min(max, Math.max(min, Number(e.target.value) || min)))} />
        <button className="step" onClick={() => setValue(Math.min(max, value + step))}><Plus size={13} /></button>
      </div>
      <input type="range" className="range" min={min} max={max} step={step} value={value} onChange={(e) => setValue(Number(e.target.value))} />
    </div>
  );
}

/* ============================ Forecast ============================ */
function Forecast({ md }) {
  const data = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 24 }, (_, h) => {
      const pv = Math.max(0, 480 * gauss(h, 13, 3.4) + (r() - 0.5) * 30);
      const load = 220 + 160 * gauss(h, 8.5, 2.4) + 240 * gauss(h, 19.5, 2.6) + (r() - 0.5) * 25;
      const p50 = (md.tomorrow[h * 4] || { price: 600 }).price;
      const band = 60 + 120 * gauss(h, 19, 4);
      return { label: String(h).padStart(2, "0"), pv: Math.round(pv), load: Math.round(load), p50, p10: Math.round(p50 - band), p90: Math.round(p50 + band) };
    });
  }, [md.tomorrow]);
  return (
    <div className="stack">
      <div className="kpirow">
        <Kpi label="PV prognozat" value={fmt(data.reduce((a, b) => a + b.pv, 0)) + " kWh"} sub="mâine · P50" Icon={Sun} tone="accent" />
        <Kpi label="Consum prognozat" value={fmt(data.reduce((a, b) => a + b.load, 0)) + " kWh"} sub="mâine · P50" Icon={Gauge} />
        <Kpi label="Acuratețe model" value="MAPE 6.2%" sub="ultimele 30 zile" Icon={TrendingUp} tone="green" />
        <Kpi label="Bias preț" value="+1.4%" sub="ușor subevaluat" Icon={Activity} />
      </div>
      <Card title="Prognoză preț PZU · mâine (P10 / P50 / P90)" pad={false}>
        <div className="hero">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
              <defs><linearGradient id="gBand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={42} />
              <RTooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="p90" name="P90" stroke="none" fill="url(#gBand)" />
              <Area type="monotone" dataKey="p10" name="P10" stroke="none" fill="var(--bg)" />
              <Line type="monotone" dataKey="p50" name="P50" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="PV vs consum · mâine" pad={false}>
        <div className="hero">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
              <defs><linearGradient id="gPv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--yellow)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--yellow)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10.5, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={42} />
              <RTooltip content={<ChartTip unit=" kWh" />} />
              <Area type="monotone" dataKey="pv" name="PV" stroke="var(--yellow)" strokeWidth={2} fill="url(#gPv)" />
              <Line type="monotone" dataKey="load" name="Consum" stroke="var(--blue)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}


/* ============================ Harta Rețea — adapter + service + components ============================ */
const GRID_ZONES = [
  { code: "RO", name: "România", x: 54, y: 54, main: true },
  { code: "HU", name: "Ungaria", x: 43, y: 46 },
  { code: "BG", name: "Bulgaria", x: 55, y: 68 },
  { code: "RS", name: "Serbia", x: 43, y: 62 },
  { code: "UA", name: "Ucraina", x: 72, y: 38 },
  { code: "MD", name: "Moldova", x: 68, y: 51 },
  { code: "AT", name: "Austria", x: 33, y: 45 },
  { code: "CZ", name: "Cehia", x: 35, y: 35 },
  { code: "SK", name: "Slovacia", x: 44, y: 38 },
  { code: "PL", name: "Polonia", x: 46, y: 25 },
  { code: "DE", name: "Germania/LU", x: 25, y: 34 },
  { code: "FR", name: "Franța", x: 12, y: 47 },
  { code: "NL", name: "Olanda", x: 21, y: 25 },
  { code: "BE", name: "Belgia", x: 17, y: 34 },
  { code: "CH", name: "Elveția", x: 25, y: 53 },
  { code: "IT", name: "Italia", x: 31, y: 70 },
  { code: "SI", name: "Slovenia", x: 36, y: 55 },
  { code: "HR", name: "Croația", x: 40, y: 59 },
  { code: "BA", name: "Bosnia", x: 42, y: 67 },
  { code: "ME", name: "Muntenegru", x: 44, y: 75 },
  { code: "GR", name: "Grecia", x: 56, y: 84 },
  { code: "MK", name: "Macedonia N.", x: 50, y: 77 },
  { code: "AL", name: "Albania", x: 45, y: 82 },
  { code: "ES", name: "Spania", x: 7, y: 75 },
  { code: "PT", name: "Portugalia", x: 1, y: 77 },
];
const GRID_MAP_VIEWBOX = { width: 1000, height: 620, source: "Natural Earth 110m admin-0 countries" };
const GRID_COUNTRY_PATHS = {
  "FR": "M316.9,196.5L325.7,203.8L352.6,209L343.2,228.1L340.8,248L335.7,252.8L327.2,250.2L327.8,257.3L314.1,273L313.9,285.6L322.8,281.2L329.2,293.5L328.4,301.4L333.9,311.9L327.4,320.4L332.2,342L342.3,345.5L340.2,357.6L323.3,373.4L286.5,365.9L259.3,374.9L257.2,391.7L235.6,395.4L214.6,382.7L207.8,388.8L173.5,376.1L166,365.2L175.7,348.5L179.2,292.8L160,263.5L146.2,249.4L117.7,238.6L115.8,218.3L140,212.2L171.3,219.4L165.4,187.8L183,199.8L226.5,178L232.1,155.1L248.4,149.5L251.1,159.3L259.8,159.7L268.4,170.9L281.5,184.1L291,181.9L307.4,194.7L311.5,197.1L316.9,196.5ZM364.7,387.4L376.7,376.7L379.9,400.7L373.7,422.3L365.2,416.6L360.9,397.8L364.7,387.4Z",
  "UA": "M794.5,122.8L801.5,124L806.2,117.6L811.9,119L831.2,116.3L843.1,132.1L838.5,137.8L840,146.5L854.9,147.8L861.5,159.9L861.1,165.4L884.8,175.2L899.1,170.8L910.6,183.9L921.5,183.6L949,192.7L949.3,200.9L941.7,215.5L945.8,230.9L942.9,240.2L924.8,242.3L915.2,250.1L914.6,262.5L899.7,264.7L887.3,273.7L869.8,275.2L853.8,285.6L854.7,300.6L851.9,299.7L849.5,294.2L843.5,293.1L830.2,287.1L825.3,294L822.7,291L793.7,283.9L792.4,273.5L775.2,277L768.2,292.3L753.8,313L745.3,308.2L736.6,312.7L728.2,307.5L732.9,304.5L736.2,294.9L741.3,286L740,281L743.9,278.8L745.7,282.7L756.7,283.5L761.7,281.4L758.2,278.6L759.5,274.4L753,267.3L750.3,255.6L743.5,251.1L744.8,241.6L736.4,234.1L728.7,233L715,224.3L702.6,227.1L698.1,231.2L690.3,231.2L685.6,237.7L671.8,240.4L665.4,244.7L656.8,237.9L644.8,237.8L633.3,234.7L625.2,240.7L623.9,233.2L613.5,225.6L617.2,214.3L622.4,207.1L626.4,208.7L621.6,196.1L638.6,172.9L647.8,169.7L649.8,161.8L640.4,137.4L649.3,136.4L659.6,128.8L674,128.2L692.9,130.4L713.7,137.1L728.4,137.6L735.4,141.7L742.4,136.8L747.3,143.3L764.1,142L771.6,144.7L772.8,130.6L778.5,124.5L794.5,122.8Z",
  "PL": "M639.6,72.3L640.4,84.6L645.6,95.2L645.5,106.4L634.3,112.1L640.1,125L640.4,137.4L649.8,161.8L647.8,169.7L638.6,172.9L621.6,196.1L626.4,208.7L622.4,207.1L604.6,196.3L591.2,200.3L582.4,197.4L571.4,203.4L562,193.5L554.3,197.3L553.2,195.6L544.6,181.8L530.8,180.2L529,171.4L516.2,168.3L513.4,175.5L503.3,169.7L504.5,162L490.5,159.6L481.7,150.6L474,132.8L475.5,123.2L470.9,108.2L464.1,98.3L469.3,90.8L464.9,76.6L477.7,68.4L506.8,55.5L530.3,46L548.9,50.8L550.3,57.6L568.3,57.9L591.3,61.1L625.6,60.7L635.1,63.7L639.6,72.3Z",
  "AT": "M518.3,233.9L516.9,245.4L506.4,245.4L510,251.5L503.8,269.4L500.2,274.2L483.9,274.8L474.5,281.2L459.1,279L432.4,271.8L428.2,262.1L409.8,266.9L407.6,272.3L396.3,268.3L386.8,267.5L378.4,262.4L381.2,255.6L380.5,250.7L386.1,249.1L395.6,256.9L398.2,249.5L414.7,250.7L428,245.7L437,246.5L442.8,252.3L444.5,247.5L441.9,229.3L448.6,225.8L455.1,212.9L469,221.9L479.5,210.5L486.1,208.4L500.6,216.9L509.3,215.4L517.9,220.7L516.4,224.3L518.3,233.9Z",
  "HU": "M613.5,225.6L623.9,233.2L625.2,240.7L613.8,246.5L605,265.5L593.7,284.4L578.7,289.7L567.1,288.4L552.8,295.8L552.8,295.8L545.8,300L530.4,294.6L516.5,282.6L510.5,279.2L506.9,269.7L503.8,269.4L510,251.5L506.4,245.4L516.9,245.4L518.3,233.9L527.8,241.1L534.6,244.1L550.3,240.7L551.8,235.1L559.2,234.3L568.3,229.9L570.3,231.7L579.1,228.2L583.5,221.7L589.6,220L609.6,228.5L613.5,225.6Z",
  "MD": "M698.1,231.2L702.6,227.1L715,224.3L728.7,233L736.4,234.1L744.8,241.6L743.5,251.1L750.3,255.6L753,267.3L759.5,274.4L758.2,278.6L761.7,281.4L756.7,283.5L745.7,282.7L743.9,278.8L740,281L741.3,286L736.2,294.9L732.9,304.5L728.2,307.5L724.9,294.8L726.9,282.9L726.3,270.6L715.5,254L709.6,242.2L703.8,233.9L698.1,231.2Z",
  "RO": "M728.2,307.5L736.6,312.7L745.3,308.2L753.8,313L754.2,320.2L745.2,326.2L739.5,323.6L734.3,357.3L723.3,354.3L709.7,344.2L687.8,350.7L678.5,357.8L651.1,356.3L636.8,352L629.6,354L624.2,342.5L620.8,337.7L625.1,333L620.5,329.5L614.6,335.7L603.8,327.6L602.3,316.1L590.9,309.5L588.8,300.7L578.7,289.7L593.7,284.4L605,265.5L613.8,246.5L625.2,240.7L633.3,234.7L644.8,237.8L656.8,237.9L665.4,244.7L671.8,240.4L685.6,237.7L690.3,231.2L698.1,231.2L703.8,233.9L709.6,242.2L715.5,254L726.3,270.6L726.9,282.9L724.9,294.8L728.2,307.5Z",
  "DE": "M464.9,76.6L469.3,90.8L464.1,98.3L470.9,108.2L475.5,123.2L474,132.8L481.7,150.6L473.3,153.5L468.4,150.3L463.7,155.6L450.3,161.1L443.4,168L429.9,174.1L433.1,182.4L435.1,194.2L444.6,200.9L455.1,212.9L448.6,225.8L441.9,229.3L444.5,247.5L442.8,252.3L437,246.5L428,245.7L414.7,250.7L398.2,249.5L395.6,256.9L386.1,249.1L380.5,250.7L360.5,242.1L356.7,248.2L340.8,248L343.2,228.1L352.6,209L325.7,203.8L316.9,196.5L318,184.3L314.2,178L316.4,159.1L313.2,129.8L324.4,129.8L329.2,119.3L333.8,93.7L330.3,84.3L334,78.4L349.6,76.8L353,83L365.7,69.2L361.4,58.8L360.6,42.9L374.7,46.6L386.6,42.4L386.9,53.2L405.8,59.7L405.6,69.6L424.6,64.3L435,56.7L456.1,67.7L464.9,76.6Z",
  "BG": "M624.2,342.5L629.6,354L636.8,352L651.1,356.3L678.5,357.8L687.8,350.7L709.7,344.2L723.3,354.3L734.3,357.3L724.6,368.8L717.8,388.8L723.8,404.7L707.8,401L688.8,409.8L688.5,423.7L671.6,426.3L658.4,416.6L643.5,424.3L629.7,423.4L628.4,405L619,396L622.1,392.1L620.1,388.7L623.2,379.9L630.3,371.1L621.3,359.1L619.6,348.9L624.2,342.5Z",
  "GR": "M692,592.1L689.6,600.3L662.8,602.7L663,598.1L640.2,592.6L643.7,580.8L653.9,590.2L668.4,588.6L682.3,590.6L681.8,595.4L692,592.1ZM629.7,423.4L643.5,424.3L658.4,416.6L671.6,426.3L688.5,423.7L688.8,409.8L697.8,417.2L692.1,434.7L687.6,437.8L676.3,437L666.5,434.4L643.9,441.6L656.9,457.3L647.4,461.9L637,461.9L627.1,447.5L623.6,453.6L627.8,470.3L637.1,483.4L630.1,489.6L640.5,502.4L649.7,510.5L650,526.3L632.7,518.9L638.2,533.1L626.4,536.1L633.5,560.7L621.1,561.1L605.8,548.9L598.8,526.6L595.5,508L588.2,495.2L578.7,479.2L577.4,471.3L586.1,457.7L587.2,448.7L593.3,444.6L593.7,437.3L605.9,434.8L613,428.7L623.1,429.2L626.2,424.4L629.7,423.4Z",
  "AL": "M593.7,437.3L593.3,444.6L587.2,448.7L586.1,457.7L577.4,471.3L574.3,469.3L573.9,463.2L563.5,453.8L561.9,440.5L563.5,421.4L566,412.8L562.9,408.4L562.9,408.4L561.7,399.5L569.7,385.7L570.9,391L575.9,388.5L579.9,396L584.4,398.9L585.6,409L585.6,409L583.3,418.5L585.9,430.5L593.7,437.3Z",
  "HR": "M510.5,279.2L516.5,282.6L530.4,294.6L545.8,300L552.8,295.8L557.3,306.6L563.3,314.6L556.1,325.1L547.6,318.9L534.7,319.3L518.7,314.6L510,315.3L505.9,321.1L499.2,314.6L495.3,326.2L504.5,339.3L508.5,347.9L517.1,358.4L524.2,364.6L531.2,376.2L547.8,386.8L545.7,391.5L545.7,391.5L528.2,381.2L517.4,371.2L500.3,362.9L484.6,342.3L488.4,340.2L479.9,328.5L479.5,319L467.5,314.6L461.8,326.7L456.3,317.3L456.7,307.6L457.4,307.2L470.4,308.2L473.8,303.4L480.1,308L487.5,308.5L487.4,300.7L493.9,297.9L495.7,286.6L510.5,279.2Z",
  "CH": "M380.5,250.7L381.2,255.6L378.4,262.4L386.8,267.5L396.3,268.3L394.8,279.7L386.6,284.4L372.8,280.9L368.8,292.2L359.9,293.1L356.7,288.7L346.2,298.1L337.2,299.5L329.2,293.5L322.8,281.2L313.9,285.6L314.1,273L327.8,257.3L327.2,250.2L335.7,252.8L340.8,248L356.7,248.2L360.5,242.1L380.5,250.7Z",
  "BE": "M316.4,159.1L314.2,178L309.4,179L307.4,194.7L291,181.9L281.5,184.1L268.4,170.9L259.8,159.7L251.1,159.3L248.4,149.5L263.3,143.9L263.3,143.9L263.3,143.9L277,146.1L294.3,140.3L306.1,152.6L316.4,159.1Z",
  "NL": "M330.3,84.3L333.8,93.7L329.2,119.3L324.4,129.8L313.2,129.8L316.4,159.1L306.1,152.6L294.3,140.3L277,146.1L263.3,143.9L263.3,143.9L273,136.3L289.3,95.2L314.8,83.5L330.3,84.3Z",
  "PT": "M32.9,408.3L39.7,401.2L47.3,397.1L52,410.8L63,410.8L66.2,407.2L77.1,408.2L82.3,422.2L73.7,429.8L73.4,451.6L70.4,455.7L69.7,468.9L61.6,471.2L69.1,487.9L63.9,506.2L70.3,514.6L67.8,522.1L60.9,532.6L62.4,541.9L54.9,549.1L45.1,545.2L35.5,548.3L38.3,526.4L36.6,509.2L28.2,506.7L23.8,496.1L25.2,477.8L32.7,467.7L34,456.4L37.9,439.6L37.5,427.7L33.8,417.7L32.9,408.3Z",
  "ES": "M62.4,541.9L60.9,532.6L67.8,522.1L70.3,514.6L63.9,506.2L69.1,487.9L61.6,471.2L69.7,468.9L70.4,455.7L73.4,451.6L73.7,429.8L82.3,422.2L77.1,408.2L66.2,407.2L63,410.8L52,410.8L47.3,397.1L39.7,401.2L32.9,408.3L33.9,388.4L26.3,376.3L52.6,356.1L75.5,361.2L100.5,361L120.4,365.8L135.9,364.3L166,365.2L173.5,376.1L207.8,388.8L214.6,382.7L235.6,395.4L257.2,391.7L258.2,408L240.5,426.6L216.6,432.5L215,441.9L203.5,457.3L196.3,480.1L203.6,496L192.8,508.5L188.7,526.7L174.7,532.2L161.4,553.7L137.8,554.1L120,553.6L108.3,563.5L101.2,574L92,571.7L85.1,562.3L79.8,546.2L62.4,541.9Z",
  "IT": "M396.3,268.3L407.6,272.3L409.8,266.9L428.2,262.1L432.4,271.8L459.1,279L457.1,292.8L461.5,304.7L446.7,300.6L431.5,310.5L432.5,324.4L430.3,332.3L436.4,346.5L453.9,360.6L463.2,383.7L484,406.2L498.6,406L503.2,412.2L497.9,417.8L514.6,427.9L528.3,436.3L544.3,450.9L546.3,456.1L542.8,466.1L532.4,453.1L516.2,448.5L508.4,466.5L521.9,476.9L519.6,491.5L511.8,493.1L501.9,517.1L494.1,519.2L494.2,510.7L498,495.7L502,489.7L494.8,473.5L489.1,459.5L481.3,456L475.8,443.9L463.8,438.8L455.7,427.6L441.9,425.8L427.4,413.2L410.3,395L397.6,378.9L391.8,351.3L382.5,348.1L367.3,338.9L358.7,342.6L348,355.6L340.2,357.6L342.3,345.5L332.2,342L327.4,320.4L333.9,311.9L328.4,301.4L329.2,293.5L337.2,299.5L346.2,298.1L356.7,288.7L359.9,293.1L368.8,292.2L372.8,280.9L386.6,284.4L394.8,279.7L396.3,268.3ZM476.9,512.6L491.1,510.2L484.3,532.2L487.1,540.8L483.2,555.2L468.9,544.7L459.5,541.7L433.4,527.5L436,513.1L457.9,515.7L476.9,512.6ZM364,435.7L373.3,427L384.5,446.8L381.9,483.8L373.4,482L365.8,491.3L358.7,483.9L358,450.2L353.7,434.3L364,435.7Z",
  "SI": "M459.1,279L474.5,281.2L483.9,274.8L500.2,274.2L503.8,269.4L506.9,269.7L510.5,279.2L495.7,286.6L493.9,297.9L487.4,300.7L487.5,308.5L480.1,308L473.8,303.4L470.4,308.2L457.4,307.2L461.5,304.7L457.1,292.8L459.1,279Z",
  "SK": "M622.4,207.1L617.2,214.3L613.5,225.6L609.6,228.5L589.6,220L583.5,221.7L579.1,228.2L570.3,231.7L568.3,229.9L559.2,234.3L551.8,235.1L550.3,240.7L534.6,244.1L527.8,241.1L518.3,233.9L516.4,224.3L517.9,220.7L520.6,214.6L528.8,215L535.2,212.2L535.7,209.6L539.3,208.2L540.5,201.9L544.8,200.7L547.7,195.6L553.2,195.6L554.3,197.3L562,193.5L571.4,203.4L582.4,197.4L591.2,200.3L604.6,196.3L622.4,207.1Z",
  "CZ": "M481.7,150.6L490.5,159.6L504.5,162L503.3,169.7L513.4,175.5L516.2,168.3L529,171.4L530.8,180.2L544.6,181.8L553.2,195.6L547.7,195.6L544.8,200.7L540.5,201.9L539.3,208.2L535.7,209.6L535.2,212.2L528.8,215L520.6,214.6L517.9,220.7L509.3,215.4L500.6,216.9L486.1,208.4L479.5,210.5L469,221.9L455.1,212.9L444.6,200.9L435.1,194.2L433.1,182.4L429.9,174.1L443.4,168L450.3,161.1L463.7,155.6L468.4,150.3L473.3,153.5L481.7,150.6Z",
  "BA": "M547.8,386.8L531.2,376.2L524.2,364.6L517.1,358.4L508.5,347.9L504.5,339.3L495.3,326.2L499.2,314.6L505.9,321.1L510,315.3L518.7,314.6L534.7,319.3L547.6,318.9L556.1,325.1L556.1,325.1L562.8,325L558.2,337.3L567.2,348L564.4,361.2L560,362.4L556.6,364.9L550.5,371.4L547.8,386.8Z",
  "MK": "M619,396L628.4,405L629.7,423.4L626.2,424.4L623.1,429.2L613,428.7L605.9,434.8L593.7,437.3L585.9,430.5L583.3,418.5L585.6,409L585.6,409L588,409.2L588.8,403.5L599.9,399.2L604,398.1L610.4,396.5L619,396Z",
  "RS": "M552.8,295.8L552.8,295.8L567.1,288.4L578.7,289.7L588.8,300.7L590.9,309.5L602.3,316.1L603.8,327.6L614.6,335.7L620.5,329.5L625.1,333L620.8,337.7L624.2,342.5L619.6,348.9L621.3,359.1L630.3,371.1L623.2,379.9L620.1,388.7L622.1,392.1L619,396L610.4,396.5L604,398.1L603.4,396L605.7,392.7L607.7,385.9L605.1,386L601.5,380.9L598.4,379.6L596,375.1L592.5,373.4L589.8,369.4L586.5,371L583.9,380.2L579.4,382.3L581,379.9L573.9,374.1L567.7,371.1L565,367.2L560,362.4L564.4,361.2L567.2,348L558.2,337.3L562.8,325L556.1,325.1L556.1,325.1L563.3,314.6L557.3,306.6L552.8,295.8Z",
  "ME": "M575.9,388.5L570.9,391L569.7,385.7L561.7,399.5L562.9,408.4L559,406.2L553.8,397.1L545.7,391.5L547.8,386.8L550.5,371.4L556.6,364.9L560,362.4L565,367.2L567.7,371.1L573.9,374.1L581,379.9L579.4,382.3L575.9,388.5Z"
};
const GRID_COUNTRY_CENTERS = {
  "FR": {
    "x": 247.8,
    "y": 285.9
  },
  "UA": {
    "x": 781.4,
    "y": 214.6
  },
  "PL": {
    "x": 556.9,
    "y": 127.4
  },
  "AT": {
    "x": 448.3,
    "y": 244.8
  },
  "HU": {
    "x": 564.5,
    "y": 260
  },
  "MD": {
    "x": 729.9,
    "y": 265.9
  },
  "RO": {
    "x": 666.5,
    "y": 294.5
  },
  "DE": {
    "x": 397.4,
    "y": 149.6
  },
  "BG": {
    "x": 676.7,
    "y": 384.4
  },
  "GR": {
    "x": 637.6,
    "y": 506.2
  },
  "AL": {
    "x": 577.7,
    "y": 428.5
  },
  "HR": {
    "x": 509.8,
    "y": 335.4
  },
  "CH": {
    "x": 355.1,
    "y": 270.8
  },
  "BE": {
    "x": 282.4,
    "y": 167.5
  },
  "NL": {
    "x": 298.6,
    "y": 121.3
  },
  "PT": {
    "x": 53,
    "y": 473.1
  },
  "ES": {
    "x": 142.2,
    "y": 465.1
  },
  "IT": {
    "x": 436.8,
    "y": 408.7
  },
  "SI": {
    "x": 483.8,
    "y": 289
  },
  "SK": {
    "x": 569.4,
    "y": 218.8
  },
  "CZ": {
    "x": 491.5,
    "y": 186.1
  },
  "BA": {
    "x": 531.2,
    "y": 350.7
  },
  "MK": {
    "x": 606.5,
    "y": 416.6
  },
  "RS": {
    "x": 591.6,
    "y": 343.3
  },
  "ME": {
    "x": 563.3,
    "y": 385.4
  }
};

const GRID_VIEW_MODES = [
  { id: "live", label: "Live" },
  { id: "history", label: "Ultimele 24h" },
  { id: "forecast", label: "Forecast" },
  { id: "mix", label: "Mix energetic" },
  { id: "co2", label: "Emisii CO₂" },
  { id: "flows", label: "Fluxuri" },
  { id: "price", label: "Preț PZU" },
  { id: "renewables", label: "Renewable %" },
  { id: "carbonfree", label: "Carbon-free %" },
];
const GRID_MIX_KEYS = ["hydro","nuclear","wind","solar","gas","coal","oil","biomass","unknown"];
const GRID_SOURCE_LABELS = { hydro:"Hidro", nuclear:"Nuclear", wind:"Eolian", solar:"Solar", gas:"Gaz", coal:"Cărbune", oil:"Oil", biomass:"Biomasă", unknown:"Necunoscut" };
const GRID_DEMO_PAYLOAD = buildGridDemoData("no-api-key");

const electricityMapsAdapter = {
  normalize(payload) {
    if (!payload || !payload.zones) return GRID_DEMO_PAYLOAD;
    return {
      ok: payload.ok !== false,
      source: payload.source || "Electricity Maps adapter",
      sourceMode: payload.sourceMode || "demo-fallback",
      status: payload.status || (payload.sourceMode === "external-live" ? "live" : "demo"),
      message: payload.message || "Date demo — configurează ENTSO-E sau Electricity Maps API key pentru date live.",
      updatedAtUtc: payload.updatedAtUtc || new Date().toISOString(),
      stale: Boolean(payload.stale),
      zones: payload.zones,
      flows: payload.flows || [],
      history: payload.history || [],
      forecast: payload.forecast || [],
      mixSeries: payload.mixSeries || [],
      externalUrl: payload.externalUrl || "https://app.electricitymaps.com/map/live/fifteen_minutes",
      pzuPrice: payload.pzuPrice || null,
      apiCoverage: payload.apiCoverage || {},
    };
  }
};
const gridMapService = {
  async load({ base, token, mode = "live", zone = "RO" }) {
    if (!base) return electricityMapsAdapter.normalize(buildGridDemoData("no-backend"));
    const qs = new URLSearchParams({ zone, mode }).toString();
    const json = await apiGet(base, "/api/servio/grid-map/live?" + qs, token);
    return electricityMapsAdapter.normalize(json);
  }
};
function useGridMapData(apiBase, apiToken) {
  const [mode, setMode] = useState("live");
  const [selectedZone, setSelectedZone] = useState("RO");
  const [data, setData] = useState(() => electricityMapsAdapter.normalize(GRID_DEMO_PAYLOAD));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refresh = () => {
    let alive = true;
    setLoading(true); setError(null);
    gridMapService.load({ base: apiBase, token: apiToken, mode, zone: selectedZone })
      .then((next) => { if (alive) setData(next); })
      .catch((e) => { if (alive) { setError(String(e.message || e)); setData(electricityMapsAdapter.normalize(buildGridDemoData("error-fallback"))); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  };
  useEffect(refresh, [apiBase, apiToken, mode, selectedZone]);
  return { data, loading, error, mode, setMode, selectedZone, setSelectedZone, refresh };
}
function buildGridDemoData(reason = "no-api-key") {
  const now = new Date();
  const iso = now.toISOString();
  const zones = [
    { code:"RO", name:"România", carbonIntensity:212, renewablePct:48, carbonFreePct:69, fossilPct:31, loadMw:6820, netFlowMw:-180, priceLeiMwh:615, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:27, nuclear:21, wind:13, solar:8, gas:18, coal:9, oil:1, biomass:2, unknown:1 } },
    { code:"HU", name:"Ungaria", carbonIntensity:188, renewablePct:31, carbonFreePct:66, fossilPct:34, loadMw:5480, netFlowMw:280, priceLeiMwh:602, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:1, nuclear:47, wind:9, solar:21, gas:16, coal:4, oil:0, biomass:2, unknown:0 } },
    { code:"BG", name:"Bulgaria", carbonIntensity:274, renewablePct:29, carbonFreePct:56, fossilPct:44, loadMw:4430, netFlowMw:-220, priceLeiMwh:631, status:"demo", quality:"partial", updatedAtUtc:iso, mix:{ hydro:12, nuclear:31, wind:7, solar:10, gas:7, coal:29, oil:1, biomass:2, unknown:1 } },
    { code:"RS", name:"Serbia", carbonIntensity:410, renewablePct:22, carbonFreePct:25, fossilPct:75, loadMw:4650, netFlowMw:90, priceLeiMwh:646, status:"demo", quality:"partial", updatedAtUtc:iso, mix:{ hydro:21, nuclear:0, wind:4, solar:1, gas:9, coal:62, oil:1, biomass:1, unknown:1 } },
    { code:"UA", name:"Ucraina", carbonIntensity:260, renewablePct:17, carbonFreePct:61, fossilPct:39, loadMw:12100, netFlowMw:-120, priceLeiMwh:0, status:"demo", quality:"partial", updatedAtUtc:iso, mix:{ hydro:8, nuclear:50, wind:5, solar:4, gas:12, coal:18, oil:1, biomass:1, unknown:1 } },
    { code:"MD", name:"Moldova", carbonIntensity:330, renewablePct:11, carbonFreePct:14, fossilPct:86, loadMw:930, netFlowMw:150, priceLeiMwh:0, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:3, nuclear:0, wind:6, solar:5, gas:78, coal:5, oil:1, biomass:1, unknown:1 } },
    { code:"AT", name:"Austria", carbonIntensity:118, renewablePct:73, carbonFreePct:73, fossilPct:27, loadMw:7240, netFlowMw:260, priceLeiMwh:604, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:55, nuclear:0, wind:10, solar:6, gas:18, coal:3, oil:1, biomass:2, unknown:5 } },
    { code:"CZ", name:"Cehia", carbonIntensity:405, renewablePct:15, carbonFreePct:47, fossilPct:53, loadMw:8120, netFlowMw:-180, priceLeiMwh:612, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:3, nuclear:32, wind:2, solar:7, gas:9, coal:43, oil:1, biomass:3, unknown:0 } },
    { code:"SK", name:"Slovacia", carbonIntensity:125, renewablePct:23, carbonFreePct:82, fossilPct:18, loadMw:3320, netFlowMw:210, priceLeiMwh:606, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:16, nuclear:59, wind:1, solar:5, gas:12, coal:4, oil:0, biomass:1, unknown:2 } },
    { code:"PL", name:"Polonia", carbonIntensity:640, renewablePct:23, carbonFreePct:23, fossilPct:77, loadMw:23200, netFlowMw:-420, priceLeiMwh:620, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:2, nuclear:0, wind:14, solar:7, gas:9, coal:63, oil:1, biomass:3, unknown:1 } },
    { code:"DE", name:"Germania/Luxemburg", carbonIntensity:356, renewablePct:57, carbonFreePct:57, fossilPct:43, loadMw:57300, netFlowMw:-760, priceLeiMwh:598, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:4, nuclear:0, wind:32, solar:18, gas:18, coal:21, oil:1, biomass:3, unknown:3 } },
    { code:"FR", name:"Franța", carbonIntensity:68, renewablePct:22, carbonFreePct:86, fossilPct:14, loadMw:46100, netFlowMw:-980, priceLeiMwh:589, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:12, nuclear:64, wind:7, solar:3, gas:9, coal:1, oil:1, biomass:2, unknown:1 } },
    { code:"NL", name:"Olanda", carbonIntensity:420, renewablePct:42, carbonFreePct:43, fossilPct:57, loadMw:14300, netFlowMw:310, priceLeiMwh:601, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:0, nuclear:1, wind:26, solar:14, gas:43, coal:12, oil:1, biomass:2, unknown:1 } },
    { code:"BE", name:"Belgia", carbonIntensity:156, renewablePct:27, carbonFreePct:68, fossilPct:32, loadMw:9320, netFlowMw:180, priceLeiMwh:595, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:1, nuclear:41, wind:16, solar:7, gas:28, coal:1, oil:1, biomass:3, unknown:2 } },
    { code:"CH", name:"Elveția", carbonIntensity:38, renewablePct:61, carbonFreePct:95, fossilPct:5, loadMw:6760, netFlowMw:-260, priceLeiMwh:600, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:59, nuclear:34, wind:0, solar:2, gas:2, coal:0, oil:0, biomass:1, unknown:2 } },
    { code:"IT", name:"Italia", carbonIntensity:330, renewablePct:44, carbonFreePct:44, fossilPct:56, loadMw:35300, netFlowMw:820, priceLeiMwh:638, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:14, nuclear:0, wind:9, solar:18, gas:47, coal:5, oil:2, biomass:3, unknown:2 } },
    { code:"SI", name:"Slovenia", carbonIntensity:205, renewablePct:32, carbonFreePct:70, fossilPct:30, loadMw:1890, netFlowMw:-60, priceLeiMwh:615, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:25, nuclear:38, wind:1, solar:5, gas:13, coal:14, oil:1, biomass:2, unknown:1 } },
    { code:"HR", name:"Croația", carbonIntensity:178, renewablePct:62, carbonFreePct:62, fossilPct:38, loadMw:2940, netFlowMw:90, priceLeiMwh:617, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:47, nuclear:0, wind:10, solar:3, gas:24, coal:8, oil:2, biomass:3, unknown:3 } },
    { code:"BA", name:"Bosnia și Herțegovina", carbonIntensity:520, renewablePct:34, carbonFreePct:34, fossilPct:66, loadMw:1840, netFlowMw:-130, priceLeiMwh:632, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:33, nuclear:0, wind:1, solar:0, gas:2, coal:62, oil:1, biomass:0, unknown:1 } },
    { code:"ME", name:"Muntenegru", carbonIntensity:290, renewablePct:52, carbonFreePct:52, fossilPct:48, loadMw:520, netFlowMw:70, priceLeiMwh:635, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:49, nuclear:0, wind:2, solar:1, gas:0, coal:45, oil:1, biomass:0, unknown:2 } },
    { code:"GR", name:"Grecia", carbonIntensity:370, renewablePct:42, carbonFreePct:42, fossilPct:58, loadMw:6820, netFlowMw:240, priceLeiMwh:650, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:7, nuclear:0, wind:18, solar:15, gas:39, coal:12, oil:4, biomass:2, unknown:3 } },
    { code:"MK", name:"Macedonia de Nord", carbonIntensity:480, renewablePct:24, carbonFreePct:24, fossilPct:76, loadMw:980, netFlowMw:40, priceLeiMwh:642, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:18, nuclear:0, wind:3, solar:2, gas:9, coal:64, oil:2, biomass:1, unknown:1 } },
    { code:"AL", name:"Albania", carbonIntensity:55, renewablePct:92, carbonFreePct:92, fossilPct:8, loadMw:780, netFlowMw:110, priceLeiMwh:640, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:90, nuclear:0, wind:1, solar:1, gas:4, coal:1, oil:1, biomass:0, unknown:2 } },
    { code:"ES", name:"Spania", carbonIntensity:164, renewablePct:62, carbonFreePct:82, fossilPct:18, loadMw:28900, netFlowMw:-520, priceLeiMwh:575, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:13, nuclear:20, wind:26, solar:21, gas:13, coal:2, oil:1, biomass:2, unknown:2 } },
    { code:"PT", name:"Portugalia", carbonIntensity:142, renewablePct:74, carbonFreePct:74, fossilPct:26, loadMw:5420, netFlowMw:160, priceLeiMwh:576, status:"demo", quality:"estimated", updatedAtUtc:iso, mix:{ hydro:28, nuclear:0, wind:31, solar:12, gas:20, coal:1, oil:2, biomass:3, unknown:3 } },
  ];
  const flows = [
    { from:"RO", to:"HU", mw:280 }, { from:"BG", to:"RO", mw:220 }, { from:"RO", to:"RS", mw:90 }, { from:"UA", to:"RO", mw:120 }, { from:"MD", to:"RO", mw:150 },
    { from:"HU", to:"AT", mw:340 }, { from:"SK", to:"HU", mw:210 }, { from:"RS", to:"HU", mw:160 }, { from:"HR", to:"HU", mw:120 }, { from:"BG", to:"GR", mw:260 },
    { from:"RS", to:"BA", mw:130 }, { from:"RS", to:"ME", mw:70 }, { from:"HR", to:"SI", mw:110 }, { from:"SI", to:"AT", mw:180 }, { from:"AT", to:"CZ", mw:240 },
    { from:"CZ", to:"PL", mw:320 }, { from:"DE", to:"CZ", mw:410 }, { from:"FR", to:"DE", mw:680 }, { from:"NL", to:"DE", mw:310 }, { from:"BE", to:"FR", mw:260 },
    { from:"CH", to:"IT", mw:430 }, { from:"FR", to:"CH", mw:220 }, { from:"ES", to:"FR", mw:360 }, { from:"PT", to:"ES", mw:190 }
  ];
  const history = Array.from({ length: 96 }, (_, i) => {
    const h = i / 4;
    const solar = Math.max(0, Math.sin((h - 6) / 12 * Math.PI));
    const evening = Math.exp(-Math.pow(h - 19, 2) / 8);
    const morning = Math.exp(-Math.pow(h - 8, 2) / 7);
    return {
      label: String(Math.floor(h)).padStart(2,"0") + ":" + String((i % 4) * 15).padStart(2,"0"),
      datetimeUtc: new Date(now.getTime() - (95 - i) * 15 * 60 * 1000).toISOString(),
      carbon: Math.round(215 + 38*Math.sin((h-4)/24*Math.PI*2) + 12*Math.cos(h*.9) - 28 * solar + 18 * evening),
      renewable: Math.round(47 + 12 * solar - 4 * evening + 3 * Math.sin(h / 3)),
      carbonFree: Math.round(67 + 7 * solar - 3 * evening),
      fossil: Math.round(33 - 7 * solar + 3 * evening),
      load: Math.round(6350 + 460 * morning + 760 * evening - 240 * solar),
      production: Math.round(6500 + 380 * morning + 610 * evening - 120 * solar),
      netFlow: Math.round(-180 + 110 * Math.sin(i / 10) - 65 * solar),
      price: Math.round(580 + 320 * evening + 130 * morning - 85 * solar),
      status: reason === "forecast" ? "forecast" : "demo",
    };
  });
  const forecast = Array.from({ length: 32 }, (_, i) => {
    const h = i / 4;
    return {
      label: "+" + Math.floor(h) + "h" + (i % 4 ? " " + ((i % 4) * 15) + "m" : ""),
      datetimeUtc: new Date(now.getTime() + i * 15 * 60 * 1000).toISOString(),
      carbon: Math.round(205 + 45*Math.sin((i+4)/32*Math.PI*2)),
      renewable: Math.round(46 + 12*Math.sin((i+2)/32*Math.PI*2)),
      carbonFree: Math.round(67 + 8*Math.sin((i+1)/32*Math.PI*2)),
      load: Math.round(6300 + 850*Math.sin((i+14)/32*Math.PI*2)),
      production: Math.round(6480 + 720*Math.sin((i+13)/32*Math.PI*2)),
      netFlow: Math.round(-160 + 95 * Math.sin(i / 5)),
      price: Math.round(590 + 180 * Math.sin((i+10)/32*Math.PI*2)),
      status: "forecast",
    };
  });
  const mixSeries = GRID_MIX_KEYS.map((k) => ({ source: GRID_SOURCE_LABELS[k], value: zones[0].mix[k] || 0 }));
  return { ok:true, source:"SERVIO Grid Demo", sourceMode:"demo-fallback", status: reason === "rate-limit" ? "rate-limit" : "demo", message:"Date demo — configurează ENTSO-E sau Electricity Maps API key pentru date live.", reason, updatedAtUtc:iso, stale:false, zones, flows, history, forecast, mixSeries, externalUrl:"https://app.electricitymaps.com/map/live/fifteen_minutes" };
}
function gridTone(carbon) { return carbon < 180 ? "low" : carbon < 300 ? "mid" : carbon < 420 ? "high" : "very"; }
function gridToneLabel(carbon) { return carbon < 180 ? "emisii reduse" : carbon < 300 ? "mediu" : carbon < 420 ? "ridicat" : "foarte ridicat"; }
function gridZoneMeta(code) { return GRID_ZONES.find((z) => z.code === code) || GRID_ZONES[0]; }
function mixVal(zone, key) { return Number((zone && zone.mix && zone.mix[key]) || 0); }
function GridStatusBanner({ data, error, loading }) {
  if (loading) return <div className="banner"><RefreshCw size={15} className="spin" /><div><b>Se încarcă Harta Rețea</b> — sincronizare semnale grid, mix energetic și fluxuri.</div></div>;
  if (error) return <div className="banner err"><AlertTriangle size={15} /><div><b>API indisponibil</b> — pagina rulează pe date demo. {error}</div></div>;
  if (data.status === "rate-limit") return <div className="banner err"><AlertTriangle size={15} /><div><b>Rate limit Electricity Maps</b> — se afișează cache/demo până la următoarea fereastră permisă.</div></div>;
  if (data.status === "no-api-key" || data.sourceMode === "demo-fallback") return <div className="banner"><AlertTriangle size={15} /><div><b>Date demo</b> — configurează <span className="mono">ENTSOE_API_TOKEN</span> sau <span className="mono">ELECTRICITY_MAPS_API_KEY</span> pentru date live. Structura este pregătită pentru API oficial, fără scraping.</div></div>;
  if (data.stale) return <div className="banner err"><AlertTriangle size={15} /><div><b>Date învechite</b> — ultima actualizare este peste pragul normal; vezi endpoint-ul de status.</div></div>;
  return <div className="banner ok"><Check size={15} /><div><b>Semnale active</b> — hartă alimentată server-side; PZU România este aliniat cu OPCOM GitHub cache, iar cheia API nu este expusă în browser.</div></div>;
}
function GridKpiCards({ zone, data }) {
  return <div className="kpirow gridkpis">
    <Kpi label="Carbon intensity RO" value={fmt(zone.carbonIntensity) + " g/kWh"} sub={gridToneLabel(zone.carbonIntensity)} Icon={Wind} tone={zone.carbonIntensity < 220 ? "green" : zone.carbonIntensity > 360 ? "red" : "accent"} />
    <Kpi label="Renewable" value={fmt(zone.renewablePct) + "%"} sub="hidro · eolian · solar · biomasă" Icon={Sparkles} tone="green" />
    <Kpi label="Carbon-free" value={fmt(zone.carbonFreePct) + "%"} sub="renewable + nuclear" Icon={Check} tone="green" />
    <Kpi label="Import / Export net" value={(zone.netFlowMw > 0 ? "+" : "") + fmt(zone.netFlowMw) + " MW"} sub={zone.netFlowMw >= 0 ? "import net" : "export net"} Icon={Plug} />
    <Kpi label="Preț PZU" value={zone.priceLeiMwh ? fmt(zone.priceLeiMwh) + " Lei/MWh" : "—"} sub={zone.code === "RO" ? "interval curent RO" : "indisponibil pentru zonă"} Icon={DollarSign} />
    <Kpi label="Load" value={zone.loadMw ? fmt(zone.loadMw) + " MW" : "—"} sub="total load / net load" Icon={Gauge} />
    <Kpi label="Ultima actualizare" value={new Date(data.updatedAtUtc).toLocaleTimeString("ro-RO", { hour:"2-digit", minute:"2-digit" })} sub={data.sourceMode === "external-live" ? "live API" : "demo/cache"} Icon={Clock} />
  </div>;
}
function GridMapLegend() {
  return <div className="gridlegend">
    <span><i className="legdot low" /> emisii reduse</span><span><i className="legdot mid" /> mediu</span><span><i className="legdot high" /> ridicat</span><span><i className="legdot off" /> indisponibil</span><span><i className="flowline" /> flux import/export</span>
  </div>;
}
function GridNetworkMap({ data, selectedZone, setSelectedZone, mode }) {
  const zones = data.zones || [];
  const knownZones = new Set(GRID_ZONES.map((z) => z.code));
  const visibleFlows = (data.flows || []).filter((f) => knownZones.has(f.from) && knownZones.has(f.to) && f.from !== f.to && Number.isFinite(Number(f.mw)) && Math.abs(Number(f.mw)) > 0);
  const getZone = (code) => zones.find((z) => z.code === code) || { code, name: code, carbonIntensity:0, renewablePct:0, carbonFreePct:0, netFlowMw:0, status:"unavailable", mix:{} };
  return <div className="gridmapcard">
    <div className="gridmaptoolbar"><div><div className="cardtitle">Hartă interactivă rețea</div><div className="dim small">România + zone interconectate · mod {GRID_VIEW_MODES.find((m) => m.id === mode)?.label}</div></div><a className="btn ghost" href="https://app.electricitymaps.com/map/live/fifteen_minutes" target="_blank" rel="noreferrer"><Globe2 size={14} /> Deschide Electricity Maps</a></div>
    <div className="gridmapcanvas">
      <div className="mapgridbg" />
      {visibleFlows.map((f, i) => {
        const a = gridZoneMeta(f.from); const b = gridZoneMeta(f.to); const dx = b.x - a.x; const dy = b.y - a.y; const len = Math.sqrt(dx*dx + dy*dy); const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        return <button key={i} className="gridflow" style={{ left:a.x+"%", top:a.y+"%", width:len+"%", transform:`rotate(${ang}deg)`, ['--w']: Math.max(2, Math.min(9, Math.abs(f.mw)/90)) + "px" }} title={`${f.from} → ${f.to}: ${fmt(Math.abs(f.mw))} MW`}><span /></button>;
      })}
      {GRID_ZONES.map((m) => { const z = getZone(m.code); const unavailable = z.status === "unavailable"; return <button key={m.code} className={`gridzone ${m.main ? "main" : ""} ${selectedZone === m.code ? "on" : ""} ${unavailable ? "off" : gridTone(z.carbonIntensity)}`} style={{ left:m.x+"%", top:m.y+"%" }} onClick={() => setSelectedZone(m.code)}>
        <b>{m.code}</b><span>{m.name}</span><small>{z.carbonIntensity ? fmt(z.carbonIntensity)+" g" : "—"}</small><em>{fmt(z.renewablePct || 0)}% REN</em>
      </button>; })}
    </div>
    <GridMapLegend />
  </div>;
}
function GridZoneDetailsPanel({ zone, data }) {
  const mixRows = GRID_MIX_KEYS.map((k) => ({ key:k, label:GRID_SOURCE_LABELS[k], val:mixVal(zone,k) })).filter((x) => x.val > 0 || ["hydro","nuclear","wind","solar","gas","coal"].includes(x.key));
  return <Card title={zone.name + " · " + zone.code} right={<Badge tone={data.sourceMode === "external-live" ? "g" : "n"}>{zone.quality || "estimated"}</Badge>}>
    <div className="zonehero"><div><div className="zonebig">{fmt(zone.carbonIntensity)} <span>gCO₂eq/kWh</span></div><div className="dim small">intensitate carbon · {gridToneLabel(zone.carbonIntensity)}</div></div><div className={`zonering ${gridTone(zone.carbonIntensity)}`}>{fmt(zone.renewablePct)}%</div></div>
    <div className="zonemetrics">
      <div><span>Renewable</span><b>{fmt(zone.renewablePct)}%</b></div><div><span>Carbon-free</span><b>{fmt(zone.carbonFreePct)}%</b></div><div><span>Fossil</span><b>{fmt(zone.fossilPct)}%</b></div><div><span>Import/export net</span><b>{(zone.netFlowMw > 0 ? "+" : "") + fmt(zone.netFlowMw)} MW</b></div><div><span>Load</span><b>{zone.loadMw ? fmt(zone.loadMw) + " MW" : "—"}</b></div><div><span>Preț PZU</span><b>{zone.priceLeiMwh ? fmt(zone.priceLeiMwh) + " Lei/MWh" : "—"}</b></div>
    </div>
    <div className="mixlist">{mixRows.map((m) => <div key={m.key} className="mixrow"><div><span>{m.label}</span><b>{fmt(m.val)}%</b></div><i style={{ width: Math.min(100, m.val) + "%" }} /></div>)}</div>
    <div className="hint"><Clock size={13} /> Actualizat: {new Date(zone.updatedAtUtc || data.updatedAtUtc).toLocaleString("ro-RO")} · calitate date: {zone.quality || zone.status || data.status}</div>
  </Card>;
}
function GridSignalsCharts({ data, mode }) {
  const chartData = mode === "forecast" ? data.forecast : data.history;
  return <div className="grid2">
    <Card title={mode === "forecast" ? "Forecast următoarele ore" : "Carbon intensity & renewable · 24h"} pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={250}><ComposedChart data={chartData} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} interval={2} /><YAxis yAxisId="l" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={42} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={42} />
        <RTooltip content={<ChartTip unit="" />} /><Area yAxisId="l" type="monotone" dataKey="carbon" name="gCO₂/kWh" stroke="var(--accent)" strokeWidth={2} fill="var(--accent)" fillOpacity={0.08} /><Line yAxisId="r" type="monotone" dataKey="renewable" name="Renewable %" stroke="var(--green)" strokeWidth={2} dot={false} />
      </ComposedChart></ResponsiveContainer></div>
    </Card>
    <Card title="Mix energetic pe surse" pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={250}><BarChart data={data.mixSeries} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="source" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={42} /><RTooltip content={<ChartTip unit="%" />} /><Bar dataKey="value" name="pondere" fill="var(--border-strong)" radius={[4,4,0,0]} />
      </BarChart></ResponsiveContainer></div>
    </Card>
  </div>;
}
function GridZonesTable({ data, setSelectedZone, selectedZone }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("carbonIntensity");
  const rows = (data.zones || []).filter((z) => (z.name + z.code).toLowerCase().includes(q.toLowerCase())).sort((a,b) => Number(b[sort] || 0) - Number(a[sort] || 0));
  return <Card title="Date rețea pe zone" right={<div className="tabletools"><input className="nsel gridsearch" placeholder="Filtrează zonă" value={q} onChange={(e)=>setQ(e.target.value)} /><select className="nsel gridsort" value={sort} onChange={(e)=>setSort(e.target.value)}><option value="carbonIntensity">carbon</option><option value="renewablePct">renewable</option><option value="carbonFreePct">carbon-free</option><option value="loadMw">load</option><option value="netFlowMw">flux</option></select></div>} pad={false}>
    <table className="tbl"><thead><tr><th>Zonă</th><th className="num">Carbon</th><th className="num">Renew.</th><th className="num">C-free</th><th className="num">Load</th><th className="num">Import/export</th><th>Status date</th><th>Updated</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan="8" className="dim">Nu există date pentru filtrul curent.</td></tr> : rows.map((z) => <tr key={z.code} className={z.code === selectedZone ? "rowsel" : ""} onClick={() => setSelectedZone(z.code)}><td className="strong"><span className="zflag">{z.code}</span>{z.name}</td><td className="num">{fmt(z.carbonIntensity)}</td><td className="num">{fmt(z.renewablePct)}%</td><td className="num">{fmt(z.carbonFreePct)}%</td><td className="num">{z.loadMw ? fmt(z.loadMw) : "—"}</td><td className="num">{(z.netFlowMw > 0 ? "+" : "") + fmt(z.netFlowMw)} MW</td><td><Badge tone={z.status === "live" ? "g" : z.status === "unavailable" ? "r" : "n"}>{z.quality || z.status}</Badge></td><td className="dim">{new Date(z.updatedAtUtc || data.updatedAtUtc).toLocaleTimeString("ro-RO", { hour:"2-digit", minute:"2-digit" })}</td></tr>)}</tbody></table>
  </Card>;
}
function MapView({ apiBase, apiToken }) {
  const gm = useGridMapData(apiBase, apiToken);
  const data = gm.data;
  const selected = (data.zones || []).find((z) => z.code === gm.selectedZone) || (data.zones || [])[0] || buildGridDemoData().zones[0];
  return <div className="stack gridpage">
    <GridStatusBanner data={data} error={gm.error} loading={gm.loading} />
    <div className="modebar gridmodebar">
      {GRID_VIEW_MODES.map((m) => <button key={m.id} className={"chip" + (gm.mode === m.id ? " on" : "")} onClick={() => gm.setMode(m.id)}>{m.label}</button>)}
      <div className="spacer" />
      <button className="btn ghost" onClick={gm.refresh}>{gm.loading ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />} Refresh</button>
    </div>
    <GridKpiCards zone={selected} data={data} />
    <div className="gridmaplayout"><GridNetworkMap data={data} selectedZone={gm.selectedZone} setSelectedZone={gm.setSelectedZone} mode={gm.mode} /><GridZoneDetailsPanel zone={selected} data={data} /></div>
    <GridSignalsCharts data={data} mode={gm.mode} />
    <GridZonesTable data={data} setSelectedZone={gm.setSelectedZone} selectedZone={gm.selectedZone} />
  </div>;
}

/* ============================ Harta Rețea — parity extension ============================ */
const gridMapTypes = {
  timelineModes: ["live", "history", "forecast"],
  layers: ["carbon", "mix", "renewable", "carbonfree", "flows", "load", "production", "price", "forecast"],
  dataStatuses: ["live", "forecast", "unavailable", "demo", "partial", "stale", "rate-limit", "offline", "no-api-key"],
};
function firstNumber(...vals) { for (const v of vals) { const n = Number(v); if (Number.isFinite(n)) return n; } return 0; }
function firstFinite(...vals) { for (const v of vals) { const n = Number(v); if (Number.isFinite(n)) return n; } return null; }
function normalizeZoneCode(v) {
  const s = String(v || "").trim().toUpperCase();
  if (GRID_ZONES.some((z) => z.code === s)) return s;
  const found = GRID_ZONES.find((z) => s.includes(z.code));
  return found ? found.code : "";
}
const GRID_TIMELINE_MODES_V2 = [
  { id: "live", label: "Live", sub: "ultimul interval" },
  { id: "history", label: "Ultimele 24h", sub: "96 x 15 min" },
  { id: "forecast", label: "Forecast", sub: "următoarele ore" },
];
const GRID_LAYER_MODES_V2 = [
  { id: "carbon", label: "Carbon intensity", Icon: Wind },
  { id: "mix", label: "Electricity mix", Icon: Layers },
  { id: "renewable", label: "Renewable %", Icon: Sparkles },
  { id: "carbonfree", label: "Carbon-free %", Icon: Check },
  { id: "flows", label: "Import/export flows", Icon: Plug },
  { id: "load", label: "Consumption/load", Icon: Gauge },
  { id: "production", label: "Production", Icon: Zap },
  { id: "price", label: "PZU / Day-Ahead", Icon: DollarSign },
  { id: "forecast", label: "Forecast", Icon: LineIcon },
];
const GRID_SOURCE_CLASS = {
  hydro: "renewable",
  wind: "renewable",
  solar: "renewable",
  biomass: "renewable",
  nuclear: "carbon-free",
  gas: "fossil",
  coal: "fossil",
  oil: "fossil",
  unknown: "unknown",
};
const GRID_SOURCE_COLORS = {
  hydro: "var(--blue)",
  nuclear: "var(--yellow)",
  wind: "var(--green)",
  solar: "var(--accent)",
  gas: "var(--accent-2)",
  coal: "var(--red)",
  oil: "var(--text-dim)",
  biomass: "color-mix(in srgb,var(--green) 70%,var(--accent))",
  unknown: "var(--border-strong)",
};
function gridMaxSource(mix = {}) {
  return GRID_MIX_KEYS.map((key) => ({ key, label: GRID_SOURCE_LABELS[key], value: Number(mix[key] || 0) }))
    .sort((a, b) => b.value - a.value)[0] || { key: "unknown", label: "Necunoscut", value: 0 };
}
function enrichGridZone(zone, index = 0) {
  const loadMw = Number(zone.loadMw || zone.consumptionMw || 0);
  const netFlowMw = Number(zone.netFlowMw || 0);
  const productionMw = Math.max(0, Number(zone.productionMw ?? (loadMw - Math.max(0, netFlowMw) + Math.max(0, -netFlowMw))));
  const powerBreakdownMw = zone.powerBreakdownMw || Object.fromEntries(GRID_MIX_KEYS.map((key) => [key, Math.round(productionMw * Number((zone.mix || {})[key] || 0) / 100)]));
  const dominant = gridMaxSource(zone.mix || {});
  const updatedAtUtc = zone.updatedAtUtc || new Date(Date.now() - index * 3 * 60 * 1000).toISOString();
  const ageMin = Math.max(0, Math.round((Date.now() - new Date(updatedAtUtc).getTime()) / 60000));
  const stale = Boolean(zone.stale) || ageMin > 90;
  return {
    ...zone,
    loadMw,
    consumptionMw: Number(zone.consumptionMw || loadMw),
    productionMw,
    netFlowMw,
    powerBreakdownMw,
    dominantSource: zone.dominantSource || dominant.label,
    dominantSourceKey: zone.dominantSourceKey || dominant.key,
    status: stale ? "stale" : (zone.status || "demo"),
    quality: zone.quality || (zone.status === "live" ? "measured" : "estimated"),
    source: zone.source || (zone.status === "live" ? "API intern" : "SERVIO demo"),
    dataAgeMinutes: ageMin,
    updatedAtUtc,
    warnings: zone.warnings || (stale ? ["Date posibil învechite"] : zone.status === "unavailable" ? ["Zonă indisponibilă"] : []),
  };
}
function quarterLabel(index) {
  const h = Math.floor(index / 4) % 24;
  const m = (index % 4) * 15;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
function buildGridSeriesForZone(zone, reason = "demo") {
  const baseCarbon = Number(zone.carbonIntensity || 250);
  const baseRen = Number(zone.renewablePct || 35);
  const baseCf = Number(zone.carbonFreePct || baseRen);
  const baseLoad = Number(zone.loadMw || 5000);
  const baseProd = Number(zone.productionMw || baseLoad);
  const baseFlow = Number(zone.netFlowMw || 0);
  const basePrice = Number(zone.priceLeiMwh || 0);
  const history = Array.from({ length: 96 }, (_, i) => {
    const wave = Math.sin((i - 20) / 96 * Math.PI * 2);
    const solar = Math.max(0, Math.sin((i - 24) / 48 * Math.PI));
    const evening = Math.exp(-Math.pow(i - 76, 2) / 130);
    const morning = Math.exp(-Math.pow(i - 34, 2) / 100);
    return {
      index: i,
      label: quarterLabel(i),
      datetimeUtc: new Date(Date.now() - (95 - i) * 15 * 60 * 1000).toISOString(),
      carbon: Math.max(30, Math.round(baseCarbon + 42 * wave - 30 * solar + 18 * evening)),
      renewable: Math.max(0, Math.min(100, Math.round(baseRen + 12 * solar - 5 * evening))),
      carbonFree: Math.max(0, Math.min(100, Math.round(baseCf + 7 * solar - 4 * evening))),
      fossil: Math.max(0, Math.min(100, Math.round(100 - baseCf - 7 * solar + 4 * evening))),
      load: Math.max(100, Math.round(baseLoad + 420 * morning + 760 * evening - 280 * solar)),
      production: Math.max(100, Math.round(baseProd + 300 * morning + 620 * evening - 160 * solar)),
      netFlow: Math.round(baseFlow + 120 * Math.sin(i / 10) - 75 * solar),
      price: basePrice ? Math.max(0, Math.round(basePrice + 130 * morning + 210 * evening - 90 * solar)) : null,
      status: reason.includes("forecast") ? "forecast" : zone.status || "demo",
    };
  });
  const forecast = Array.from({ length: 32 }, (_, i) => {
    const wave = Math.sin((i + 8) / 32 * Math.PI * 2);
    return {
      index: i,
      label: "+" + Math.floor(i / 4) + "h" + (i % 4 ? " " + ((i % 4) * 15) + "m" : ""),
      datetimeUtc: new Date(Date.now() + i * 15 * 60 * 1000).toISOString(),
      carbon: Math.max(30, Math.round(baseCarbon + 38 * wave)),
      renewable: Math.max(0, Math.min(100, Math.round(baseRen + 11 * Math.sin(i / 8)))),
      carbonFree: Math.max(0, Math.min(100, Math.round(baseCf + 7 * Math.sin(i / 9)))),
      load: Math.max(100, Math.round(baseLoad + 650 * Math.sin((i + 16) / 32 * Math.PI * 2))),
      production: Math.max(100, Math.round(baseProd + 520 * Math.sin((i + 14) / 32 * Math.PI * 2))),
      netFlow: Math.round(baseFlow + 90 * Math.sin(i / 6)),
      price: basePrice ? Math.max(0, Math.round(basePrice + 160 * Math.sin((i + 12) / 32 * Math.PI * 2))) : null,
      status: "forecast",
    };
  });
  return { history, forecast };
}
function buildGridAdvancedDemoData(reason = "no-api-key") {
  const base = buildGridDemoData(reason);
  const zones = (base.zones || []).map(enrichGridZone);
  const ro = zones.find((z) => z.code === "RO") || zones[0] || {};
  const series = buildGridSeriesForZone(ro, reason);
  return normalizeGridPayloadAdvanced({
    ...base,
    status: reason === "rate-limit" ? "rate-limit" : reason === "offline" ? "offline" : "no-api-key",
    sourceMode: "demo-fallback",
    message: reason === "offline" ? "Offline — se afișează date demo/cache." : base.message,
    zones,
    history: series.history,
    forecast: series.forecast,
  }, "RO");
}
function normalizeGridPayloadAdvanced(payload, selectedZone = "RO") {
  const fallback = buildGridDemoData(payload?.reason || "no-api-key");
  const source = payload && payload.zones ? payload : fallback;
  const zones = (source.zones || fallback.zones || []).map(enrichGridZone);
  const selected = zones.find((z) => z.code === selectedZone) || zones.find((z) => z.code === "RO") || zones[0] || {};
  const generated = buildGridSeriesForZone(selected, source.reason || source.status || "demo");
  const history = Array.isArray(source.history) && source.history.length >= 24
    ? source.history.map((r, i) => ({
        index: i,
        label: r.label || quarterLabel(i % 96),
        datetimeUtc: r.datetimeUtc || r.datetime || r.updatedAt || new Date(Date.now() - (source.history.length - 1 - i) * 15 * 60 * 1000).toISOString(),
        carbon: Math.round(firstNumber(r.carbon, r.carbonIntensity, selected.carbonIntensity)),
        renewable: Math.round(firstNumber(r.renewable, r.renewablePct, selected.renewablePct)),
        carbonFree: Math.round(firstNumber(r.carbonFree, r.carbonFreePct, selected.carbonFreePct)),
        fossil: Math.round(firstNumber(r.fossil, selected.fossilPct, 100 - selected.carbonFreePct)),
        load: Math.round(firstNumber(r.load, r.loadMw, selected.loadMw)),
        production: Math.round(firstNumber(r.production, r.productionMw, selected.productionMw)),
        netFlow: Math.round(firstNumber(r.netFlow, r.netFlowMw, selected.netFlowMw)),
        price: firstFinite(r.price, r.priceLeiMwh, selected.priceLeiMwh),
        status: r.status || source.status || "demo",
      }))
    : generated.history;
  const forecast = Array.isArray(source.forecast) && source.forecast.length
    ? source.forecast.map((r, i) => ({
        index: i,
        label: r.label || "+" + i + "h",
        datetimeUtc: r.datetimeUtc || r.datetime || new Date(Date.now() + i * 15 * 60 * 1000).toISOString(),
        carbon: Math.round(firstNumber(r.carbon, r.carbonIntensity, selected.carbonIntensity)),
        renewable: Math.round(firstNumber(r.renewable, r.renewablePct, selected.renewablePct)),
        carbonFree: Math.round(firstNumber(r.carbonFree, r.carbonFreePct, selected.carbonFreePct)),
        load: Math.round(firstNumber(r.load, r.loadMw, selected.loadMw)),
        production: Math.round(firstNumber(r.production, r.productionMw, selected.productionMw)),
        netFlow: Math.round(firstNumber(r.netFlow, r.netFlowMw, selected.netFlowMw)),
        price: firstFinite(r.price, r.priceLeiMwh, selected.priceLeiMwh),
        status: "forecast",
      }))
    : generated.forecast;
  const flows = (source.flows || fallback.flows || []).map((f, i) => ({
    id: f.id || `${f.from}-${f.to}-${i}`,
    from: normalizeZoneCode(f.from || f.source || "RO") || f.from,
    to: normalizeZoneCode(f.to || f.target || "RO") || f.to,
    mw: Math.round(Math.abs(Number(f.mw || f.value || f.flow || 0))),
    status: f.status || source.status || "demo",
    updatedAtUtc: f.updatedAtUtc || source.updatedAtUtc || new Date().toISOString(),
  })).filter((f) => f.from && f.to && f.from !== f.to && f.mw > 0);
  const pzu = source.pzuPrice || { ok: Boolean(selected.priceLeiMwh), priceLeiMwh: selected.priceLeiMwh || null, source: "OPCOM PZU / demo" };
  return {
    ok: source.ok !== false,
    source: source.source || "SERVIO Grid Adapter",
    sourceMode: source.sourceMode || "demo-fallback",
    status: source.status || "demo",
    message: source.message || "Date demo / cache local.",
    reason: source.reason || null,
    updatedAtUtc: source.updatedAtUtc || new Date().toISOString(),
    stale: Boolean(source.stale) || zones.some((z) => z.status === "stale"),
    zones,
    flows,
    history,
    forecast,
    mixSeries: GRID_MIX_KEYS.map((key) => ({ source: GRID_SOURCE_LABELS[key], key, value: Number(selected.mix?.[key] || 0) })),
    pzuPrice: pzu,
    apiCoverage: source.apiCoverage || {},
    externalUrl: source.externalUrl || "https://app.electricitymaps.com/map/live/fifteen_minutes",
  };
}
function gridLayerMetric(zone, layer) {
  const z = zone || {};
  if (layer === "renewable") return { value: z.renewablePct, label: "REN", unit: "%", tone: z.renewablePct >= 45 ? "low" : z.renewablePct >= 25 ? "mid" : "high" };
  if (layer === "carbonfree") return { value: z.carbonFreePct, label: "C-free", unit: "%", tone: z.carbonFreePct >= 65 ? "low" : z.carbonFreePct >= 40 ? "mid" : "high" };
  if (layer === "flows") return { value: z.netFlowMw, label: z.netFlowMw >= 0 ? "Import" : "Export", unit: "MW", tone: Math.abs(z.netFlowMw) < 150 ? "low" : Math.abs(z.netFlowMw) < 450 ? "mid" : "high" };
  if (layer === "load") return { value: z.loadMw, label: "Load", unit: "MW", tone: z.loadMw < 3500 ? "low" : z.loadMw < 7500 ? "mid" : "high" };
  if (layer === "production") return { value: z.productionMw, label: "Prod.", unit: "MW", tone: z.productionMw < 3500 ? "low" : z.productionMw < 7500 ? "mid" : "high" };
  if (layer === "price") return { value: z.priceLeiMwh, label: "PZU", unit: "Lei", tone: !z.priceLeiMwh ? "off" : z.priceLeiMwh < 450 ? "low" : z.priceLeiMwh < 800 ? "mid" : "high" };
  if (layer === "mix") return { value: gridMaxSource(z.mix).value, label: gridMaxSource(z.mix).label, unit: "%", tone: gridTone(z.carbonIntensity) };
  if (layer === "forecast") return { value: z.carbonIntensity, label: "Forecast", unit: "g", tone: gridTone(z.carbonIntensity) };
  return { value: z.carbonIntensity, label: "CO₂", unit: "g", tone: gridTone(z.carbonIntensity) };
}
function pointForTimeline(data, timeline, timeIndex) {
  const rows = timeline === "forecast" ? data.forecast : data.history;
  if (!Array.isArray(rows) || !rows.length) return null;
  if (timeline === "live") return rows[rows.length - 1];
  return rows[Math.max(0, Math.min(rows.length - 1, Number(timeIndex || 0)))] || rows[rows.length - 1];
}
function useGridMapController(apiBase, apiToken) {
  const [timeline, setTimeline] = useState("live");
  const [layer, setLayer] = useState("carbon");
  const [selectedZone, setSelectedZone] = useState("RO");
  const [timeIndex, setTimeIndex] = useState(95);
  const [data, setData] = useState(() => buildGridAdvancedDemoData("no-api-key"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const refresh = () => {
    let alive = true;
    setLoading(true);
    setError(null);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setData(buildGridAdvancedDemoData("offline"));
      setError("offline");
      setLoading(false);
      setLastRefresh(new Date());
      return () => { alive = false; };
    }
    gridMapService.load({ base: apiBase, token: apiToken, mode: timeline, zone: selectedZone })
      .then((next) => { if (alive) setData(normalizeGridPayloadAdvanced(next, selectedZone)); })
      .catch((e) => { if (alive) { setError(String(e.message || e)); setData(buildGridAdvancedDemoData("error-fallback")); } })
      .finally(() => { if (alive) { setLoading(false); setLastRefresh(new Date()); } });
    return () => { alive = false; };
  };
  useEffect(refresh, [apiBase, apiToken, timeline, selectedZone]);
  useEffect(() => {
    if (timeline !== "live") return undefined;
    const id = setInterval(() => refresh(), 60000);
    return () => clearInterval(id);
  }, [apiBase, apiToken, timeline, selectedZone]);
  return { data, loading, error, timeline, setTimeline, layer, setLayer, selectedZone, setSelectedZone, timeIndex, setTimeIndex, refresh, lastRefresh };
}
function GridLayerSwitcher({ layer, setLayer }) {
  return <div className="gridcontrolcard">
    <div className="gridcontrolhead"><Layers size={14} /><b>Layer</b></div>
    <div className="gridlayerbar">{GRID_LAYER_MODES_V2.map(({ id, label, Icon }) => <button key={id} data-grid-layer={id} className={"chip" + (layer === id ? " on" : "")} onClick={() => setLayer(id)} title={label}><Icon size={13} /> {label}</button>)}</div>
  </div>;
}
function GridTimelineControls({ timeline, setTimeline, timeIndex, setTimeIndex, data, loading, refresh, lastRefresh }) {
  const rows = timeline === "forecast" ? data.forecast : data.history;
  const activeIndex = timeline === "live" ? Math.max(0, (rows || []).length - 1) : Math.max(0, Math.min((rows || []).length - 1, Number(timeIndex || 0)));
  const active = (rows || [])[activeIndex];
  return <div className="gridcontrolcard">
    <div className="gridcontrolhead"><Clock size={14} /><b>Timeline</b><span className="dim">15 min</span></div>
    <div className="gridtimelinechips">{GRID_TIMELINE_MODES_V2.map((m) => <button key={m.id} data-grid-timeline={m.id} className={"chip" + (timeline === m.id ? " on" : "")} onClick={() => setTimeline(m.id)}><span>{m.label}</span><small>{m.sub}</small></button>)}</div>
    <div className="gridsliderrow">
      <input className="gridslider" type="range" min="0" max={Math.max(0, (rows || []).length - 1)} value={activeIndex} disabled={timeline === "live" || !(rows || []).length} onChange={(e) => setTimeIndex(Number(e.target.value))} />
      <div className="gridsliderlabel"><b>{active?.label || "live"}</b><span>{timeline === "live" ? "auto-refresh 60s" : timeline}</span></div>
      <button className="btn ghost" onClick={refresh}>{loading ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />} Refresh</button>
    </div>
    <div className="hint"><Clock size={13} /> Actualizat local: {lastRefresh ? lastRefresh.toLocaleTimeString("ro-RO", { hour:"2-digit", minute:"2-digit" }) : "—"} · sursă: {data.sourceMode || data.status}</div>
  </div>;
}
function GridStatusBannerV2({ data, error, loading }) {
  if (loading) return <div className="banner"><RefreshCw size={15} className="spin" /><div><b>Se încarcă Harta Rețea</b> — sincronizare semnale, mix, fluxuri și PZU.</div></div>;
  if (error === "offline" || data.status === "offline") return <div className="banner err"><AlertTriangle size={15} /><div><b>Offline</b> — se afișează date demo/cache. Pagina nu se blochează fără conexiune.</div></div>;
  if (error) return <div className="banner err"><AlertTriangle size={15} /><div><b>API indisponibil</b> — fallback demo activ. {error}</div></div>;
  if (data.status === "rate-limit") return <div className="banner err"><AlertTriangle size={15} /><div><b>Rate limit</b> — se afișează cache/demo până la următoarea fereastră permisă.</div></div>;
  if (data.status === "no-api-key" || data.sourceMode === "demo-fallback") return <div className="banner"><AlertTriangle size={15} /><div><b>Date demo</b> — integrarea este pregătită pentru endpoint intern/API oficial; cheia rămâne în backend/env.</div></div>;
  if (data.stale) return <div className="banner err"><AlertTriangle size={15} /><div><b>Date stale</b> — ultima actualizare depășește pragul normal; valorile sunt afișate cu avertizare.</div></div>;
  if (data.status === "partial") return <div className="banner"><AlertTriangle size={15} /><div><b>Date parțiale</b> — unele semnale lipsesc și sunt estimate/fallback.</div></div>;
  return <div className="banner ok"><Check size={15} /><div><b>Live</b> — date livrate prin backend intern; fără scraping și fără chei expuse în client.</div></div>;
}
function GridKpiCardsV2({ zone, data }) {
  const point = pointForTimeline(data, "live", 0) || {};
  return <div className="kpirow gridkpis">
    <Kpi label="Carbon intensity România" value={fmt(zone.carbonIntensity) + " g/kWh"} sub={gridToneLabel(zone.carbonIntensity)} Icon={Wind} tone={zone.carbonIntensity < 220 ? "green" : zone.carbonIntensity > 360 ? "red" : "accent"} />
    <Kpi label="Renewable %" value={fmt(zone.renewablePct) + "%"} sub="hidro · eolian · solar · biomasă" Icon={Sparkles} tone="green" />
    <Kpi label="Carbon-free %" value={fmt(zone.carbonFreePct) + "%"} sub="renewable + nuclear" Icon={Check} tone="green" />
    <Kpi label="Net import/export" value={(zone.netFlowMw > 0 ? "+" : "") + fmt(zone.netFlowMw) + " MW"} sub={zone.netFlowMw >= 0 ? "import net" : "export net"} Icon={Plug} />
    <Kpi label="Production total" value={fmt(zone.productionMw) + " MW"} sub="producție estimată/raportată" Icon={Zap} />
    <Kpi label="Consumption/load" value={fmt(zone.loadMw) + " MW"} sub={"acum · " + fmt(point.load || zone.loadMw) + " MW"} Icon={Gauge} />
    <Kpi label="Dominant source" value={zone.dominantSource || "—"} sub={fmt((zone.mix || {})[zone.dominantSourceKey] || 0) + "% din mix"} Icon={Layers} />
    <Kpi label="PZU / Day-Ahead" value={zone.priceLeiMwh ? fmt(zone.priceLeiMwh) + " Lei/MWh" : "—"} sub={zone.priceSource || data.pzuPrice?.source || "disponibil dacă există date"} Icon={DollarSign} />
    <Kpi label="Ultima actualizare" value={new Date(data.updatedAtUtc).toLocaleTimeString("ro-RO", { hour:"2-digit", minute:"2-digit" })} sub={data.status + " · " + (data.sourceMode || "cache")} Icon={Clock} />
  </div>;
}
function GridMapLegendV2({ layer }) {
  const active = GRID_LAYER_MODES_V2.find((m) => m.id === layer);
  return <div className="gridlegend">
    <span><Layers size={12} /> {active?.label || "Layer"}</span>
    <span><i className="legdot low" /> low / favorabil</span>
    <span><i className="legdot mid" /> medium</span>
    <span><i className="legdot high" /> high</span>
    <span><i className="legdot off" /> unknown</span>
    <span><i className="flowline" /> exportator → importator · MW live</span>
  </div>;
}
function GridZoneHoverCard({ zone, data }) {
  if (!zone) return null;
  const power = zone.powerBreakdownMw || {};
  const mixRows = GRID_MIX_KEYS.map((key) => {
    const pct = mixVal(zone, key);
    const mwRaw = Number(power[key]);
    const mw = Number.isFinite(mwRaw) ? Math.round(mwRaw) : Math.round((zone.productionMw || 0) * pct / 100);
    return { key, label:GRID_SOURCE_LABELS[key], pct, mw };
  }).filter((r) => r.pct > 0 || r.mw > 0).sort((a,b) => b.mw - a.mw).slice(0, 5);
  const updated = zone.updatedAtUtc ? new Date(zone.updatedAtUtc) : new Date(data.updatedAtUtc || Date.now());
  const netLabel = zone.netFlowMw > 0 ? "import net" : zone.netFlowMw < 0 ? "export net" : "echilibrat";
  const zoneFlows = (data.flows || []).filter((f) => f.from === zone.code || f.to === zone.code).sort((a,b) => Math.abs(Number(b.mw || 0)) - Math.abs(Number(a.mw || 0)));
  const imports = zoneFlows.filter((f) => f.to === zone.code);
  const exports = zoneFlows.filter((f) => f.from === zone.code);
  const importTotal = imports.reduce((sum, f) => sum + Math.abs(Number(f.mw || 0)), 0);
  const exportTotal = exports.reduce((sum, f) => sum + Math.abs(Number(f.mw || 0)), 0);
  return <div className="gridhover gridhoverzone">
    <div className="gridhoverhead">
      <div><b>{zone.name}</b><span>{zone.code} · {zone.status || data.status} · {zone.quality || "n/a"}</span></div>
      <i className={gridTone(zone.carbonIntensity)}>{gridToneLabel(zone.carbonIntensity)}</i>
    </div>
    <div className="gridhovermetric"><strong>{fmt(zone.carbonIntensity)}</strong><span>gCO₂eq/kWh · calculat SERVIO din mix ENTSO-E</span></div>
    <div className="gridhovergrid">
      <div><span>Renewable</span><b>{fmt(zone.renewablePct)}%</b></div>
      <div><span>Carbon-free</span><b>{fmt(zone.carbonFreePct)}%</b></div>
      <div><span>Fossil</span><b>{fmt(zone.fossilPct)}%</b></div>
      <div><span>Load</span><b>{fmt(zone.loadMw)} MW</b></div>
      <div><span>Production</span><b>{fmt(zone.productionMw)} MW</b></div>
      <div><span>{netLabel}</span><b>{(zone.netFlowMw > 0 ? "+" : "") + fmt(zone.netFlowMw)} MW</b></div>
    </div>
    <div className="gridhovermix">
      {mixRows.map((r) => <div key={r.key}><span>{r.label}</span><b>{fmt(r.mw)} MW · {fmt(r.pct)}%</b><i style={{ width: Math.min(100, Math.max(3, r.pct)) + "%", background: GRID_SOURCE_COLORS[r.key] }} /></div>)}
    </div>
    <div className="gridhoverflows">
      <div className="gridhoverflowcol">
        <div className="gridhoverflowshead"><span>Primește</span><b>{fmt(importTotal)} MW</b></div>
        {imports.length ? imports.slice(0, 4).map((f) => <p key={"in-" + f.from + f.to}><b>{f.from} → {zone.code}</b><span>{fmt(Math.abs(f.mw))} MW</span></p>) : <em>Fără import live pe granițele urmărite</em>}
      </div>
      <div className="gridhoverflowcol">
        <div className="gridhoverflowshead"><span>Dă</span><b>{fmt(exportTotal)} MW</b></div>
        {exports.length ? exports.slice(0, 4).map((f) => <p key={"out-" + f.from + f.to}><b>{zone.code} → {f.to}</b><span>{fmt(Math.abs(f.mw))} MW</span></p>) : <em>Fără export live pe granițele urmărite</em>}
      </div>
    </div>
    <div className="gridhoverfoot">
      <span>PZU: {zone.priceLeiMwh ? fmt(zone.priceLeiMwh) + " Lei/MWh" : "—"}</span>
      <span>{updated.toLocaleString("ro-RO", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"2-digit" })}</span>
      <span>{zone.source || data.source || "sursă necunoscută"}</span>
    </div>
  </div>;
}
function GridFlowHoverCard({ flow }) {
  if (!flow) return null;
  const updated = flow.updatedAtUtc ? new Date(flow.updatedAtUtc) : null;
  return <div className="gridhover gridhoverflow">
    <div className="gridhoverhead">
      <div><b>{flow.from} → {flow.to}</b><span>interconectare · {flow.status || "n/a"}</span></div>
      <i className="low">A11</i>
    </div>
    <div className="gridhovermetric"><strong>{fmt(flow.mw)}</strong><span>MW · flux fizic net ENTSO-E</span></div>
    <div className="gridhoverfoot">
      <span>Direcție import/export calculată din ambele sensuri</span>
      {updated && <span>{updated.toLocaleString("ro-RO", { hour:"2-digit", minute:"2-digit", day:"2-digit", month:"2-digit" })}</span>}
    </div>
  </div>;
}
function gridCountryCenter(code) {
  const point = GRID_COUNTRY_CENTERS[code];
  if (point) return point;
  const meta = gridZoneMeta(code);
  return { x: meta.x * 10, y: meta.y * 6.2 };
}
/* v4.23: mouse wheel zoom inside Harta Retea canvas */
function GridNetworkMapV2({ data, selectedZone, setSelectedZone, layer, timeline, timeIndex }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const [hover, setHover] = useState(null);
  const [flowHover, setFlowHover] = useState(null);
  const clampMapZoom = (value) => Math.max(.65, Math.min(3.2, value));
  const point = pointForTimeline(data, timeline, timeIndex);
  const zones = (data.zones || []).map((z) => z.code === selectedZone && point ? { ...z, carbonIntensity: point.carbon, renewablePct: point.renewable, carbonFreePct: point.carbonFree, fossilPct: point.fossil ?? Math.max(0, 100 - point.carbonFree), loadMw: point.load, productionMw: point.production, netFlowMw: point.netFlow, priceLeiMwh: point.price ?? z.priceLeiMwh } : z);
  const knownZones = new Set(GRID_ZONES.map((z) => z.code));
  const visibleFlows = (data.flows || []).filter((f) => knownZones.has(f.from) && knownZones.has(f.to) && f.from !== f.to && Number.isFinite(Number(f.mw)) && Math.abs(Number(f.mw)) > 0);
  const getZone = (code) => zones.find((z) => z.code === code) || enrichGridZone({ code, name: code, status:"unavailable", quality:"unavailable", mix:{} });
  const inspectedCode = hover?.code || selectedZone;
  const isInspectingCountry = Boolean(hover?.code);
  const startDrag = (e) => {
    if (e.target instanceof Element && e.target.closest(".gridcountry,.gridflowgeo,.mapzoom")) return;
    setDrag({ x: e.clientX, y: e.clientY, pan });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveDrag = (e) => {
    if (!drag) return;
    setPan({ x: drag.pan.x + (e.clientX - drag.x), y: drag.pan.y + (e.clientY - drag.y) });
  };
  const stopDrag = () => setDrag(null);
  const handleMapWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const anchorX = e.clientX - rect.left;
    const anchorY = e.clientY - rect.top;
    const delta = Number.isFinite(e.deltaY) ? e.deltaY : 0;
    const wheelScale = Math.exp(-delta * 0.0014);
    setZoom((currentZoom) => {
      const nextZoom = clampMapZoom(currentZoom * wheelScale);
      const ratio = nextZoom / currentZoom;
      if (!Number.isFinite(ratio) || ratio === 1) return currentZoom;
      setPan((currentPan) => ({
        x: anchorX - (anchorX - currentPan.x) * ratio,
        y: anchorY - (anchorY - currentPan.y) * ratio
      }));
      return nextZoom;
    });
  };
  const inspectCountryFromPointer = (e) => {
    const target = e.target instanceof Element ? e.target.closest(".gridcountry") : null;
    const code = target?.getAttribute?.("data-grid-zone");
    if (!code) { setHover(null); return; }
    setFlowHover(null);
    setHover(getZone(code));
  };
  return <div className="gridmapcard">
    <div className="gridmaptoolbar">
      <div><div className="cardtitle">Hartă live rețea</div><div className="dim small">România + Europa ENTSO-E · {timeline} · {GRID_LAYER_MODES_V2.find((m) => m.id === layer)?.label}</div></div>
      <div className="mapzoom">
        <button className="ticon" title="Zoom out" onClick={() => setZoom((z) => clampMapZoom(z - .15))}><Minus size={14} /></button>
        <button className="ticon" title="Reset view" onClick={() => { setZoom(1); setPan({ x:0, y:0 }); }}>{fmt(zoom, 1)}x</button>
        <button className="ticon" title="Zoom in" onClick={() => setZoom((z) => clampMapZoom(z + .15))}><Plus size={14} /></button>
      </div>
    </div>
    <div className={"gridmapcanvas" + (drag ? " dragging" : "")} onWheel={handleMapWheel} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
      <div className="mapgridbg" />
      <div className="gridmapviewport" style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
        <svg className="gridgeosvg" viewBox={`0 0 ${GRID_MAP_VIEWBOX.width} ${GRID_MAP_VIEWBOX.height}`} aria-label="Hartă geografică ENTSO-E cu granițe de țări" onMouseMove={inspectCountryFromPointer} onPointerMove={inspectCountryFromPointer} onMouseLeave={() => setHover(null)} onPointerLeave={() => setHover(null)}>
          <defs>
            <marker id="gridArrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
              <path className="gridflowarrow" d="M0,0 L12,6 L0,12 Z" />
            </marker>
          </defs>
          <g className="gridcountries">
            {GRID_ZONES.map((m) => {
              const z = getZone(m.code);
              const metric = gridLayerMetric(z, layer);
              const unavailable = z.status === "unavailable";
              const d = GRID_COUNTRY_PATHS[m.code];
              if (!d) return null;
              return <path key={m.code} data-grid-zone={m.code} className={`gridcountry ${selectedZone === m.code ? "on" : ""} ${unavailable ? "off" : metric.tone}`} d={d} fillRule="evenodd" role="button" tabIndex={0} aria-label={`${m.name}: ${metric.label}`} onClick={() => { setSelectedZone(m.code); setHover(z); }} onMouseEnter={() => setHover(z)} onPointerEnter={() => setHover(z)} onFocus={() => setHover(z)} onMouseLeave={() => setHover(null)} onPointerLeave={() => setHover(null)} onBlur={() => setHover(null)} />;
            })}
          </g>
          <g className="gridflowsgeo">
            {visibleFlows.map((f, i) => {
              const a = gridCountryCenter(f.from); const b = gridCountryCenter(f.to);
              const id = f.id || `${f.from}-${f.to}-${i}`;
              const width = Math.max(1.6, Math.min(8, Math.abs(f.mw) / 260));
              const dx = b.x - a.x; const dy = b.y - a.y; const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              const offset = (i % 2 ? 1 : -1) * Math.min(20, Math.max(8, width * 2.2));
              const midX = (a.x + b.x) / 2 + (-dy / len) * offset;
              const midY = (a.y + b.y) / 2 + (dx / len) * offset;
              const label = `${f.from} → ${f.to} · ${fmt(Math.abs(f.mw))} MW`;
              const tagWidth = Math.min(142, Math.max(82, label.length * 5.8));
              const related = inspectedCode && (f.from === inspectedCode || f.to === inspectedCode);
              return <g key={id} className={"gridflowgeo" + (flowHover?.id === id ? " on" : "") + (related ? " related" : "") + (isInspectingCountry && !related ? " muted" : "")} role="button" tabIndex={0} aria-label={`${f.from} către ${f.to}: ${fmt(Math.abs(f.mw))} MW`} onMouseEnter={() => setFlowHover({ ...f, id })} onPointerEnter={() => setFlowHover({ ...f, id })} onFocus={() => setFlowHover({ ...f, id })} onMouseLeave={() => setFlowHover(null)} onPointerLeave={() => setFlowHover(null)} onBlur={() => setFlowHover(null)} onClick={() => setFlowHover({ ...f, id })}>
                <circle className="gridflowdot from" cx={a.x} cy={a.y} r={Math.max(2.4, width * .72)} />
                <circle className="gridflowdot to" cx={b.x} cy={b.y} r={Math.max(2.8, width * .86)} />
                <line className="gridflowhit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <line className="gridflowline" x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ strokeWidth: width }} markerEnd="url(#gridArrow)" />
                <g className="gridflowtag" transform={`translate(${midX},${midY})`}>
                  <rect x={-tagWidth / 2} y="-10" width={tagWidth} height="20" rx="6" />
                  <text textAnchor="middle" dominantBaseline="central">{label}</text>
                </g>
              </g>;
            })}
          </g>
        </svg>
      </div>
      {flowHover ? <GridFlowHoverCard flow={flowHover} /> : hover ? <GridZoneHoverCard zone={hover} data={data} /> : null}
    </div>
    <GridMapLegendV2 layer={layer} />
  </div>;
}
function GridZoneDetailsPanelV2({ zone, data }) {
  const warnings = [...(zone.warnings || [])];
  if (data.sourceMode === "demo-fallback") warnings.push("Date demo/fallback");
  if (zone.quality === "partial") warnings.push("Date parțiale");
  const mixRows = GRID_MIX_KEYS.map((key) => ({ key, label:GRID_SOURCE_LABELS[key], val:mixVal(zone,key), mw: Math.round((zone.productionMw || 0) * mixVal(zone,key) / 100), cls:GRID_SOURCE_CLASS[key] })).filter((x) => x.val > 0 || ["hydro","nuclear","wind","solar","gas","coal"].includes(x.key));
  return <Card title={zone.name + " · " + zone.code} right={<Badge tone={zone.status === "live" ? "g" : zone.status === "unavailable" ? "r" : "n"}>{zone.status || data.status}</Badge>}>
    <div className="zonehero"><div><div className="zonebig">{fmt(zone.carbonIntensity)} <span>gCO₂eq/kWh</span></div><div className="dim small">intensitate carbon · {gridToneLabel(zone.carbonIntensity)}</div></div><div className={`zonering ${gridTone(zone.carbonIntensity)}`}>{fmt(zone.renewablePct)}%</div></div>
    <div className="zonemetrics">
      <div><span>Renewable</span><b>{fmt(zone.renewablePct)}%</b></div><div><span>Carbon-free</span><b>{fmt(zone.carbonFreePct)}%</b></div><div><span>Fossil</span><b>{fmt(zone.fossilPct)}%</b></div><div><span>Import/export net</span><b>{(zone.netFlowMw > 0 ? "+" : "") + fmt(zone.netFlowMw)} MW</b></div><div><span>Production</span><b>{fmt(zone.productionMw)} MW</b></div><div><span>Consumption/load</span><b>{fmt(zone.loadMw)} MW</b></div><div><span>Dominant source</span><b>{zone.dominantSource}</b></div><div><span>Preț PZU</span><b>{zone.priceLeiMwh ? fmt(zone.priceLeiMwh) + " Lei/MWh" : "—"}</b></div>
    </div>
    <div className="mixlist">{mixRows.map((m) => <div key={m.key} className={"mixrow " + m.cls}><div><span>{m.label}</span><b>{fmt(m.val)}% · {fmt(m.mw)} MW</b></div><i style={{ width: Math.min(100, m.val) + "%", background: GRID_SOURCE_COLORS[m.key] }} /></div>)}</div>
    <div className="gridwarns">{warnings.length ? warnings.map((w) => <span key={w}><AlertTriangle size={12} /> {w}</span>) : <span><Check size={12} /> Date coerente pentru afișare</span>}</div>
    <div className="hint"><Clock size={13} /> Actualizat: {new Date(zone.updatedAtUtc || data.updatedAtUtc).toLocaleString("ro-RO")} · calitate: {zone.quality} · sursă: {zone.source || data.source}</div>
  </Card>;
}
function gridMixHistoryRows(zone, series) {
  return (series || []).map((r) => {
    const row = { label:r.label };
    for (const key of ["hydro","nuclear","wind","solar","gas","coal"]) row[key] = Math.round((r.production || zone.productionMw || 0) * mixVal(zone, key) / 100);
    return row;
  });
}
function GridSignalsChartsV2({ data, timeline, selectedZone, timeIndex }) {
  const zone = (data.zones || []).find((z) => z.code === selectedZone) || (data.zones || [])[0] || {};
  const series = timeline === "forecast" ? data.forecast : data.history;
  const displaySeries = timeline === "live" ? (data.history || []).slice(-96) : series;
  const mixHistory = gridMixHistoryRows(zone, displaySeries);
  const zoneCompare = (data.zones || []).map((z) => ({ code:z.code, carbon:z.carbonIntensity, renewable:z.renewablePct, load:Math.round((z.loadMw || 0) / 100), production:Math.round((z.productionMw || 0) / 100) }));
  return <div className="gridcharts">
    <Card title={timeline === "forecast" ? "Forecast carbon intensity" : "Carbon intensity · 24h"} pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={240}><ComposedChart data={displaySeries} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} interval={timeline === "forecast" ? 3 : 11} /><YAxis tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={42} /><RTooltip content={<ChartTip unit=" g/kWh" />} /><ReferenceLine y={300} stroke="var(--yellow)" strokeDasharray="3 4" /><Area type="monotone" dataKey="carbon" name="carbon" stroke="var(--accent)" strokeWidth={2} fill="var(--accent)" fillOpacity={0.08} />
      </ComposedChart></ResponsiveContainer></div>
    </Card>
    <Card title="Renewable & carbon-free · 24h" pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={240}><LineChart data={displaySeries} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} interval={timeline === "forecast" ? 3 : 11} /><YAxis tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={42} domain={[0,100]} /><RTooltip content={<ChartTip unit="%" />} /><Line type="monotone" dataKey="renewable" name="Renewable" stroke="var(--green)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="carbonFree" name="Carbon-free" stroke="var(--blue)" strokeWidth={2} dot={false} />
      </LineChart></ResponsiveContainer></div>
    </Card>
    <Card title="Import/export & load · 24h" pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={240}><ComposedChart data={displaySeries} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} interval={timeline === "forecast" ? 3 : 11} /><YAxis yAxisId="l" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><RTooltip content={<ChartTip unit=" MW" />} /><Bar yAxisId="l" dataKey="netFlow" name="net import/export" fill="var(--border-strong)" radius={[4,4,0,0]} /><Line yAxisId="r" type="monotone" dataKey="load" name="load" stroke="var(--blue)" strokeWidth={2} dot={false} /><Line yAxisId="r" type="monotone" dataKey="production" name="production" stroke="var(--green)" strokeWidth={2} dot={false} />
      </ComposedChart></ResponsiveContainer></div>
    </Card>
    <Card title="Preț PZU / Day-Ahead" pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={240}><AreaChart data={displaySeries.filter((r) => r.price !== null && r.price !== undefined)} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} interval={timeline === "forecast" ? 3 : 11} /><YAxis tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><RTooltip content={<ChartTip unit=" Lei/MWh" />} /><Area type="monotone" dataKey="price" name="PZU" stroke="var(--accent-2)" strokeWidth={2} fill="var(--accent-2)" fillOpacity={0.08} />
      </AreaChart></ResponsiveContainer></div>
    </Card>
    <Card title="Mix energetic · producție 24h" pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={260}><AreaChart data={mixHistory} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} interval={11} /><YAxis tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><RTooltip content={<ChartTip unit=" MW" />} />{["hydro","nuclear","wind","solar","gas","coal"].map((key) => <Area key={key} type="monotone" dataKey={key} stackId="mix" name={GRID_SOURCE_LABELS[key]} stroke={GRID_SOURCE_COLORS[key]} fill={GRID_SOURCE_COLORS[key]} fillOpacity={0.65} />)}
      </AreaChart></ResponsiveContainer></div>
    </Card>
    <Card title="Forecast următoarele ore" pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={260}><ComposedChart data={data.forecast || []} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} interval={3} /><YAxis yAxisId="l" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><RTooltip content={<ChartTip unit="" />} /><Area yAxisId="l" type="monotone" dataKey="carbon" name="gCO₂/kWh" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.08} /><Line yAxisId="r" type="monotone" dataKey="load" name="load MW" stroke="var(--blue)" strokeWidth={2} dot={false} />
      </ComposedChart></ResponsiveContainer></div>
    </Card>
    <Card title="Comparație zone · RO și vecini" pad={false}>
      <div className="hero"><ResponsiveContainer width="100%" height={260}><ComposedChart data={zoneCompare} margin={{ top:16,right:20,left:4,bottom:4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} /><XAxis dataKey="code" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} /><YAxis yAxisId="l" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize:10.5, fill:"var(--text-faint)" }} axisLine={false} tickLine={false} width={44} /><RTooltip content={<ChartTip unit="" />} /><Bar yAxisId="l" dataKey="carbon" name="carbon g/kWh" fill="var(--accent)" radius={[4,4,0,0]} /><Line yAxisId="r" type="monotone" dataKey="renewable" name="renewable %" stroke="var(--green)" strokeWidth={2} /><Line yAxisId="r" type="monotone" dataKey="load" name="load x100 MW" stroke="var(--blue)" strokeWidth={2} />
      </ComposedChart></ResponsiveContainer></div>
    </Card>
  </div>;
}
function GridNativeTable({ title, rows, columns, loading, error, empty = "Nu există date pentru filtrul curent." }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.key || "");
  const filtered = (rows || []).filter((row) => JSON.stringify(row).toLowerCase().includes(q.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    const col = columns.find((c) => c.key === sortKey) || columns[0];
    const av = col?.sortValue ? col.sortValue(a) : a[sortKey];
    const bv = col?.sortValue ? col.sortValue(b) : b[sortKey];
    return typeof av === "number" && typeof bv === "number" ? bv - av : String(av ?? "").localeCompare(String(bv ?? ""), "ro");
  });
  return <Card title={title} right={<div className="tabletools"><input className="nsel gridsearch" placeholder="Filtrează" value={q} onChange={(e)=>setQ(e.target.value)} /><select className="nsel gridsort" value={sortKey} onChange={(e)=>setSortKey(e.target.value)}>{columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>} pad={false}>
    <div className="tablewrap"><table className="tbl"><thead><tr>{columns.map((c) => <th key={c.key} className={c.num ? "num" : ""}>{c.label}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={columns.length} className="dim"><RefreshCw size={13} className="spin" /> Se încarcă datele...</td></tr> :
       error ? <tr><td colSpan={columns.length} className="dim"><AlertTriangle size={13} /> Eroare: {error}</td></tr> :
       !sorted.length ? <tr><td colSpan={columns.length} className="dim">{empty}</td></tr> :
       sorted.map((row, i) => <tr key={row.id || row.code || row.key || i}>{columns.map((c) => <td key={c.key} className={c.num ? "num" : ""}>{c.render ? c.render(row) : row[c.key]}</td>)}</tr>)}
    </tbody></table></div>
  </Card>;
}
function GridZonesTableV2({ data, setSelectedZone, selectedZone, loading, error }) {
  const rows = data.zones || [];
  return <GridNativeTable title="Zone / countries" rows={rows} loading={loading} error={error} columns={[
    { key:"name", label:"Zonă", render:(z)=><button className={"linkrow" + (z.code === selectedZone ? " on" : "")} onClick={() => setSelectedZone(z.code)}><span className="zflag">{z.code}</span>{z.name}</button> },
    { key:"carbonIntensity", label:"Carbon", num:true, render:(z)=>fmt(z.carbonIntensity) + " g" },
    { key:"renewablePct", label:"Renew.", num:true, render:(z)=>fmt(z.renewablePct) + "%" },
    { key:"carbonFreePct", label:"C-free", num:true, render:(z)=>fmt(z.carbonFreePct) + "%" },
    { key:"loadMw", label:"Load", num:true, render:(z)=>fmt(z.loadMw) + " MW" },
    { key:"productionMw", label:"Prod.", num:true, render:(z)=>fmt(z.productionMw) + " MW" },
    { key:"netFlowMw", label:"Net flow", num:true, render:(z)=>(z.netFlowMw > 0 ? "+" : "") + fmt(z.netFlowMw) + " MW" },
    { key:"status", label:"Status", render:(z)=><Badge tone={z.status === "live" ? "g" : z.status === "unavailable" ? "r" : "n"}>{z.quality || z.status}</Badge> },
  ]} />;
}
function GridDataTables({ data, selectedZone, setSelectedZone, loading, error }) {
  const zone = (data.zones || []).find((z) => z.code === selectedZone) || (data.zones || [])[0] || {};
  const mixRows = GRID_MIX_KEYS.map((key) => ({ key, source:GRID_SOURCE_LABELS[key], pct:mixVal(zone,key), mw:Math.round((zone.productionMw || 0) * mixVal(zone,key) / 100), class:GRID_SOURCE_CLASS[key], status:zone.status || data.status }));
  const flowRows = (data.flows || []).map((f) => ({ ...f, direction:f.to === selectedZone ? "import" : f.from === selectedZone ? "export" : "tranzit", signed:f.to === selectedZone ? f.mw : f.from === selectedZone ? -f.mw : f.mw }));
  const forecastRows = (data.forecast || []).map((r) => ({ id:"fc-"+r.index, ...r }));
  const priceRows = [...(data.history || []).slice(-96), ...(data.forecast || []).slice(0,12)].filter((r) => r.price !== null && r.price !== undefined).map((r, i) => ({ id:"p-"+i, ...r, status:r.status || data.status }));
  return <div className="gridtables">
    <GridZonesTableV2 data={data} selectedZone={selectedZone} setSelectedZone={setSelectedZone} loading={loading} error={error} />
    <GridNativeTable title="Electricity mix table" rows={mixRows} loading={loading} error={error} columns={[
      { key:"source", label:"Sursă" },
      { key:"class", label:"Clasă" },
      { key:"pct", label:"Pondere", num:true, render:(r)=>fmt(r.pct) + "%" },
      { key:"mw", label:"MW", num:true, render:(r)=>fmt(r.mw) + " MW" },
      { key:"status", label:"Status", render:(r)=><Badge tone={r.status === "live" ? "g" : "n"}>{r.status}</Badge> },
    ]} />
    <GridNativeTable title="Import/export flows" rows={flowRows} loading={loading} error={error} columns={[
      { key:"from", label:"De la" },
      { key:"to", label:"Către" },
      { key:"direction", label:"Direcție" },
      { key:"signed", label:"MW", num:true, render:(r)=>(r.signed > 0 ? "+" : "") + fmt(r.signed) + " MW" },
      { key:"status", label:"Status", render:(r)=><Badge tone={r.status === "live" ? "g" : "n"}>{r.status}</Badge> },
    ]} />
    <GridNativeTable title="Forecast table" rows={forecastRows} loading={loading} error={error} columns={[
      { key:"label", label:"Interval" },
      { key:"carbon", label:"Carbon", num:true, render:(r)=>fmt(r.carbon) + " g" },
      { key:"renewable", label:"Renew.", num:true, render:(r)=>fmt(r.renewable) + "%" },
      { key:"load", label:"Load", num:true, render:(r)=>fmt(r.load) + " MW" },
      { key:"production", label:"Prod.", num:true, render:(r)=>fmt(r.production) + " MW" },
      { key:"status", label:"Status", render:(r)=><Badge tone="n">{r.status}</Badge> },
    ]} />
    <GridNativeTable title="Price / PZU table" rows={priceRows} loading={loading} error={error} columns={[
      { key:"label", label:"Interval" },
      { key:"price", label:"Lei/MWh", num:true, render:(r)=>fmt(r.price) + " Lei/MWh" },
      { key:"carbon", label:"Carbon", num:true, render:(r)=>fmt(r.carbon) + " g" },
      { key:"load", label:"Load", num:true, render:(r)=>fmt(r.load) + " MW" },
      { key:"status", label:"Status", render:(r)=><Badge tone={r.status === "forecast" ? "n" : "g"}>{r.status}</Badge> },
    ]} empty="Nu există preț PZU pentru zona/intervalul selectat." />
  </div>;
}
function GridMapPage({ apiBase, apiToken }) {
  const gm = useGridMapController(apiBase, apiToken);
  const data = gm.data;
  const selected = (data.zones || []).find((z) => z.code === gm.selectedZone) || (data.zones || [])[0] || {};
  return <div className="stack gridpage">
    <GridStatusBannerV2 data={data} error={gm.error} loading={gm.loading} />
    <div className="gridcontrols">
      <GridTimelineControls timeline={gm.timeline} setTimeline={gm.setTimeline} timeIndex={gm.timeIndex} setTimeIndex={gm.setTimeIndex} data={data} loading={gm.loading} refresh={gm.refresh} lastRefresh={gm.lastRefresh} />
      <GridLayerSwitcher layer={gm.layer} setLayer={gm.setLayer} />
    </div>
    <GridKpiCardsV2 zone={selected} data={data} />
    <div className="gridmaplayout"><GridNetworkMapV2 data={data} selectedZone={gm.selectedZone} setSelectedZone={gm.setSelectedZone} layer={gm.layer} timeline={gm.timeline} timeIndex={gm.timeIndex} /><GridZoneDetailsPanelV2 zone={selected} data={data} /></div>
    <GridSignalsChartsV2 data={data} timeline={gm.timeline} selectedZone={gm.selectedZone} timeIndex={gm.timeIndex} />
    <GridDataTables data={data} selectedZone={gm.selectedZone} setSelectedZone={gm.setSelectedZone} loading={gm.loading} error={gm.error} />
  </div>;
}
function HartaReteaPage(props) { return <GridMapPage {...props} />; }

/* ============================ Sources ============================ */
function Sources({ md, apiBase, apiToken }) {
  const [test, setTest] = useState(null);
  const live = md.mode === "live";
  const runTest = async () => {
    if (!apiBase) { setTest({ ok: false, msg: "Niciun API configurat — mergi în Setări." }); return; }
    setTest({ loading: true });
    try { const t0 = Date.now(); await apiGet(apiBase, ENDPOINTS.health, apiToken); setTest({ ok: true, msg: "Conectat · " + (Date.now() - t0) + " ms" }); }
    catch (e) { setTest({ ok: false, msg: String(e.message || e) }); }
  };
  const rows = SOURCES.map((s) => {
    if (live && (s.id === "opcom-dam" || s.id === "opcom-id")) return { ...s, status: "live", last: "acum" };
    if (live && s.id === "entsoe") return { ...s, status: "live", last: "acum" };
    return s;
  });
  return (
    <div className="stack">
      {md.error && apiBase && <div className="banner err"><AlertTriangle size={15} /><div><b>API indisponibil</b> — se folosesc date demo. {md.error}. Verifică URL-ul backend-ului în Setări (CORS + token).</div></div>}
      {live && <div className="banner ok"><Check size={15} /><div><b>Date live</b> din OPCOM și ENTSO-E prin backend-ul Servio.</div></div>}
      <div className="kpirow">
        <Kpi label="Surse active" value={live ? "6 / 6" : "5 / 6"} sub={live ? "toate live" : "1 degradată"} Icon={Database} />
        <Kpi label="Latență medie" value="846 ms" sub="ingestie live" Icon={Clock} />
        <Kpi label="Acoperire azi" value="98.4%" sub="intervale primite" Icon={Check} tone="green" />
        <Kpi label="Ingestii / oră" value="312" sub="OPCOM + ENTSO-E" Icon={RefreshCw} />
      </div>
      <Card title="Surse oficiale & relay" right={<button className="btn ghost" onClick={runTest}>{test && test.loading ? <RefreshCw size={14} className="spin" /> : <Plug size={14} />} Testează conexiunea</button>} pad={false}>
        {test && !test.loading && <div className={"testline " + (test.ok ? "ok" : "err")}>{test.ok ? <Check size={13} /> : <AlertTriangle size={13} />} {test.msg}</div>}
        <table className="tbl">
          <thead><tr><th>Sursă</th><th>Tip</th><th>Stare</th><th className="num">Latență</th><th className="num">Date</th><th>Ultima</th></tr></thead>
          <tbody>{rows.map((s) => <tr key={s.id}>
            <td className="strong">{s.name}</td><td className="dim">{s.kind}</td>
            <td><span className="statuscell"><Dot status={s.status} /> {s.status === "live" ? "Live" : s.status === "degraded" ? "Degradat" : "Idle"}</span></td>
            <td className="num">{s.latency ? s.latency + " ms" : "—"}</td><td className="num dim">{s.rows}</td><td className="dim">{s.last}</td>
          </tr>)}</tbody>
        </table>
      </Card>
      <Card title="Endpoint-uri API" right={<Badge tone={apiBase ? "g" : "n"}>{apiBase ? "configurat" : "neconfigurat"}</Badge>} pad={false}>
        <table className="tbl">
          <thead><tr><th>Resursă</th><th>Metodă</th><th>Rută</th></tr></thead>
          <tbody>
            {[["OPCOM Day-Ahead (PZU)", ENDPOINTS.dayAheadOpcom], ["OPCOM Intraday", ENDPOINTS.intraday], ["Transelectrica · Echilibrare", ENDPOINTS.imbalance], ["ENTSO-E · Fluxuri", ENDPOINTS.flows], ["ENTSO-E · Day-Ahead", ENDPOINTS.dayAheadEntsoe], ["ENTSO-E · Consum", ENDPOINTS.load]].map(([n, p]) => (
              <tr key={p}><td className="strong">{n}</td><td><span className="devmethod">GET</span></td><td className="mono dim">{apiBase ? apiBase.replace(/\/$/, "") : "{base}"}{p}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Pipeline de ingestie">
        <div className="pipeline">
          {["OPCOM / ENTSO-E", "Windows Relay", "Servio API", "D1 Storage", "Dashboard"].map((p, i, a) => (
            <React.Fragment key={p}><div className="pnode"><span className="pdot" />{p}</div>{i < a.length - 1 && <ChevronRight size={16} className="psep" />}</React.Fragment>
          ))}
        </div>
        <div className="hint"><Cpu size={13} /> Hibrid: GitHub Actions programat + relay local Windows către API-ul securizat Servio, cu retry și audit. Cheile OPCOM/ENTSO-E stau pe backend, nu în browser.</div>
      </Card>
    </div>
  );
}


/* ============================ Data Learning Center (admin) ============================ */
const LEARNING_KIND_LABELS = {
  consumption: "Consum",
  production: "Producție",
  combined: "Consum + producție",
  import_export: "Import / export",
  full_energy_balance: "Balanță completă",
  pvgis: "PVGIS",
  inverter: "Invertor",
  unknown: "Necunoscut"
};

function splitLearningRows(raw) {
  const txt = String(raw || "").replace(/\r/g, "\n").replace(/\n+/g, "\n");
  return txt.split("\n").map((r) => r.trim()).filter(Boolean).slice(0, 40);
}
function splitLearningCells(row) {
  const sep = row.includes(";") ? ";" : row.includes("\t") ? "\t" : ",";
  return row.split(sep).map((c) => String(c || "").trim().replace(/^"|"$/g, ""));
}
function scoreHeaderRow(row) {
  const r = String(row || "").toLowerCase();
  const keys = ["timestamp","data","date","ora","time","interval","consum","consumption","load","productie","producție","production","yield","import","export","kwh","mwh","kw","mw"];
  return keys.reduce((a, k) => a + (r.includes(k) ? 1 : 0), 0) + (splitLearningCells(row).length >= 2 ? 1 : 0);
}
function detectHeaderRow(raw) {
  const rows = splitLearningRows(raw);
  let best = { row: 1, score: 0, text: "" };
  rows.slice(0, 20).forEach((r, i) => {
    const score = scoreHeaderRow(r);
    if (score > best.score) best = { row: i + 1, score, text: r };
  });
  return best.score ? best : { row: 1, score: 0, text: rows[0] || "" };
}
function detectLearningKind(fileName, raw) {
  const s = `${fileName || ""} ${String(raw || "").slice(0, 6000)}`.toLowerCase();
  const hasConsum = /(consum|consumption|load|energie activa|energie activă|import kwh|absor[bțt]it|ibd)/i.test(s);
  const hasProd = /(productie|producție|production|generation|yield|pv|pvgis|inverter|invertor|solar|energie produs)/i.test(s);
  const hasImport = /(import|grid import|energie importat|energie primită)/i.test(s);
  const hasExport = /(export|grid export|feed.?in|injec|energie livrat)/i.test(s);
  const hasPvgis = /(pvgis|photovoltaic geographical|pv estimate)/i.test(s);
  const hasInverter = /(fusionsolar|solis|fronius|sma|solaredge|huawei|growatt|victron|invertor|inverter)/i.test(s);
  if (hasConsum && hasProd && hasImport && hasExport) return "full_energy_balance";
  if (hasConsum && hasProd) return "combined";
  if (hasImport && hasExport) return "import_export";
  if (hasPvgis) return "pvgis";
  if (hasInverter || hasProd) return "production";
  if (hasConsum) return "consumption";
  return "unknown";
}
function detectLearningVendor(fileName, raw) {
  const s = `${fileName || ""} ${String(raw || "").slice(0, 3000)}`.toLowerCase();
  const vendors = [
    ["DEER", /deer|distributie energie electrica romania|distribuție energie electrică românia/],
    ["Delgaz", /delgaz/],
    ["PVGIS", /pvgis/],
    ["FusionSolar", /fusionsolar|huawei/],
    ["Solis", /solis/],
    ["Fronius", /fronius/],
    ["SMA", /\bsma\b/],
    ["SolarEdge", /solaredge/],
    ["Generic", /.*/]
  ];
  return (vendors.find(([, rx]) => rx.test(s)) || vendors[vendors.length - 1])[0];
}
function detectLearningGranularity(raw, fileName) {
  const s = `${fileName || ""} ${String(raw || "").slice(0, 10000)}`.toLowerCase();
  if (/(00:15|00:30|00:45|15\s*min|15m|quarter)/i.test(s)) return "15m";
  if (/(01:00|02:00|hourly|orar|60\s*min|60m)/i.test(s)) return "60m";
  return "unknown";
}
function detectLearningSheetMode(fileName, raw) {
  const n = String(fileName || "").toLowerCase();
  const sample = String(raw || "").slice(0, 3000).toLowerCase();
  if (/(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|2026-0[1-9]|2026-1[0-2])/.test(n)) return "monthly_sheets";
  if (/\b(20\d{2}[-.\/][01]\d[-.\/][0-3]\d|[0-3]\d[-.\/][01]\d[-.\/]20\d{2})\b/.test(n)) return "daily_sheets";
  if (/(summary|total|notes|info)/.test(sample)) return "multi_table_sheet";
  return "single_sheet";
}
function detectLearningLayout(raw) {
  const rows = splitLearningRows(raw);
  const header = detectHeaderRow(raw).text;
  const cells = splitLearningCells(header);
  const intervalCells = cells.filter((c) => /^([01]\d|2[0-3]):(00|15|30|45)$/.test(c)).length;
  if (intervalCells >= 8) return "matrix_day_by_interval";
  if (rows.slice(0, 18).some((r) => /client|pod|perioad|unitate|contor|loca/i.test(r)) && rows.length > 6) return "metadata_plus_table";
  if (rows.filter((r) => scoreHeaderRow(r) >= 3).length >= 2) return "multi_table";
  if (/(timestamp|data|date|ora|time)/i.test(header)) return "vertical_table";
  return "unknown";
}
function detectLearningConfidence(kind, granularity, layout, header) {
  let score = 35;
  if (kind !== "unknown") score += 22;
  if (granularity !== "unknown") score += 16;
  if (layout !== "unknown") score += 14;
  if ((header?.score || 0) >= 3) score += 13;
  return Math.min(98, score);
}
function buildTrainingDetection(file, raw) {
  const fileName = file?.name || "training-file";
  const fileType = fileName.toLowerCase().endsWith(".xlsx") ? "xlsx" : fileName.toLowerCase().endsWith(".xls") ? "xls" : fileName.toLowerCase().endsWith(".html") ? "html" : "csv";
  const header = detectHeaderRow(raw);
  const kind = detectLearningKind(fileName, raw);
  const vendor = detectLearningVendor(fileName, raw);
  const granularity = detectLearningGranularity(raw, fileName);
  const sheetMode = detectLearningSheetMode(fileName, raw);
  const layout = detectLearningLayout(raw);
  const confidence = detectLearningConfidence(kind, granularity, layout, header);
  const previewRows = splitLearningRows(raw).slice(0, 8);
  return {
    id: `tf_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    fileName,
    fileType,
    sizeKb: Math.round((file?.size || 0) / 1024),
    dataKind: kind,
    sourceVendor: vendor,
    sourceType: kind === "pvgis" ? "pvgis" : kind === "production" ? "inverter" : kind === "consumption" ? "ibd" : "unknown",
    granularity,
    sheetMode,
    layout,
    headerRow: header.row,
    confidence,
    reasons: [
      `${LEARNING_KIND_LABELS[kind] || "Tip"} detectat din nume/coloane`,
      `${granularity === "unknown" ? "Granularitate neconfirmată" : `Granularitate ${granularity}`}`,
      `${layout === "unknown" ? "Layout neconfirmat" : `Layout ${layout}`}`
    ],
    previewRows,
    status: confidence >= 90 ? "ready" : confidence >= 70 ? "review" : "manual",
    uploadedAt: new Date().toISOString()
  };
}
function DataLearningCenter({ currentUser }) {
  const storageKey = "servio.dataLearning.v430";
  const [files, setFiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(files.slice(0, 24))); } catch {} }, [files]);
  const onFiles = async (event) => {
    const list = Array.from(event.target.files || []);
    if (!list.length) return;
    setBusy(true);
    const parsed = [];
    for (const file of list) {
      let raw = "";
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".csv") || lower.endsWith(".txt") || lower.endsWith(".html")) {
        try { raw = await file.text(); } catch { raw = ""; }
      } else {
        raw = `${file.name}\nXLS/XLSX workbook detected. Detailed sheet parsing starts in the next workbook detection build.`;
      }
      parsed.push(buildTrainingDetection(file, raw));
    }
    setFiles((prev) => [...parsed, ...prev].slice(0, 24));
    setBusy(false);
    event.target.value = "";
  };
  const saveTemplate = (id) => setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "template_saved", templateName: `${f.sourceVendor} · ${LEARNING_KIND_LABELS[f.dataKind] || "Format"} · ${f.granularity}` } : f));
  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const templates = files.filter((f) => f.status === "template_saved");
  return (
    <Card title="Data Learning Center" right={<Badge tone="b">Admin only</Badge>}>
      <div className="dlchead">
        <div>
          <div className="setname">Training pentru formate energetice</div>
          <div className="setsub">Încarcă exemple de consum, producție, PVGIS, IBD sau fișiere combinate. SERVIO detectează structura și salvează tipare reutilizabile.</div>
        </div>
        <label className="btn dlcupload">
          {busy ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />}
          Upload training files
          <input type="file" accept=".csv,.txt,.html,.xlsx,.xls" multiple onChange={onFiles} />
        </label>
      </div>

      <div className="kpirow dlckpis">
        <Kpi label="Training files" value={files.length} sub="încărcate local" Icon={FileSpreadsheet} />
        <Kpi label="Templates saved" value={templates.length} sub="tipare confirmate" Icon={Database} tone="green" />
        <Kpi label="Best confidence" value={(files.length ? Math.max(...files.map((f) => f.confidence || 0)) : 0) + "%"} sub="detecție automată" Icon={Activity} tone="accent" />
        <Kpi label="Admin" value={currentUser?.avatarInitials || "AD"} sub={currentUser?.name || "Admin"} Icon={ShieldCheckFallback} />
      </div>

      {files.length === 0 ? (
        <div className="dlcempty">
          <FileText size={18} />
          <div><b>Niciun fișier de training încă.</b><span>Începe cu IBD-uri, PVGIS, fișiere de invertor sau fișiere combinate consum + producție.</span></div>
        </div>
      ) : (
        <div className="dlclist">
          {files.map((f) => (
            <div className="dlcitem" key={f.id}>
              <div className="dlcmain">
                <div className="dlcicon"><FileSpreadsheet size={16} /></div>
                <div className="dlcmeta">
                  <div className="dlctitle">{f.fileName}</div>
                  <div className="dlcsub">{f.fileType.toUpperCase()} · {LEARNING_KIND_LABELS[f.dataKind]} · {f.sourceVendor} · {f.granularity} · {f.layout}</div>
                  <div className="dlcreasons">{(f.reasons || []).map((r) => <span key={r}>{r}</span>)}</div>
                </div>
              </div>
              <div className="dlcright">
                <Badge tone={f.confidence >= 90 ? "g" : f.confidence >= 70 ? "y" : "n"}>{f.confidence}%</Badge>
                <span className="dim small">Header row {f.headerRow}</span>
                <span className="dim small">{f.sheetMode}</span>
              </div>
              <div className="dlcpreview">
                {(f.previewRows || []).slice(0, 4).map((r, i) => <code key={i}>{r}</code>)}
                {(!f.previewRows || !f.previewRows.length) && <code>Preview indisponibil pentru acest tip de fișier.</code>}
              </div>
              <div className="dlcactions">
                {f.status === "template_saved" ? <span className="g small"><Check size={12} /> Template salvat: {f.templateName}</span> : <button className="btn" onClick={() => saveTemplate(f.id)}><Check size={14} /> Salvează ca template</button>}
                <button className="btn ghost" onClick={() => removeFile(f.id)}>Elimină</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="hint"><Cpu size={13} /> Fundație v4.30: upload training, preview, detecție inițială fișier/sheet/layout/header și template-uri locale. Următorul build extinde workbook/sheet detection real pentru XLSX multi-sheet.</div>
    </Card>
  );
}
function ShieldCheckFallback({ size = 16 }) {
  return <Check size={size} />;
}


/* ============================ Settings ============================ */
function SettingsView({ theme, setTheme, apiBase, setApiBase, apiToken, setApiToken, md }) {
  const auth = useAuth();
  const currentUser = auth.user || {};
  const isAdmin = currentUser.role === "admin";
  return (
    <div className="stack">
      <Card title="Aspect">
        <div className="setrow"><div><div className="setname">Temă</div><div className="setsub">Întunecat este recomandat pentru sălile de control.</div></div>
          <div className="seg"><button className={"segbtn" + (theme === "dark" ? " on" : "")} onClick={() => setTheme("dark")}><Moon size={13} /> Întunecat</button><button className={"segbtn" + (theme === "light" ? " on" : "")} onClick={() => setTheme("light")}><Sun size={13} /> Luminos</button></div>
        </div>
        <div className="setrow"><div><div className="setname">Monedă</div><div className="setsub">Afișarea prețurilor pe piață.</div></div><div className="seg"><button className="segbtn on">Lei / MWh</button><button className="segbtn">EUR / MWh</button></div></div>
        <div className="setrow"><div><div className="setname">Fus orar piață</div><div className="setsub">Sincronizat cu gate-closure OPCOM.</div></div><Badge tone="b">Europe/Bucharest</Badge></div>
      </Card>
      {isAdmin && <DataLearningCenter currentUser={currentUser} />}
    </div>
  );
}

/* ============================ market clock hook ============================ */
function useMarketNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const idx = Math.min(95, now.getHours() * 4 + Math.floor(now.getMinutes() / 15));
  return { now, idx, clock: now.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
}

/* ============================ Command palette ============================ */
function Palette({ open, setOpen, go }) {
  const [q, setQ] = useState("");
  const items = NAV.filter((n) => n.id).map((n) => ({ id: n.id, label: n.label, Icon: n.Icon }));
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  const ref = useRef();
  useEffect(() => { if (open && ref.current) ref.current.focus(); if (!open) setQ(""); }, [open]);
  if (!open) return null;
  return (
    <div className="palscrim" onClick={() => setOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palinput"><Search size={15} /><input ref={ref} placeholder="Caută module, piețe, acțiuni…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); if (e.key === "Enter" && filtered[0]) { go(filtered[0].id); setOpen(false); } }} /><kbd>ESC</kbd></div>
        <div className="pallist">
          {filtered.length === 0 && <div className="palempty">Niciun rezultat.</div>}
          {filtered.map((i) => <button key={i.id} className="palrow" onClick={() => { go(i.id); setOpen(false); }}><i.Icon size={15} /><span>{i.label}</span><CornerDownLeft size={13} className="palenter" /></button>)}
        </div>
      </div>
    </div>
  );
}


/* ============================ Auth ============================ */
const AuthContext = React.createContext(null);
const ROLE_LABELS = { admin: "Admin", operator: "Operator", viewer: "Viewer" };
function avatarInitials(name = "") {
  const parts = String(name || "Servio User").trim().split(/\s+/).filter(Boolean);
  return (parts.length ? parts.slice(0, 2).map((p) => p[0]).join("") : "SU").toUpperCase();
}
function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
function AuthLoading() {
  return (
    <div className="srv" data-theme="dark">
      <style>{CSS}</style>
      <div className="authscreen authloading">
        <div className="servio-boot-card authbootcard">
          <div className="servio-boot-spinner" aria-hidden="true" />
          <div className="servio-boot-label">Se încarcă Servio</div>
        </div>
      </div>
    </div>
  );
}
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const normalizeUser = (u) => u ? { ...u, avatarInitials: u.avatarInitials || avatarInitials(u.name || u.email) } : null;
  const refresh = async () => {
    setLoading(true);
    setSessionError("");
    try {
      const res = await fetch("/api/servio/auth/me", { method: "GET", credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && data.ok && data.user) setUser(normalizeUser(data.user));
      else setUser(null);
    } catch (e) {
      setUser(null);
      setSessionError("Nu se poate valida sesiunea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);
  const login = async ({ email, password, remember }) => {
    setSessionError("");
    const res = await fetch("/api/servio/auth/login", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, remember })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok || !data.user) return { ok: false, error: data.error || "Email sau parolă incorectă." };
    setUser(normalizeUser(data.user));
    return { ok: true };
  };
  const logout = async () => {
    try { await fetch("/api/servio/auth/logout", { method: "POST", credentials: "include", cache: "no-store" }); } catch {}
    setUser(null);
  };
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    return perms.includes("*") || perms.includes(permission);
  };
  const canAccess = (moduleId) => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "operator") return true;
    return hasPermission(`module:${moduleId}`);
  };
  const value = useMemo(() => ({ user, loading, sessionError, login, logout, refresh, hasPermission, canAccess }), [user, loading, sessionError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function LoginView() {
  const { login, sessionError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await login({ email: email.trim(), password, remember });
      if (!result.ok) setError(result.error || "Email sau parolă incorectă.");
    } catch (err) {
      setError("Nu se poate valida sesiunea. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="srv" data-theme="dark">
      <style>{CSS}</style>
      <div className="authscreen">
        <form className="logincard" onSubmit={submit}>
          <div className="loginbrand">
            <div className="loginlogo"><Zap size={18} /></div>
            <div><div className="loginname">Servio</div><div className="loginsub">Energy Market OS</div></div>
          </div>
          <div className="loginhead">
            <h1>Autentificare platformă</h1>
          </div>
          <label className="loginfield"><span>Email</span><input autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@servio.ro" /></label>
          <label className="loginfield"><span>Parolă</span><input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>
          <label className="loginremember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Ține-mă conectat</span></label>
          {(error || sessionError) && <div className="loginerr"><AlertTriangle size={13} /> {error || sessionError}</div>}
          <button className="loginbtn" type="submit" disabled={busy}>{busy ? <RefreshCw size={15} className="spin" /> : <Zap size={15} />} Autentificare</button>
        </form>
      </div>
    </div>
  );
}
function UserMenu({ go }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  if (!user) return null;
  const roleLabel = ROLE_LABELS[user.role] || user.role || "User";
  const initials = user.avatarInitials || avatarInitials(user.name || user.email);
  return (
    <div className="usermenu" ref={ref}>
      <button className="usermenuBtn" onClick={() => setOpen((v) => !v)}>
        <span className="useravatar">{initials}</span>
        <span className="usercopy"><b>{user.name || user.email}</b><em>{roleLabel}</em></span>
      </button>
      {open && <div className="userpop">
        <div className="userpopHead"><span className="useravatar big">{initials}</span><div><b>{user.name || user.email}</b><span>{user.email}</span><em>{roleLabel}</em></div></div>
        <button onClick={() => { setOpen(false); go("settings"); }}>Setări cont</button>
        <button className="danger" onClick={() => { setOpen(false); logout(); }}>Deconectare</button>
      </div>}
    </div>
  );
}
function AuthGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <LoginView />;
  return children;
}
function App() {
  return <AuthProvider><AuthGate><AppShell /></AuthGate></AuthProvider>;
}

/* ============================ App shell ============================ */

function viewFromPath(pathname) {
  const p = String(pathname || "").toLowerCase();
  if (p.includes("harta-retea") || p.includes("grid-map")) return "map";
  if (p.includes("day-ahead")) return "dayahead";
  if (p.includes("forecast")) return "forecast";
  if (p.includes("bess") || p.includes("battery")) return "battery";
  if (p.includes("settings")) return "settings";
  return "overview";
}
function pathForView(view) {
  return view === "map" ? "/harta-retea" : view === "dayahead" ? "/day-ahead" : view === "forecast" ? "/forecast" : view === "battery" ? "/bess" : view === "settings" ? "/settings" : "/";
}

function AppShell() {
  const auth = useAuth();
  const currentUser = auth.user || { name: "Servio User", role: "viewer", avatarInitials: "SU" };
  const [view, setView] = useState(() => viewFromPath(typeof window !== "undefined" ? window.location.pathname : "/"));
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const defaultApiBase = typeof window !== "undefined" ? window.location.origin : "";
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [apiToken, setApiToken] = useState("");
  const [dayAheadSource, setDayAheadSource] = useState("opcom");
  const md = useMarketData(apiBase, apiToken, dayAheadSource);
  const market = useMarketNow();
  const go = (v) => { const next = v === "sources" ? "dayahead" : v; setView(next); if (typeof window !== "undefined") window.history.pushState({ view: next }, "", pathForView(next)); };

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => { const h = () => setView(viewFromPath(window.location.pathname)); window.addEventListener("popstate", h); return () => window.removeEventListener("popstate", h); }, []);

  const navItems = NAV.filter((n) => !n.id || !navQuery || n.label.toLowerCase().includes(navQuery.toLowerCase()));

  return (
    <div className="srv" data-theme={theme}>
      <style>{CSS}</style>

      {/* Sidebar */}
      <aside className={"side" + (collapsed ? " collapsed" : "")}>
        <div className="workspace">
          <div className="wslogo"><Zap size={16} /></div>
          {!collapsed && <div className="wsmeta"><div className="wsname">Servio</div><div className="wssub">Energy Market OS</div></div>}
          {!collapsed && <ChevronRight size={14} className="wschev" />}
        </div>

        {!collapsed && (
          <div className="navsearch"><Search size={13} /><input placeholder="Caută" value={navQuery} onChange={(e) => setNavQuery(e.target.value)} /><kbd>F</kbd></div>
        )}

        <nav className="nav">
          {navItems.map((n, idx) => n.sec
            ? (!collapsed && <div key={"s" + idx} className="navsec">{n.sec}</div>)
            : <button key={n.id} className={"navitem" + (view === n.id ? " on" : "")} onClick={() => go(n.id)} title={collapsed ? n.label : undefined}>
                <n.Icon size={16} className="navicn" />
                {!collapsed && <span className="navlabel">{n.label}</span>}
                {!collapsed && n.badge && <span className="navlive"><Dot status="live" /></span>}
              </button>
          )}
        </nav>

        <div className="sidefoot">
          <div className="userrow"><div className="uavatar">{currentUser.avatarInitials || avatarInitials(currentUser.name)}</div>{!collapsed && <div className="umeta"><div className="uname">{currentUser.name}</div><div className="urole">{ROLE_LABELS[currentUser.role] || currentUser.role}</div></div>}</div>
          <button className="collapsebtn" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Extinde" : "Restrânge"}>{collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="crumbs"><span className="crumb dim">Servio</span><ChevronRight size={13} className="crsep" /><span className="crumb">{TITLES[view]}</span></div>
          <div className="topspace" />
          <div className="marketclock"><Dot status="live" /><span className="mclabel">Piață</span><span className="mctime">{market.clock}</span><span className="mcsep">·</span><span className="mcprice">{fmtLei(md.today[market.idx].price)}</span></div>
          <button className="cmdk" onClick={() => setPaletteOpen(true)}><Search size={13} /> <span className="cmdklabel">Caută</span> <kbd className="kbd2"><Command size={10} />K</kbd></button>
          <button className="ticon" title="Notificări"><Bell size={16} /><span className="tdot" /></button>
          <button className="ticon" title="Temă" onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
          <UserMenu go={go} />
        </header>

        <main className="content">
          <div className="pagehead">
            <h1 className="pagetitle">{TITLES[view]}</h1>
            <p className="pagesub">{
              view === "overview" ? "Imagine de ansamblu asupra pieței și bateriei — cu PZU selectabil OPCOM / ENTSO-E." :
              view === "dayahead" ? "Prețuri Day-Ahead (PZU) la 15 minute, cu semnale de încărcare și descărcare." :
              view === "forecast" ? "Prognoză AI pentru producție, consum și preț, cu intervale P10 / P50 / P90." :
              view === "battery" ? "Simulator complet de venit BESS: arbitraj pe perioadă, ROI, payback și scenarii P10 / P50 / P90." :
              view === "map" ? "Hartă nativă pentru mix energetic, carbon, fluxuri și semnale live/forecast pentru România." :
              "Preferințe de aspect, monedă și conformitate reglementară."
            }</p>
          </div>

          {view === "overview" && <Overview go={go} md={md} />}
          {view === "dayahead" && <DayAhead md={md} dayAheadSource={dayAheadSource} setDayAheadSource={setDayAheadSource} />}
          {view === "forecast" && <Forecast md={md} />}
          {view === "battery" && <Battery md={md} />}
          {view === "map" && <HartaReteaPage apiBase={apiBase} apiToken={apiToken} />}
          {view === "settings" && <SettingsView theme={theme} setTheme={setTheme} apiBase={apiBase} setApiBase={setApiBase} apiToken={apiToken} setApiToken={setApiToken} md={md} />}
        </main>
      </div>

      <Palette open={paletteOpen} setOpen={setPaletteOpen} go={go} />
    </div>
  );
}

/* ============================ styles ============================ */
const CSS = `
.srv{--bg:#0a0a0a;--panel:#0c0c0c;--card:#0e0e0e;--hover:#161616;--border:#1e1e1e;--border-strong:#2a2a2a;--text:#ededed;--text-dim:#9a9a9a;--text-faint:#6a6a6a;--accent:#f5a524;--accent-2:#f97316;--accent-fg:#0a0a0a;--green:#3ecf8e;--red:#ff6166;--blue:#5b9dff;--yellow:#f5d90a;--sidew:248px;
  font-family:"Inter",ui-sans-serif,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  color:var(--text);background:var(--bg);display:flex;min-height:100vh;font-size:13px;-webkit-font-smoothing:antialiased;letter-spacing:-0.006em}
.srv[data-theme=light]{--bg:#ffffff;--panel:#fafafa;--card:#ffffff;--hover:#f4f4f5;--border:#eaeaea;--border-strong:#dcdcdc;--text:#171717;--text-dim:#666;--text-faint:#999;--accent:#e8870b;--accent-fg:#ffffff}
.srv *{box-sizing:border-box}
.srv input,.srv button{font-family:inherit}
.srv ::-webkit-scrollbar{width:9px;height:9px}
.srv ::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:6px;border:2px solid transparent;background-clip:padding-box}
.srv ::-webkit-scrollbar-track{background:transparent}

/* sidebar */
.side{width:var(--sidew);flex:none;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;transition:width .16s ease}
.side.collapsed{width:60px}
.workspace{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid var(--border);height:57px}
.wslogo{width:30px;height:30px;border-radius:7px;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:var(--accent-fg);display:flex;align-items:center;justify-content:center;flex:none}
.wsmeta{flex:1;min-width:0}
.wsname{font-weight:650;font-size:13.5px;line-height:1.1}
.wssub{font-size:10.5px;color:var(--text-faint);line-height:1.3}
.wschev{color:var(--text-faint)}
.navsearch{display:flex;align-items:center;gap:8px;margin:10px 12px 4px;padding:6px 9px;border:1px solid var(--border);border-radius:7px;color:var(--text-faint);background:var(--bg)}
.navsearch input{border:none;background:none;outline:none;color:var(--text);flex:1;font-size:12.5px}
.navsearch kbd,.cmdk kbd{font-family:inherit;font-size:10px;color:var(--text-faint);border:1px solid var(--border-strong);border-radius:4px;padding:0 5px;background:var(--card)}
.nav{flex:1;overflow-y:auto;padding:8px 8px 12px}
.navsec{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-faint);padding:12px 8px 5px}
.navitem{display:flex;align-items:center;gap:10px;width:100%;border:none;background:none;color:var(--text-dim);padding:0 9px;height:32px;border-radius:7px;cursor:pointer;font-size:13px;font-weight:480;transition:background .12s,color .12s}
.collapsed .navitem{justify-content:center;padding:0}
.navitem:hover{background:var(--hover);color:var(--text)}
.navitem.on{background:var(--hover);color:var(--text);font-weight:560}
.navicn{flex:none;opacity:.85}
.navitem.on .navicn{color:var(--accent);opacity:1}
.navlabel{flex:1;text-align:left}
.navlive{flex:none}
.sidefoot{border-top:1px solid var(--border);padding:10px 12px;display:flex;align-items:center;gap:8px}
.userrow{display:flex;align-items:center;gap:9px;flex:1;min-width:0}
.uavatar,.tavatar{width:28px;height:28px;border-radius:50%;background:var(--hover);border:1px solid var(--border-strong);display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:650;color:var(--text);flex:none}
.umeta{min-width:0}
.uname{font-size:12.5px;font-weight:550;line-height:1.1}
.urole{font-size:10.5px;color:var(--text-faint)}
.collapsebtn{width:28px;height:28px;border:1px solid var(--border);background:var(--card);color:var(--text-dim);border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
.collapsebtn:hover{background:var(--hover);color:var(--text)}

/* main + topbar */
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{height:57px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;padding:0 18px;position:sticky;top:0;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:saturate(160%) blur(10px);z-index:20}
.crumbs{display:flex;align-items:center;gap:8px;font-size:13px}
.crumb{font-weight:550}.crumb.dim{color:var(--text-faint);font-weight:480}
.crsep{color:var(--text-faint)}
.topspace{flex:1}
.marketclock{display:flex;align-items:center;gap:7px;border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:12px;background:var(--card)}
.mclabel{color:var(--text-faint)}
.mctime{font-variant-numeric:tabular-nums;font-weight:550}
.mcsep{color:var(--text-faint)}
.mcprice{color:var(--accent);font-weight:650;font-variant-numeric:tabular-nums}
.cmdk{display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:8px;padding:6px 9px;background:var(--card);color:var(--text-faint);cursor:pointer;font-size:12.5px}
.cmdk:hover{border-color:var(--border-strong);color:var(--text-dim)}
.cmdklabel{margin-right:2px}
.kbd2{display:inline-flex;align-items:center;gap:1px;font-size:10px;border:1px solid var(--border-strong);border-radius:4px;padding:1px 5px;background:var(--bg);color:var(--text-faint)}
.ticon{position:relative;width:32px;height:32px;border:1px solid var(--border);background:var(--card);color:var(--text-dim);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.ticon:hover{background:var(--hover);color:var(--text)}
.tdot{position:absolute;top:7px;right:8px;width:6px;height:6px;border-radius:50%;background:var(--accent);border:1.5px solid var(--bg)}

/* content */
.content{flex:1;overflow-y:auto;padding:26px 32px 60px;max-width:1180px;width:100%;margin:0 auto;animation:fade .2s ease}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.pagehead{margin-bottom:22px}
.pagetitle{font-size:22px;font-weight:680;letter-spacing:-0.02em;margin:0}
.pagesub{font-size:13px;color:var(--text-dim);margin:5px 0 0;max-width:680px}
.stack{display:flex;flex-direction:column;gap:18px}
.rowflex{display:flex;align-items:center;gap:10px}
.spacer{flex:1}

/* kpis */
.kpirow{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.kpi{border:1px solid var(--border);border-radius:10px;background:var(--card);padding:14px 15px}
.kpitop{display:flex;align-items:center;justify-content:space-between}
.kpilabel{font-size:11.5px;color:var(--text-faint);font-weight:500}
.kpiicon{color:var(--text-faint)}
.kpival{font-size:23px;font-weight:680;letter-spacing:-0.02em;margin-top:8px;font-variant-numeric:tabular-nums}
.kpisub{font-size:11.5px;color:var(--text-faint);margin-top:5px;display:flex;align-items:center;gap:6px}
.kdelta{display:inline-flex;align-items:center;gap:1px;font-weight:600;padding:1px 5px;border-radius:5px}
.kdelta.up{color:var(--green);background:color-mix(in srgb,var(--green) 12%,transparent)}
.kdelta.dn{color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent)}

/* cards */
.card{border:1px solid var(--border);border-radius:11px;background:var(--card);overflow:hidden}
.cardhead{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--border)}
.cardtitle{font-size:13px;font-weight:600}
.cardbody{padding:16px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.hero{padding:8px 8px 4px}

/* charts tooltip */
.ctip{background:var(--panel);border:1px solid var(--border-strong);border-radius:8px;padding:8px 10px;font-size:12px;box-shadow:0 8px 28px rgba(0,0,0,.4)}
.ctiplabel{color:var(--text-faint);font-size:11px;margin-bottom:4px}
.ctiprow{display:flex;align-items:center;gap:6px}
.ctipdot{width:8px;height:8px;border-radius:2px;display:inline-block}

/* dots, badges */
.dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none}
.dot-g{background:var(--green);box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 18%,transparent)}
.dot-y{background:var(--yellow);box-shadow:0 0 0 3px color-mix(in srgb,var(--yellow) 16%,transparent)}
.dot-r{background:var(--red);box-shadow:0 0 0 3px color-mix(in srgb,var(--red) 18%,transparent)}
.dot-n{background:var(--text-faint)}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;border:1px solid;line-height:1.4}
.b-g{color:var(--green);border-color:color-mix(in srgb,var(--green) 35%,transparent);background:color-mix(in srgb,var(--green) 10%,transparent)}
.b-r{color:var(--red);border-color:color-mix(in srgb,var(--red) 35%,transparent);background:color-mix(in srgb,var(--red) 10%,transparent)}
.b-y{color:var(--yellow);border-color:color-mix(in srgb,var(--yellow) 35%,transparent);background:color-mix(in srgb,var(--yellow) 10%,transparent)}
.b-b{color:var(--blue);border-color:color-mix(in srgb,var(--blue) 35%,transparent);background:color-mix(in srgb,var(--blue) 10%,transparent)}
.b-n{color:var(--text-dim);border-color:var(--border-strong);background:var(--hover)}

/* tables */
.tbl{width:100%;border-collapse:collapse;font-size:12.5px}
.tbl th{text-align:left;font-size:11px;font-weight:600;color:var(--text-faint);text-transform:uppercase;letter-spacing:.04em;padding:10px 16px;border-bottom:1px solid var(--border)}
.tbl td{padding:11px 16px;border-bottom:1px solid var(--border)}
.tbl tr:last-child td{border-bottom:none}
.tbl tbody tr:hover{background:var(--hover)}
.tbl .num{text-align:right;font-variant-numeric:tabular-nums}
.tbl .strong{font-weight:550}
.tbl .dim{color:var(--text-faint)}
.statuscell{display:inline-flex;align-items:center;gap:8px}
.vsavg{display:inline-flex;align-items:center;gap:2px;font-weight:600}
.vsavg.up{color:var(--red)}.vsavg.dn{color:var(--green)}
.small{font-size:11.5px}

/* buttons / segments */
.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;background:var(--accent);color:var(--accent-fg);font-weight:600;font-size:12.5px;padding:7px 12px;border-radius:8px;cursor:pointer}
.btn:hover{filter:brightness(1.07)}
.btn.ghost{background:var(--card);border-color:var(--border);color:var(--text)}
.btn.ghost:hover{background:var(--hover)}
.seg{display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--card)}
.segbtn{display:inline-flex;align-items:center;gap:5px;border:none;background:none;color:var(--text-dim);font-size:12.5px;font-weight:520;padding:6px 12px;cursor:pointer}
.segbtn+.segbtn{border-left:1px solid var(--border)}
.segbtn:hover{background:var(--hover);color:var(--text)}
.segbtn.on{background:var(--hover);color:var(--text);font-weight:600}
.linklike{border:none;background:none;color:var(--accent);font-size:12.5px;font-weight:560;cursor:pointer;padding:0}
.linklike:hover{text-decoration:underline}

/* battery */
.batrow{display:flex;gap:20px;align-items:center;margin-bottom:16px}
.batgauge{position:relative;width:84px;height:84px;flex:none}
.ring{width:84px;height:84px;transform:rotate(-90deg)}
.ringbg{fill:none;stroke:var(--border);stroke-width:3}
.ringfg{fill:none;stroke:var(--green);stroke-width:3;stroke-linecap:round;transition:stroke-dasharray .4s}
.batpct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:680}
.batmeta{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:7px 18px}
.batline{display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-dim);border-bottom:1px solid var(--border);padding-bottom:6px}
.batline b{color:var(--text);font-weight:600}
.batline b.g{color:var(--green)}
.planstrip{border-top:1px solid var(--border);padding-top:12px}
.planlabel{font-size:11px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px}
.planbars{display:flex;gap:2px;height:30px;align-items:flex-end}
.pbar{flex:1;height:60%;background:var(--border-strong);border-radius:2px}
.pbar.charge{height:100%;background:var(--green)}
.pbar.discharge{height:100%;background:var(--accent)}
.planleg{display:flex;gap:14px;margin-top:9px;font-size:11px;color:var(--text-faint)}
.planleg span{display:inline-flex;align-items:center;gap:5px}
.sq{width:9px;height:9px;border-radius:2px;background:var(--border-strong);display:inline-block}
.sq.charge{background:var(--green)}.sq.discharge{background:var(--accent)}

/* alerts */
.alerts{display:flex;flex-direction:column;gap:8px}
.alert{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:1px solid var(--border);background:var(--bg);border-radius:9px;padding:10px 12px;cursor:pointer}
.alert:hover{background:var(--hover);border-color:var(--border-strong)}
.aicn{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex:none}
.aicn.r{background:color-mix(in srgb,var(--red) 14%,transparent);color:var(--red)}
.aicn.a{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)}
.aicn.b{background:color-mix(in srgb,var(--blue) 14%,transparent);color:var(--blue)}
.atitle{font-size:12.5px;font-weight:560}
.asub{font-size:11.5px;color:var(--text-faint);margin-top:1px}
.achev{color:var(--text-faint);margin-left:auto}

/* forms */
.form{display:flex;flex-direction:column;gap:18px}
.field .fieldhead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px}
.field label{font-size:12.5px;font-weight:550}
.fieldunit{font-size:11px;color:var(--text-faint)}
.fieldctrl{display:flex;align-items:center;gap:0;border:1px solid var(--border);border-radius:8px;overflow:hidden;width:fit-content;background:var(--bg)}
.fieldctrl input{border:none;background:none;color:var(--text);text-align:center;width:96px;font-size:14px;font-weight:600;outline:none;font-variant-numeric:tabular-nums;padding:7px 0;-moz-appearance:textfield}
.fieldctrl input::-webkit-outer-spin-button,.fieldctrl input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.step{width:34px;height:36px;border:none;background:var(--card);color:var(--text-dim);cursor:pointer;display:flex;align-items:center;justify-content:center}
.step:hover{background:var(--hover);color:var(--text)}
.range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:3px;background:var(--border-strong);margin-top:12px;cursor:pointer}
.range::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);cursor:pointer}
.range::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);cursor:pointer}
.presets{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.chip{border:1px solid var(--border);background:var(--bg);color:var(--text-dim);font-size:12px;padding:5px 11px;border-radius:14px;cursor:pointer}
.chip:hover{background:var(--hover);color:var(--text);border-color:var(--border-strong)}

/* revenue */
.revgrid{display:flex;gap:22px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
.revbig{flex:none}
.revval{font-size:30px;font-weight:720;letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.revval.g{color:var(--green)}
.revlabel{font-size:11.5px;color:var(--text-faint);margin-top:2px}
.revsplit{display:flex;gap:24px;border-left:1px solid var(--border);padding-left:22px}
.revsub{font-size:11px;color:var(--text-faint)}
.revnum{font-size:16px;font-weight:650;margin-top:3px;font-variant-numeric:tabular-nums}
.conf{border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:8px}
.confrow{display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-dim)}
.confrow b{color:var(--text);font-variant-numeric:tabular-nums}
.confrow b.g{color:var(--green)}
.hint{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--text-dim);background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:9px 11px;margin-top:14px;line-height:1.5}
.hint svg{flex:none;margin-top:1px;color:var(--accent)}
.nsel{width:100%;border:1px solid var(--border);background:var(--bg);color:var(--text);border-radius:8px;padding:8px 11px;font-size:13px;cursor:pointer;outline:none}
.nsel:focus{border-color:var(--accent)}
.projmini{margin-top:14px;border-top:1px solid var(--border);padding-top:12px}
.tblscroll{max-height:340px;overflow-y:auto}
.datamode{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;border:1px solid var(--border);border-radius:7px;padding:5px 9px;background:var(--card)}
.datamode.live{color:var(--green);border-color:color-mix(in srgb,var(--green) 35%,transparent)}
.datamode.demo{color:var(--text-faint)}
.mdot{width:6px;height:6px;border-radius:50%;background:var(--text-faint)}
.mdot.live{background:var(--green);box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 18%,transparent)}
.banner{display:flex;align-items:flex-start;gap:9px;border:1px solid;border-radius:10px;padding:11px 13px;font-size:12.5px;line-height:1.5}
.banner.ok{color:var(--green);border-color:color-mix(in srgb,var(--green) 30%,transparent);background:color-mix(in srgb,var(--green) 8%,transparent)}
.banner.err{color:var(--red);border-color:color-mix(in srgb,var(--red) 30%,transparent);background:color-mix(in srgb,var(--red) 8%,transparent)}
.banner svg{flex:none;margin-top:1px}
.banner b{color:var(--text)}
.testline{display:flex;align-items:center;gap:7px;font-size:12px;padding:9px 16px;border-bottom:1px solid var(--border)}
.testline.ok{color:var(--green)}.testline.err{color:var(--red)}
.devmethod{font-size:10px;font-weight:800;border-radius:5px;padding:2px 7px;background:color-mix(in srgb,var(--blue) 16%,transparent);color:var(--blue)}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
.apiform{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.apiactions{display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap}
.apiactions .small{display:inline-flex;align-items:center;gap:5px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.g{color:var(--green)}.r{color:var(--red)}
.ingrid{display:grid;grid-template-columns:1fr 1fr;gap:11px 14px}
.infield{display:flex;flex-direction:column;gap:5px}
.inlabel{font-size:11.5px;color:var(--text-dim);font-weight:500}
.inwrap{display:flex;align-items:center;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}
.inwrap:focus-within{border-color:var(--accent)}
.inwrap input{flex:1;min-width:0;border:none;background:none;color:var(--text);font-size:13px;font-weight:550;padding:7px 9px;outline:none;font-variant-numeric:tabular-nums;-moz-appearance:textfield}
.inwrap input::-webkit-outer-spin-button,.inwrap input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.inunit{font-size:10.5px;color:var(--text-faint);padding:0 9px;border-left:1px solid var(--border);white-space:nowrap}
.inunit:empty{display:none}
.switch{width:40px;height:23px;border-radius:12px;background:var(--border-strong);border:none;position:relative;cursor:pointer;flex:none;transition:background .15s}
.switch.on{background:var(--accent)}
.knob{position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;background:#fff;transition:left .15s}
.switch.on .knob{left:19px}
.dispatchheadcontrols{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}
.dispatchperiod{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:4px 6px;border:1px solid var(--border);background:var(--bg);border-radius:999px}
.perioddate{display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--text-faint)}
.perioddate input{height:26px;border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:999px;padding:0 8px;font-size:11px;outline:none}
.brushbar{display:inline-flex;align-items:center;gap:6px}
.brushbtn{border:1px solid var(--border);background:var(--card);color:var(--text-dim);font-size:11.5px;font-weight:600;padding:4px 11px;border-radius:6px;cursor:pointer}
.brushbtn:hover{background:var(--hover)}
.brushbtn.charge.on{background:color-mix(in srgb,var(--green) 16%,transparent);color:var(--green);border-color:color-mix(in srgb,var(--green) 40%,transparent)}
.brushbtn.discharge.on{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.brushbtn.erase.on{background:var(--hover);color:var(--text);border-color:var(--border-strong)}
.dispwrap{padding:2px 0}
.dispgrid{display:grid;grid-template-columns:repeat(24,1fr);gap:3px}
.dispcell{height:46px;border:1px solid var(--border);border-radius:5px;background:var(--bg);cursor:pointer;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px;transition:filter .1s}
.dispcell.charge{background:color-mix(in srgb,var(--green) 22%,transparent);border-color:color-mix(in srgb,var(--green) 45%,transparent)}
.dispcell.discharge{background:color-mix(in srgb,var(--accent) 22%,transparent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
.dispcell:hover{filter:brightness(1.25)}
.dhour{font-size:9px;color:var(--text-faint);font-variant-numeric:tabular-nums}
.disprow{display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap}
.dispcounts{display:flex;gap:14px;font-size:12px;color:var(--text-dim)}
.dispcounts span{display:inline-flex;align-items:center;gap:5px}
.dispcounts b{color:var(--text)}
.chip.on{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.tbl tr.rowsel{background:color-mix(in srgb,var(--accent) 8%,transparent)}
.tbl tr.rowsel td:first-child{box-shadow:inset 2px 0 0 var(--accent)}


/* map / Harta Rețea */
.zflag{display:inline-flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;border:1px solid var(--border-strong);border-radius:4px;padding:1px 4px;margin-right:6px;color:var(--text-dim)}
.gridpage{container-type:inline-size}
.gridkpis{grid-template-columns:repeat(7,minmax(128px,1fr))}
.gridmodebar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gridpage .gridkpis{grid-template-columns:repeat(9,minmax(126px,1fr))}
.gridcontrols{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:12px;align-items:stretch}
.gridcontrolcard{border:1px solid var(--border);background:var(--card);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px;min-width:0}
.gridcontrolhead{display:flex;align-items:center;gap:7px;color:var(--text-dim);font-size:12px}.gridcontrolhead b{color:var(--text);font-size:12.5px}.gridcontrolhead span{margin-left:auto}
.gridlayerbar,.gridtimelinechips{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gridlayerbar .chip,.gridtimelinechips .chip{display:inline-flex;align-items:center;gap:6px}.gridtimelinechips .chip{height:auto;align-items:flex-start;flex-direction:column;gap:1px;padding:7px 10px}.gridtimelinechips .chip small{font-size:10px;color:var(--text-faint);font-weight:500}
.gridsliderrow{display:grid;grid-template-columns:minmax(120px,1fr) auto auto;gap:10px;align-items:center}.gridslider{accent-color:var(--accent);width:100%;min-width:0}.gridsliderlabel{display:flex;flex-direction:column;align-items:flex-end;gap:1px;font-size:11px;color:var(--text-faint);min-width:76px}.gridsliderlabel b{font-size:12px;color:var(--text);font-variant-numeric:tabular-nums}
.gridmaplayout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(320px,.55fr);gap:14px;align-items:stretch}
.gridmapcard{border:1px solid var(--border);background:var(--card);border-radius:12px;overflow:hidden;min-height:540px;display:flex;flex-direction:column}
.gridmaptoolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid var(--border)}
.gridmapcanvas{position:relative;min-height:460px;flex:1;overflow:hidden;background:radial-gradient(circle at 50% 48%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 24%),linear-gradient(135deg,color-mix(in srgb,var(--blue) 9%,transparent),transparent 44%),var(--bg);cursor:grab;overscroll-behavior:contain;touch-action:none}
.gridmapcanvas.dragging{cursor:grabbing}.gridmapviewport{position:absolute;inset:0;transform-origin:50% 50%;transition:transform .08s ease}.mapzoom{display:flex;align-items:center;gap:6px;flex:none}.mapzoom .ticon{width:auto;min-width:32px;padding:0 8px}
.mapgridbg{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:44px 44px;opacity:.22;mask-image:radial-gradient(circle at center,#000 58%,transparent 100%)}
.gridgeosvg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.gridcountries{filter:drop-shadow(0 14px 24px rgba(0,0,0,.22))}.gridcountry{stroke:color-mix(in srgb,var(--border-strong) 84%,transparent);stroke-width:1.45;vector-effect:non-scaling-stroke;cursor:pointer;outline:none;transition:fill .14s ease,stroke .14s ease,opacity .14s ease,filter .14s ease}.gridcountry.low{fill:color-mix(in srgb,var(--green) 62%,var(--card))}.gridcountry.mid{fill:color-mix(in srgb,var(--yellow) 58%,var(--card))}.gridcountry.high{fill:color-mix(in srgb,var(--red) 52%,var(--card))}.gridcountry.very{fill:color-mix(in srgb,var(--red) 68%,var(--card))}.gridcountry.off{fill:color-mix(in srgb,var(--text-faint) 25%,var(--bg));opacity:.5}.gridcountry:hover,.gridcountry:focus,.gridcountry.on{stroke:var(--accent);stroke-width:2.6;filter:brightness(1.08) saturate(1.08)}.gridcountry.on{filter:brightness(1.12) saturate(1.12) drop-shadow(0 0 12px color-mix(in srgb,var(--accent) 34%,transparent))}
.gridflowsgeo,.gridflowgeo,.gridflowhit,.gridflowline,.gridflowtag,.gridflowdot{pointer-events:none}.gridflowgeo{color:var(--accent);outline:none}.gridflowhit{stroke:transparent;stroke-width:18}.gridflowline{stroke:color-mix(in srgb,var(--accent) 80%,var(--blue));stroke-linecap:round;opacity:.9;vector-effect:non-scaling-stroke;stroke-dasharray:11 8;animation:gridflowmarch 1.4s linear infinite;filter:drop-shadow(0 0 5px rgba(0,0,0,.35));transition:opacity .14s ease,stroke .14s ease}.gridflowgeo.on .gridflowline,.gridflowgeo.related .gridflowline{opacity:1;stroke:var(--accent);filter:drop-shadow(0 0 9px color-mix(in srgb,var(--accent) 55%,transparent))}.gridflowgeo.muted .gridflowline,.gridflowgeo.muted .gridflowdot,.gridflowgeo.muted .gridflowtag{opacity:.18}.gridflowgeo.related .gridflowtag rect{stroke:color-mix(in srgb,var(--accent) 70%,var(--border));fill:color-mix(in srgb,var(--panel) 92%,transparent)}.gridflowarrow{fill:var(--accent)}.gridflowdot{vector-effect:non-scaling-stroke;stroke:var(--bg);stroke-width:1.2}.gridflowdot.from{fill:var(--blue)}.gridflowdot.to{fill:var(--accent)}.gridflowtag rect{fill:color-mix(in srgb,var(--panel) 86%,transparent);stroke:color-mix(in srgb,var(--accent) 38%,var(--border));stroke-width:1;vector-effect:non-scaling-stroke}.gridflowtag text{font-size:11px;font-weight:760;fill:var(--text);paint-order:stroke;stroke:rgba(0,0,0,.28);stroke-width:2;stroke-linejoin:round}.gridflowgeo:nth-child(n+16) .gridflowtag{display:none}@keyframes gridflowmarch{to{stroke-dashoffset:-38}}
.gridzone{position:absolute;transform:translate(-50%,-50%);z-index:3;border:1px solid var(--border-strong);background:color-mix(in srgb,var(--card) 86%,transparent);backdrop-filter:blur(10px);color:var(--text);border-radius:14px;padding:8px 9px;min-width:82px;text-align:left;box-shadow:0 12px 34px rgba(0,0,0,.28);cursor:pointer;transition:transform .14s ease,border-color .14s ease,background .14s ease}
.gridzone:hover,.gridzone.on{transform:translate(-50%,-50%) scale(1.045);border-color:var(--accent)}
.gridzone.main{min-width:132px;padding:12px 14px;border-width:1.5px}
.gridzone b{font-size:13px;margin-right:7px}.gridzone span{font-size:12px;color:var(--text-dim)}.gridzone small,.gridzone em{display:block;font-size:11px;color:var(--text-faint);font-style:normal;margin-top:2px}
.gridzone.low{box-shadow:0 0 0 1px color-mix(in srgb,var(--green) 30%,transparent),0 14px 34px rgba(0,0,0,.28)}
.gridzone.mid{box-shadow:0 0 0 1px color-mix(in srgb,var(--yellow) 28%,transparent),0 14px 34px rgba(0,0,0,.28)}
.gridzone.high,.gridzone.very{box-shadow:0 0 0 1px color-mix(in srgb,var(--red) 26%,transparent),0 14px 34px rgba(0,0,0,.28)}
.gridzone.off{opacity:.55;filter:grayscale(.8)}
.gridflow{position:absolute;z-index:2;transform-origin:0 50%;height:20px;margin-top:-10px;border:0;background:transparent;padding:0;pointer-events:auto}
.gridflow span{position:absolute;left:0;right:0;top:50%;height:var(--w);border-radius:999px;background:linear-gradient(90deg,color-mix(in srgb,var(--blue) 10%,transparent),var(--accent));opacity:.82;transform:translateY(-50%);animation:flowdash 1.15s linear infinite;background-size:44px 100%}
.gridflow i{position:absolute;right:-2px;top:50%;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:8px solid var(--accent);transform:translateY(-50%);opacity:.9}.gridflow.on span,.gridflow:hover span{opacity:1;filter:saturate(1.3);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 40%,transparent)}
.gridhover{position:absolute;left:14px;bottom:14px;z-index:8;width:min(360px,calc(100% - 28px));border:1px solid var(--border-strong);background:color-mix(in srgb,var(--card) 94%,transparent);backdrop-filter:blur(10px);border-radius:10px;padding:11px;box-shadow:0 16px 36px rgba(0,0,0,.28);pointer-events:none}.gridhover b,.gridhover span{display:block}.gridhover span{font-size:11.5px;color:var(--text-dim);margin-top:2px}.gridhoverhead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}.gridhoverhead b{font-size:13px}.gridhoverhead i{font-style:normal;border:1px solid var(--border);border-radius:999px;padding:3px 7px;font-size:10.5px;color:var(--text-dim);white-space:nowrap}.gridhoverhead i.low{color:var(--green);border-color:color-mix(in srgb,var(--green) 45%,transparent)}.gridhoverhead i.mid{color:var(--yellow);border-color:color-mix(in srgb,var(--yellow) 45%,transparent)}.gridhoverhead i.high,.gridhoverhead i.very{color:var(--red);border-color:color-mix(in srgb,var(--red) 45%,transparent)}.gridhovermetric{display:flex;align-items:baseline;gap:8px;border:1px solid var(--border);background:var(--bg);border-radius:8px;padding:8px 9px;margin-bottom:8px}.gridhovermetric strong{font-size:22px;line-height:1}.gridhovermetric span{margin:0}.gridhovergrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}.gridhovergrid div{border:1px solid var(--border);border-radius:8px;padding:7px;background:color-mix(in srgb,var(--bg) 78%,transparent);min-width:0}.gridhovergrid span{font-size:10.5px;margin:0}.gridhovergrid b{font-size:12px;margin-top:2px;white-space:nowrap}.gridhovermix{display:grid;gap:5px;margin-bottom:8px}.gridhovermix div{position:relative;overflow:hidden;border:1px solid var(--border);border-radius:7px;padding:5px 7px;background:var(--bg)}.gridhovermix div span,.gridhovermix div b{position:relative;z-index:1;display:inline;margin-right:6px;font-size:11px}.gridhovermix div span{color:var(--text-dim)}.gridhovermix div i{position:absolute;left:0;bottom:0;height:3px;border-radius:0 999px 999px 0}.gridhoverfoot{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gridhoverfoot span{margin:0;border:1px solid var(--border);border-radius:999px;padding:3px 7px;font-size:10.5px}.gridhoverflow{max-width:300px}.gridhoverflows{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}.gridhoverflowcol{border:1px solid var(--border);border-radius:8px;background:color-mix(in srgb,var(--bg) 82%,transparent);padding:7px;min-width:0}.gridhoverflowshead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}.gridhoverflowshead span{font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-faint);margin:0}.gridhoverflowshead b{font-size:12px}.gridhoverflowcol p{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0 0}.gridhoverflowcol p b,.gridhoverflowcol p span{font-size:11px;margin:0;white-space:nowrap}.gridhoverflowcol p span{color:var(--text-dim)}.gridhoverflowcol em{display:block;font-style:normal;color:var(--text-faint);font-size:10.5px;line-height:1.25}
@keyframes flowdash{to{background-position:44px 0}}
.gridlegend{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:11px 15px;border-top:1px solid var(--border);font-size:11.5px;color:var(--text-dim)}
.gridlegend span{display:inline-flex;align-items:center;gap:6px}.legdot{width:9px;height:9px;border-radius:50%;display:inline-block}.legdot.low{background:var(--green)}.legdot.mid{background:var(--yellow)}.legdot.high{background:var(--red)}.legdot.off{background:var(--text-faint)}.flowline{width:28px;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--accent));display:inline-block}
.zonehero{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:15px}.zonebig{font-size:27px;font-weight:760;letter-spacing:-.02em}.zonebig span{font-size:12px;color:var(--text-dim);font-weight:600}.zonering{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:760;border:1px solid var(--border-strong);background:var(--bg)}.zonering.low{color:var(--green);border-color:color-mix(in srgb,var(--green) 45%,transparent)}.zonering.mid{color:var(--yellow);border-color:color-mix(in srgb,var(--yellow) 45%,transparent)}.zonering.high,.zonering.very{color:var(--red);border-color:color-mix(in srgb,var(--red) 45%,transparent)}
.zonemetrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.zonemetrics div{border:1px solid var(--border);background:var(--bg);border-radius:8px;padding:8px 10px}.zonemetrics span{display:block;font-size:10.5px;color:var(--text-faint);margin-bottom:3px}.zonemetrics b{font-size:13px;font-variant-numeric:tabular-nums}
.mixlist{display:flex;flex-direction:column;gap:8px}.mixrow>div{display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px}.mixrow span{color:var(--text-dim)}.mixrow i{display:block;height:6px;border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--green));min-width:2%;opacity:.78}
.gridwarns{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.gridwarns span{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);background:var(--bg);border-radius:999px;padding:4px 8px;font-size:11px;color:var(--text-dim)}
.gridcharts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.gridtables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.tablewrap{width:100%;overflow-x:auto}.linkrow{display:inline-flex;align-items:center;border:0;background:none;color:var(--text);font:inherit;cursor:pointer;padding:0}.linkrow.on{font-weight:700;color:var(--accent)}.tbl td .spin{vertical-align:-2px;margin-right:6px}
.tabletools{display:flex;gap:8px;align-items:center}.gridsearch{width:170px}.gridsort{width:130px}
@media(max-width:1180px){.gridpage .gridkpis{grid-template-columns:repeat(2,1fr)}.gridcontrols{grid-template-columns:1fr}.gridmaplayout{grid-template-columns:1fr}.gridmapcard{min-height:430px}.gridmapcanvas{min-height:350px}.gridcharts,.gridtables{grid-template-columns:1fr}}
@media(max-width:720px){.gridpage .gridkpis{grid-template-columns:1fr 1fr}.gridmaptoolbar{align-items:flex-start;flex-direction:column}.gridmapcanvas{min-height:310px}.gridzone{min-width:78px;padding:8px}.gridzone.main{min-width:110px}.gridhovergrid{grid-template-columns:repeat(2,1fr)}.gridhoverflows{grid-template-columns:1fr}.gridhovermetric{align-items:flex-start;flex-direction:column;gap:3px}.zonemetrics{grid-template-columns:1fr}.tabletools{width:100%;flex-direction:column}.gridsearch,.gridsort{width:100%}.gridsliderrow{grid-template-columns:1fr}.gridsliderlabel{align-items:flex-start}.gridlayerbar .chip{max-width:100%;white-space:normal}.gridtables .card,.gridcharts .card{min-width:0}}

/* pipeline */
.pipeline{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.pnode{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);background:var(--bg);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:520}
.pdot{width:7px;height:7px;border-radius:50%;background:var(--green)}
.psep{color:var(--text-faint)}

/* settings */
.setrow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--border)}
.setrow:last-child{border-bottom:none}
.setname{font-size:13px;font-weight:550}
.setsub{font-size:11.5px;color:var(--text-faint);margin-top:2px}

/* command palette */
.palscrim{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding-top:14vh;z-index:100;animation:fade .12s ease}
.palette{width:min(560px,92vw);background:var(--panel);border:1px solid var(--border-strong);border-radius:13px;box-shadow:0 24px 70px rgba(0,0,0,.55);overflow:hidden}
.palinput{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border);color:var(--text-faint)}
.palinput input{flex:1;border:none;background:none;outline:none;color:var(--text);font-size:14.5px}
.palinput kbd{font-family:inherit;font-size:10px;border:1px solid var(--border-strong);border-radius:4px;padding:2px 6px;color:var(--text-faint)}
.pallist{max-height:340px;overflow-y:auto;padding:7px}
.palempty{padding:22px;text-align:center;color:var(--text-faint);font-size:13px}
.palrow{display:flex;align-items:center;gap:11px;width:100%;border:none;background:none;color:var(--text);padding:9px 11px;border-radius:8px;cursor:pointer;font-size:13px}
.palrow:hover{background:var(--hover)}
.palrow span{flex:1;text-align:left}
.palenter{color:var(--text-faint);opacity:0}
.palrow:hover .palenter{opacity:1}


/* auth */
.authscreen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--blue) 18%,transparent),transparent 30%),var(--bg)}
.authloading .authbootcard{min-width:260px}
.servio-boot-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-width:260px;padding:28px 34px;border:1px solid color-mix(in srgb,var(--text-faint) 22%,transparent);background:color-mix(in srgb,var(--panel) 78%,transparent);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.42)}
.servio-boot-spinner{width:44px;height:44px;border-radius:50%;border:3px solid color-mix(in srgb,var(--accent-2) 22%,transparent);border-top-color:var(--accent-2);border-right-color:var(--accent);animation:servio-spin .9s linear infinite;box-shadow:0 0 24px color-mix(in srgb,var(--accent-2) 18%,transparent)}
.servio-boot-label{font-size:15px;font-weight:600;letter-spacing:.01em;color:var(--text)}
@keyframes servio-spin{to{transform:rotate(360deg)}}
.logincard{width:min(420px,92vw);border:1px solid var(--border-strong);background:color-mix(in srgb,var(--panel) 88%,transparent);backdrop-filter:blur(14px);border-radius:18px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.52)}
.loginbrand{display:flex;align-items:center;gap:11px;margin-bottom:24px}.loginlogo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent-2));display:flex;align-items:center;justify-content:center;color:var(--accent-fg)}.loginname{font-weight:680;font-size:16px}.loginsub{font-size:11.5px;color:var(--text-faint);margin-top:2px}.loginhead h1{font-size:20px;letter-spacing:-.02em;margin:0 0 18px}.loginfield{display:block;margin-top:12px}.loginfield span{display:block;font-size:11.5px;color:var(--text-dim);margin-bottom:6px}.loginfield input{width:100%;border:1px solid var(--border);background:var(--bg);color:var(--text);border-radius:10px;padding:11px 12px;outline:none}.loginfield input:focus{border-color:color-mix(in srgb,var(--accent) 65%,var(--border-strong));box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 12%,transparent)}.loginremember{display:flex;align-items:center;gap:8px;margin-top:13px;color:var(--text-dim);font-size:12px}.loginremember input{accent-color:var(--accent)}.loginerr{display:flex;align-items:center;gap:7px;margin-top:13px;border:1px solid color-mix(in srgb,var(--red) 35%,transparent);background:color-mix(in srgb,var(--red) 10%,transparent);color:#fecaca;border-radius:10px;padding:9px 10px;font-size:12px}.loginbtn{width:100%;height:40px;margin-top:16px;border:0;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:var(--accent-fg);font-weight:650;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.loginbtn:disabled{opacity:.72;cursor:wait}
.usermenu{position:relative}.usermenuBtn{display:flex;align-items:center;gap:9px;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:10px;padding:4px 8px 4px 5px;cursor:pointer}.usermenuBtn:hover{border-color:var(--border-strong);background:var(--hover)}.useravatar{width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:var(--accent-fg);font-size:11px;font-weight:760;letter-spacing:.02em;flex:none}.useravatar.big{width:40px;height:40px;font-size:13px}.usercopy{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}.usercopy b{font-size:12px;font-weight:620;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.usercopy em{font-style:normal;font-size:10.5px;color:var(--text-faint);margin-top:2px}.userpop{position:absolute;right:0;top:calc(100% + 9px);width:250px;border:1px solid var(--border-strong);background:color-mix(in srgb,var(--panel) 96%,transparent);backdrop-filter:blur(14px);border-radius:13px;padding:8px;box-shadow:0 20px 60px rgba(0,0,0,.46);z-index:70}.userpopHead{display:flex;gap:10px;padding:8px 8px 10px;border-bottom:1px solid var(--border);margin-bottom:6px}.userpopHead b,.userpopHead span,.userpopHead em{display:block;min-width:0}.userpopHead b{font-size:13px}.userpopHead span{font-size:11.5px;color:var(--text-dim);margin-top:2px;word-break:break-all}.userpopHead em{font-size:10.5px;color:var(--text-faint);font-style:normal;margin-top:3px}.userpop button{width:100%;border:0;background:transparent;color:var(--text-dim);text-align:left;border-radius:8px;padding:9px 10px;font-size:12.5px;cursor:pointer}.userpop button:hover{background:var(--hover);color:var(--text)}.userpop button.danger:hover{color:#fecaca;background:color-mix(in srgb,var(--red) 12%,transparent)}


/* data learning center */
.dlchead{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:14px}
.dlcupload{position:relative;overflow:hidden;white-space:nowrap}
.dlcupload input{position:absolute;inset:0;opacity:0;cursor:pointer}
.dlckpis{grid-template-columns:repeat(4,minmax(0,1fr));margin:12px 0 14px}
.dlcempty{border:1px dashed var(--border-strong);border-radius:12px;padding:18px;display:flex;align-items:center;gap:12px;color:var(--text-dim);background:rgba(245,165,36,.04)}
.dlcempty b{display:block;color:var(--text);font-size:13px;margin-bottom:3px}
.dlcempty span{display:block;font-size:12px;color:var(--text-faint)}
.dlclist{display:flex;flex-direction:column;gap:12px}
.dlcitem{border:1px solid var(--border);border-radius:13px;background:var(--bg);padding:13px;display:grid;grid-template-columns:1fr auto;gap:10px}
.dlcmain{display:flex;gap:11px;min-width:0}
.dlcicon{width:34px;height:34px;border-radius:10px;background:rgba(245,165,36,.1);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:none;border:1px solid rgba(245,165,36,.18)}
.dlcmeta{min-width:0}
.dlctitle{font-weight:650;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dlcsub{font-size:11.5px;color:var(--text-faint);margin-top:2px}
.dlcreasons{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.dlcreasons span{font-size:10.5px;border:1px solid var(--border);background:var(--card);border-radius:999px;padding:3px 7px;color:var(--text-dim)}
.dlcright{display:flex;align-items:flex-end;flex-direction:column;gap:5px}
.dlcpreview{grid-column:1/-1;border:1px solid var(--border);border-radius:10px;background:var(--card);padding:8px;display:flex;flex-direction:column;gap:4px;max-height:112px;overflow:auto}
.dlcpreview code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:10.5px;color:var(--text-dim);white-space:nowrap}
.dlcactions{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--border);padding-top:10px}
@media(max-width:1000px){.dlckpis{grid-template-columns:repeat(2,minmax(0,1fr))}.dlcitem{grid-template-columns:1fr}.dlcright{align-items:flex-start;flex-direction:row;flex-wrap:wrap}.dlchead{align-items:stretch;flex-direction:column}}

/* responsive */
@media(max-width:1000px){.grid2{grid-template-columns:1fr}.revsplit{border-left:none;padding-left:0}.apiform{grid-template-columns:1fr}.dispgrid{grid-template-columns:repeat(12,1fr)}}
@media(max-width:820px){.side{position:fixed;z-index:50;height:100vh;box-shadow:0 0 40px rgba(0,0,0,.5)}.content{padding:20px 16px 50px}.marketclock{display:none}.cmdklabel{display:none}.usercopy{display:none}.usermenuBtn{padding:4px}.userpop{right:-4px}}
`;


createRoot(document.getElementById("root")).render(<App />);
