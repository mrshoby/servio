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
  Cpu, Wind, Sparkles, Download, Plus, Minus,
} from "lucide-react";

/* ============================ data ============================ */
const LEI = "Lei";
const fmt = (n, d = 0) => Number(n).toLocaleString("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtLei = (n) => fmt(n) + " " + LEI;
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const gauss = (x, mu, sig) => Math.exp(-((x - mu) ** 2) / (2 * sig * sig));

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
  dayAhead: "/api/servio/opcom/day-ahead", // OPCOM PZU (Piața pentru Ziua Următoare)
  intraday: "/api/servio/opcom/intraday",  // OPCOM Intraday
  imbalance: "/api/servio/transelectrica/imbalance",
  flows: "/api/servio/entsoe/flows",       // ENTSO-E Transparency
  load: "/api/servio/entsoe/load",
};
async function apiGet(base, path, token) {
  const r = await fetch(base.replace(/\/$/, "") + path, { headers: token ? { Authorization: "Bearer " + token } : {} });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
// Normalize whatever the API returns into our 96-interval shape.
function parseSeries(json) {
  let arr = Array.isArray(json) ? json : json && (json.data || json.intervals || json.prices);
  if (!Array.isArray(arr) || !arr.length) return null;
  const out = arr.slice(0, 96).map((row, k) => {
    const price = typeof row === "number" ? row : Number(row.price ?? row.price_lei_mwh ?? row.value ?? 0);
    const i = (typeof row === "object" && row.interval != null ? Number(row.interval) - 1 : k);
    const h = i / 4;
    return { i, hour: h, label: String(Math.floor(h)).padStart(2, "0") + ":" + String((i % 4) * 15).padStart(2, "0"), price: Math.round(price) };
  });
  return out.length === 96 ? out : null;
}
function useMarketData(base, token) {
  const demo = { today: TODAY, tomorrow: TOMORROW, todayH: TODAY_H, tomorrowH: TOMORROW_H, mode: "demo", error: null, loading: false };
  const [state, setState] = useState(demo);
  useEffect(() => {
    let alive = true;
    if (!base) { setState(demo); return; }
    setState((s) => ({ ...s, loading: true }));
    (async () => {
      try {
        const [t, tm] = await Promise.all([
          apiGet(base, ENDPOINTS.dayAhead + "?day=today", token),
          apiGet(base, ENDPOINTS.dayAhead + "?day=tomorrow", token),
        ]);
        const today = parseSeries(t) || TODAY, tomorrow = parseSeries(tm) || TOMORROW;
        if (!alive) return;
        setState({ today, tomorrow, todayH: hourly(today), tomorrowH: hourly(tomorrow), mode: "live", error: null, loading: false });
      } catch (e) {
        if (!alive) return;
        setState({ ...demo, mode: "demo", error: String(e.message || e) });
      }
    })();
    return () => { alive = false; };
  }, [base, token]);
  return state;
}

const SOURCES = [
  { id: "opcom-dam", name: "OPCOM · Day-Ahead", kind: "Market", status: "live", latency: 420, last: "acum 38s", rows: "96 / 96" },
  { id: "opcom-id", name: "OPCOM · Intraday", kind: "Market", status: "live", latency: 510, last: "acum 1m", rows: "84 / 96" },
  { id: "transelectrica", name: "Transelectrica · Echilibrare", kind: "Balancing", status: "live", latency: 690, last: "acum 12s", rows: "96 / 96" },
  { id: "entsoe", name: "ENTSO-E · Transparency", kind: "Grid", status: "live", latency: 880, last: "acum 2m", rows: "Flows, Load" },
  { id: "anre", name: "ANRE · Raportare", kind: "Regulatory", status: "idle", latency: 0, last: "azi 06:00", rows: "Decontare D-1" },
  { id: "windows-relay", name: "Windows Relay · Local", kind: "Ingest", status: "degraded", latency: 2100, last: "acum 9m", rows: "retry 2/5" },
];

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
  { id: "map", label: "Hartă rețea", Icon: Globe2 },
  { sec: "Date" },
  { id: "sources", label: "Surse & relay", Icon: Database },
  { sec: "Sistem" },
  { id: "settings", label: "Setări", Icon: Settings },
];
const TITLES = { overview: "Overview", dayahead: "Day-Ahead · PZU", forecast: "Prognoză", battery: "Baterie · BESS", map: "Hartă rețea", sources: "Surse & relay", settings: "Setări" };

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

        <Card title="Necesită atenție" right={<Badge tone="y">3</Badge>}>
          <div className="alerts">
            <button className="alert" onClick={() => go("sources")}><span className="aicn r"><AlertTriangle size={14} /></span><div><div className="atitle">Windows Relay degradat</div><div className="asub">retry 2/5 · latență 2.1s · acum 9m</div></div><ChevronRight size={15} className="achev" /></button>
            <button className="alert" onClick={() => go("dayahead")}><span className="aicn a"><TrendingUp size={14} /></span><div><div className="atitle">Vârf de preț la 19:30</div><div className="asub">1.080 Lei/MWh · descărcare recomandată</div></div><ChevronRight size={15} className="achev" /></button>
            <button className="alert" onClick={() => go("forecast")}><span className="aicn b"><Wind size={14} /></span><div><div className="atitle">Prognoză PV revizuită</div><div className="asub">−8% mâine · nebulozitate ridicată</div></div><ChevronRight size={15} className="achev" /></button>
          </div>
        </Card>
      </div>

      <Card title="Surse de date" right={<button className="linklike" onClick={() => go("sources")}>Toate sursele →</button>} pad={false}>
        <table className="tbl">
          <thead><tr><th>Sursă</th><th>Tip</th><th>Stare</th><th className="num">Latență</th><th>Ultima sincronizare</th></tr></thead>
          <tbody>{SOURCES.slice(0, 4).map((s) => <tr key={s.id}><td className="strong">{s.name}</td><td className="dim">{s.kind}</td><td><span className="statuscell"><Dot status={s.status} /> {s.status === "live" ? "Live" : s.status === "degraded" ? "Degradat" : "Idle"}</span></td><td className="num">{s.latency ? s.latency + " ms" : "—"}</td><td className="dim">{s.last}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================ Day-Ahead (PZU) ============================ */
function DayAhead({ md }) {
  const [day, setDay] = useState("today");
  const curve = day === "today" ? md.today : md.tomorrow;
  const hrs = day === "today" ? md.todayH : md.tomorrowH;
  const avg = Math.round(curve.reduce((a, b) => a + b.price, 0) / 96);
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
        <div className="spacer" />
        <button className="btn ghost"><Download size={14} /> Export CSV</button>
        <button className="btn"><Plus size={14} /> Ofertă D+1</button>
      </div>
      <div className="kpirow">
        <Kpi label="Medie" value={fmtLei(avg)} sub={day === "today" ? "PZU astăzi" : "PZU mâine"} Icon={Activity} />
        <Kpi label="Vârf" value={fmtLei(peak)} sub={peakIv.label} Icon={TrendingUp} tone="red" />
        <Kpi label="Minim" value={fmtLei(trough)} sub={lowIv.label} Icon={TrendingDown} tone="green" />
        <Kpi label="Spread" value={fmtLei(spread)} sub="oportunitate arbitraj" Icon={Layers} tone="accent" />
      </div>
      <Card title={"Preț la 15 minute · " + (day === "today" ? "astăzi" : "mâine")} pad={false}>
        <div className="hero">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={curve} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
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
          <tbody>{hrs.map((h) => { const d = Math.round(((h.price - avg) / avg) * 100); const sig = h.price <= trough + spread * 0.25 ? "charge" : h.price >= peak - spread * 0.25 ? "discharge" : "hold"; return (
            <tr key={h.hour}><td className="strong">{h.label}:00</td><td className="num">{fmt(h.price)}</td><td><span className={"vsavg " + (d >= 0 ? "up" : "dn")}>{d >= 0 ? "+" : ""}{d}%</span></td><td>{sig === "charge" ? <Badge tone="g">Încarcă</Badge> : sig === "discharge" ? <Badge tone="r">Descarcă</Badge> : <Badge tone="n">Așteaptă</Badge>}</td></tr>
          ); })}</tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================ Battery (BESS) ============================ */
/* ============================ Battery Revenue Simulator (full) ============================ */
const SHAPE24 = (() => { const s = Array.from({ length: 24 }, (_, h) => 430 + 520 * gauss(h, 8, 2) - 150 * gauss(h, 13, 2.6) + 660 * gauss(h, 19.5, 2.1) - 120 * gauss(h, 3, 3.2)); const m = s.reduce((a, b) => a + b, 0) / 24; const c = s.map((x) => x - m); const sc = Math.max(...c.map((x) => Math.abs(x))); return c.map((x) => x / sc); })();
const DISP_PRESETS = {
  conservative: { label: "Conservative", charge: [2, 3, 4], discharge: [19, 20] },
  balanced: { label: "Balanced", charge: [2, 3, 4, 5], discharge: [18, 19, 20, 21] },
  aggressive: { label: "Aggressive", charge: [0, 1, 2, 3, 4, 13, 14], discharge: [7, 8, 18, 19, 20, 21] },
  peak: { label: "Peak shaving", charge: [12, 13, 14], discharge: [18, 19, 20] },
};
function presetGrid(name) { const p = DISP_PRESETS[name] || DISP_PRESETS.balanced; return Array.from({ length: 24 }, (_, h) => p.charge.includes(h) ? "charge" : p.discharge.includes(h) ? "discharge" : "idle"); }
function download(name, text, type = "text/plain") { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); }
const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);

function runRevenue(sp, grid, fromD, toD) {
  const eur = sp.eurRon || 4.97, eff = (sp.efficiencyPct || 88) / 100;
  const usable = sp.capacityMWh * Math.max(0, (sp.maxSocPct - sp.minSocPct)) / 100;
  const r = rng(99);
  const out = []; const cur = new Date(fromD); const end = new Date(toD); let guard = 0;
  while (cur <= end && guard < 1200) {
    const doy = Math.floor((cur - new Date(cur.getFullYear(), 0, 0)) / 86400000);
    const winter = 0.5 + 0.5 * Math.cos((doy - 15) / 365 * 2 * Math.PI);
    const avgLei = 560 + 180 * winter;
    const spreadLei = (430 + 360 * winter) * (0.85 + 0.3 * r());
    const price = SHAPE24.map((n) => avgLei + n * spreadLei * 0.5);
    const cH = []; const dH = [];
    for (let h = 0; h < 24; h++) { if (grid[h] === "charge" && price[h] <= sp.maxChargePriceRonMwh) cH.push(h); if (grid[h] === "discharge" && price[h] >= sp.minDischargePriceRonMwh) dH.push(h); }
    const chargeE = Math.min(usable, sp.maxChargePowerMW * cH.length);
    const dischargeE = Math.min(chargeE * eff, sp.maxDischargePowerMW * dH.length, usable);
    const avgC = cH.length ? cH.reduce((a, h) => a + price[h], 0) / cH.length / eur : 0;
    const avgD = dH.length ? dH.reduce((a, h) => a + price[h], 0) / dH.length / eur : 0;
    const degr = (sp.degradationCostRonMwh / eur) * dischargeE;
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
  const investment = sp.capacityMWh * 1000 * sp.batteryCostEurKwh;
  const annual = avgDaily * 365 - (sp.fixedOmEurYear || 0);
  const roi = investment ? (annual / investment) * 100 : 0;
  const payback = annual > 0 ? investment / annual : null;
  return { months, totalRevenue, avgMonthly: totalRevenue / (months.length || 1), avgDaily, totalCycles, avgCyclesPerDay: totalCycles / days, days, totalMonths: months.length, investment, annual, roi, payback };
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
  const [sp, setSp] = useState({
    capacityMWh: 2, maxChargePowerMW: 1, maxDischargePowerMW: 1, efficiencyPct: 88, maxCyclesDay: 2, minSocPct: 10, maxSocPct: 95,
    batteryCostEurKwh: 200, eurRon: 4.97, lifecycleCycles: 6000, fixedOmEurYear: 4000, discountPct: 8, projectYears: 10,
    degradationCostRonMwh: 120, maxChargePriceRonMwh: 480, minDischargePriceRonMwh: 600, maxIdChargePriceRonMwh: 400,
  });
  const set = (k) => (v) => setSp((s) => ({ ...s, [k]: v }));
  const [grid, setGrid] = useState(() => presetGrid("balanced"));
  const [brush, setBrush] = useState("charge");
  const [activePreset, setActivePreset] = useState("balanced");
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState("2023-10-01");
  const [to, setTo] = useState("2026-03-31");
  const fromEff = custom ? from : "2023-10-01";
  const toEff = custom ? to : "2026-03-31";

  const res = useMemo(() => runRevenue(sp, grid, fromEff, toEff), [sp, grid, fromEff, toEff]);
  const scenarios = useMemo(() => Object.keys(DISP_PRESETS).map((k) => { const rr = runRevenue(sp, presetGrid(k), fromEff, toEff); return { key: k, label: DISP_PRESETS[k].label, investment: rr.investment, annual: rr.annual, payback: rr.payback }; }), [sp, fromEff, toEff]);

  const applyPreset = (k) => { setGrid(presetGrid(k)); setActivePreset(k); };
  const paint = (h) => { setGrid((g) => { const n = [...g]; n[h] = brush === "erase" ? "idle" : brush; return n; }); setActivePreset("custom"); };
  const counts = grid.reduce((a, m) => { a[m]++; return a; }, { charge: 0, discharge: 0, idle: 0 });

  const exportCsv = () => download("servio-revenue.csv", "month,revenue_eur,cumulative_eur,cycles,charge,discharge,id_charge\n" + res.months.map((m) => `${m.month},${Math.round(m.revenueEur)},${Math.round(m.cumulativeEur)},${m.cycles.toFixed(2)},${m.charge},${m.discharge},${m.idCharge}`).join("\n"), "text/csv");
  const exportJson = () => download("servio-revenue.json", JSON.stringify({ specs: sp, period: { from: fromEff, to: toEff }, schedule: grid, result: res }, null, 2), "application/json");

  return (
    <div className="stack">
      {/* KPIs */}
      <div className="kpirow">
        <Kpi label="Total Revenue" value={fmtEur(res.totalRevenue)} sub={res.totalMonths + " luni · " + res.days + " zile"} Icon={DollarSign} tone="green" />
        <Kpi label="Avg Monthly" value={fmtEur(res.avgMonthly)} sub="official engine" Icon={Activity} />
        <Kpi label="Avg Daily" value={fmtEur(res.avgDaily)} sub="official engine" Icon={Sun} />
        <Kpi label="Total Cycles" value={fmt(res.totalCycles, 0)} sub={res.avgCyclesPerDay.toFixed(2) + " / zi"} Icon={RefreshCw} />
        <Kpi label="Annual ROI" value={res.roi.toFixed(1) + "%"} sub={fmtEur(res.annual) + " / an"} Icon={TrendingUp} tone="accent" />
        <Kpi label="Payback" value={res.payback ? res.payback.toFixed(1) + " ani" : "—"} sub="simplu" Icon={Clock} />
      </div>

      <div className="grid2">
        {/* Battery Specifications */}
        <Card title="Battery Specifications">
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

      <div className="grid2">
        {/* Price Thresholds */}
        <Card title="Price Thresholds">
          <div className="ingrid">
            <In label="Degradation cost" value={sp.degradationCostRonMwh} set={set("degradationCostRonMwh")} unit="lei/MWh" step={10} />
            <In label="Max charge price" value={sp.maxChargePriceRonMwh} set={set("maxChargePriceRonMwh")} unit="lei/MWh" step={10} />
            <In label="Min discharge price" value={sp.minDischargePriceRonMwh} set={set("minDischargePriceRonMwh")} unit="lei/MWh" step={10} />
            <In label="Max ID charge price" value={sp.maxIdChargePriceRonMwh} set={set("maxIdChargePriceRonMwh")} unit="lei/MWh" step={10} />
          </div>
        </Card>

        {/* Custom Simulation Period */}
        <Card title="Custom Simulation Period">
          <div className="setrow" style={{ paddingTop: 0 }}>
            <div><div className="setname">Custom simulation period</div><div className="setsub">Altfel se folosește întregul set de date 2023–2026.</div></div>
            <button className={"switch" + (custom ? " on" : "")} onClick={() => setCustom((c) => !c)}><span className="knob" /></button>
          </div>
          <div className="ingrid" style={{ opacity: custom ? 1 : 0.5, pointerEvents: custom ? "auto" : "none" }}>
            <In label="Start date" value={from} set={setFrom} unit="" type="date" />
            <In label="End date" value={to} set={setTo} unit="" type="date" />
          </div>
          <div className="apiactions">
            <button className="btn ghost" onClick={() => { setCustom(false); }}><Database size={14} /> Use full dataset</button>
            <span className="dim small">{daysBetween(fromEff, toEff)} zile · {res.totalMonths} luni</span>
          </div>
        </Card>
      </div>

      {/* Dispatch Strategy */}
      <Card title="Dispatch Strategy" right={<div className="brushbar">
        <span className="dim small">Brush</span>
        <button className={"brushbtn charge" + (brush === "charge" ? " on" : "")} onClick={() => setBrush("charge")}>Charge</button>
        <button className={"brushbtn discharge" + (brush === "discharge" ? " on" : "")} onClick={() => setBrush("discharge")}>Discharge</button>
        <button className={"brushbtn erase" + (brush === "erase" ? " on" : "")} onClick={() => setBrush("erase")}>Erase</button>
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
          <button className="chip" onClick={() => { setGrid(Array(24).fill("idle")); setActivePreset("custom"); }}>Clear</button>
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
            <thead><tr><th>Scenario</th><th className="num">Investment</th><th className="num">Annual value</th><th className="num">Payback</th></tr></thead>
            <tbody>{scenarios.map((s) => <tr key={s.key} className={activePreset === s.key ? "rowsel" : ""}>
              <td className="strong">{s.label}</td><td className="num dim">{fmtEur(s.investment)}</td><td className="num g">{fmtEur(s.annual)}</td><td className="num">{s.payback ? s.payback.toFixed(1) + " ani" : "—"}</td>
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

/* ============================ Map ============================ */
function MapView() {
  const ci = (c) => c < 220 ? "g" : c < 320 ? "y" : "r";
  return (
    <div className="stack">
      <div className="kpirow">
        <Kpi label="Intensitate carbon RO" value="212 g/kWh" sub="sub media UE" Icon={Wind} tone="green" />
        <Kpi label="Import net" value="+0 MW" sub="echilibrat acum" Icon={Plug} />
        <Kpi label="Vecini conectați" value="6 zone" sub="HU · BG · RS · MD · UA" Icon={Globe2} />
        <Kpi label="Preț regional med." value="619 Lei" sub="zone interconectate" Icon={Activity} />
      </div>
      <Card title="Zone interconectate" right={<span className="dim small">Sursă: ENTSO-E Transparency</span>} pad={false}>
        <table className="tbl">
          <thead><tr><th>Zonă</th><th>Intensitate carbon</th><th>Flux cu RO</th><th className="num">Preț (Lei/MWh)</th></tr></thead>
          <tbody>{NEIGHBORS.map((n) => <tr key={n.z}>
            <td className="strong"><span className="zflag">{n.z}</span> {n.name}</td>
            <td><span className="statuscell"><Dot status={ci(n.carbon) === "g" ? "live" : ci(n.carbon) === "y" ? "degraded" : "error"} /> {n.carbon} g/kWh</span></td>
            <td>{n.flow === 0 ? <span className="dim">—</span> : n.flow > 0 ? <span className="vsavg up"><ArrowUpRight size={12} /> import {fmt(n.flow)} MW</span> : <span className="vsavg dn"><ArrowDownRight size={12} /> export {fmt(-n.flow)} MW</span>}</td>
            <td className="num">{n.price ? fmt(n.price) : "—"}</td>
          </tr>)}</tbody>
        </table>
      </Card>
      <Card title="Flux de putere — RO și vecini">
        <div className="flowmap">
          <div className="flownode center"><Zap size={18} /><span>RO</span><b>212 g</b></div>
          {NEIGHBORS.slice(1).map((n, i) => (
            <div key={n.z} className={"flownode n" + i}><span>{n.z}</span><small>{n.carbon}g</small><i className={"flowarrow " + (n.flow > 0 ? "in" : n.flow < 0 ? "out" : "")} /></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

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
            {[["OPCOM Day-Ahead (PZU)", ENDPOINTS.dayAhead], ["OPCOM Intraday", ENDPOINTS.intraday], ["Transelectrica · Echilibrare", ENDPOINTS.imbalance], ["ENTSO-E · Fluxuri", ENDPOINTS.flows], ["ENTSO-E · Consum", ENDPOINTS.load]].map(([n, p]) => (
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

/* ============================ Settings ============================ */
function SettingsView({ theme, setTheme, apiBase, setApiBase, apiToken, setApiToken, md }) {
  const [base, setBase] = useState(apiBase);
  const [token, setToken] = useState(apiToken);
  return (
    <div className="stack">
      <Card title="Surse de date · OPCOM & ENTSO-E" right={<Badge tone={md.mode === "live" ? "g" : "n"}>{md.mode === "live" ? "Live" : "Demo"}</Badge>}>
        <p className="setsub" style={{ marginBottom: 14 }}>Conectează aplicația la backend-ul Servio (Cloudflare Worker) care interoghează OPCOM și ENTSO-E server-side cu cheile tale. Fără URL, aplicația rulează pe date demonstrative.</p>
        <div className="apiform">
          <div className="field"><div className="fieldhead"><label>URL backend Servio</label></div><input className="nsel" placeholder="https://api.servio.ro" value={base} onChange={(e) => setBase(e.target.value)} /></div>
          <div className="field"><div className="fieldhead"><label>Token API (opțional)</label></div><input className="nsel" type="password" placeholder="Bearer token" value={token} onChange={(e) => setToken(e.target.value)} /></div>
        </div>
        <div className="apiactions">
          <button className="btn" onClick={() => { setApiBase(base.trim()); setApiToken(token.trim()); }}><Plug size={14} /> Conectează</button>
          <button className="btn ghost" onClick={() => { setBase(""); setToken(""); setApiBase(""); setApiToken(""); }}>Deconectează (demo)</button>
          {md.loading && <span className="dim small"><RefreshCw size={12} className="spin" /> se încarcă…</span>}
          {md.mode === "live" && <span className="g small"><Check size={12} /> Conectat la OPCOM / ENTSO-E</span>}
          {md.error && apiBase && <span className="r small"><AlertTriangle size={12} /> {md.error}</span>}
        </div>
        <div className="hint" style={{ marginTop: 14 }}><Cpu size={13} /> Backend-ul mapează: <b>GET /api/servio/opcom/day-ahead</b>, <b>/opcom/intraday</b>, <b>/transelectrica/imbalance</b>, <b>/entsoe/flows</b>. Răspuns așteptat: listă de 96 intervale <code>{"{ interval, price }"}</code>.</div>
      </Card>
      <Card title="Aspect">
        <div className="setrow"><div><div className="setname">Temă</div><div className="setsub">Întunecat este recomandat pentru sălile de control.</div></div>
          <div className="seg"><button className={"segbtn" + (theme === "dark" ? " on" : "")} onClick={() => setTheme("dark")}><Moon size={13} /> Întunecat</button><button className={"segbtn" + (theme === "light" ? " on" : "")} onClick={() => setTheme("light")}><Sun size={13} /> Luminos</button></div>
        </div>
        <div className="setrow"><div><div className="setname">Monedă</div><div className="setsub">Afișarea prețurilor pe piață.</div></div><div className="seg"><button className="segbtn on">Lei / MWh</button><button className="segbtn">EUR / MWh</button></div></div>
        <div className="setrow"><div><div className="setname">Fus orar piață</div><div className="setsub">Sincronizat cu gate-closure OPCOM.</div></div><Badge tone="b">Europe/Bucharest</Badge></div>
      </Card>
      <Card title="Conformitate">
        <div className="setrow"><div><div className="setname">Licență agregare ANRE</div><div className="setsub">Nr. 2699 · operare servicii de agregare</div></div><Badge tone="g"><Check size={11} /> Activă</Badge></div>
        <div className="setrow"><div><div className="setname">Raportare D-1</div><div className="setsub">Decontare zilnică către piață</div></div><Badge tone="n">Programată 06:00</Badge></div>
      </Card>
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

/* ============================ App shell ============================ */
export default function App() {
  const [view, setView] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [apiToken, setApiToken] = useState("");
  const md = useMarketData(apiBase, apiToken);
  const market = useMarketNow();
  const go = (v) => setView(v);

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

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
          <div className="userrow"><div className="uavatar">AE</div>{!collapsed && <div className="umeta"><div className="uname">Andrei E.</div><div className="urole">Manager energetic</div></div>}</div>
          <button className="collapsebtn" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Extinde" : "Restrânge"}>{collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div className="crumbs"><span className="crumb dim">Servio</span><ChevronRight size={13} className="crsep" /><span className="crumb">{TITLES[view]}</span></div>
          <div className="topspace" />
          <div className={"datamode " + md.mode} title={md.mode === "live" ? "Date live din OPCOM / ENTSO-E" : (apiBase ? "API indisponibil — date demo" : "Date demonstrative")}><span className={"mdot " + md.mode} />{md.mode === "live" ? "Live" : "Demo"}</div>
          <div className="marketclock"><Dot status="live" /><span className="mclabel">Piață</span><span className="mctime">{market.clock}</span><span className="mcsep">·</span><span className="mcprice">{fmtLei(md.today[market.idx].price)}</span></div>
          <button className="cmdk" onClick={() => setPaletteOpen(true)}><Search size={13} /> <span className="cmdklabel">Caută</span> <kbd className="kbd2"><Command size={10} />K</kbd></button>
          <button className="ticon" title="Notificări"><Bell size={16} /><span className="tdot" /></button>
          <button className="ticon" title="Temă" onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
          <div className="tavatar">AE</div>
        </header>

        <main className="content">
          <div className="pagehead">
            <h1 className="pagetitle">{TITLES[view]}</h1>
            <p className="pagesub">{
              view === "overview" ? "Imagine de ansamblu asupra pieței, bateriei și surselor — în timp real." :
              view === "dayahead" ? "Prețuri Day-Ahead (PZU) la 15 minute, cu semnale de încărcare și descărcare." :
              view === "forecast" ? "Prognoză AI pentru producție, consum și preț, cu intervale P10 / P50 / P90." :
              view === "battery" ? "Simulator complet de venit BESS: arbitraj pe perioadă, ROI, payback și scenarii P10 / P50 / P90." :
              view === "map" ? "Fluxuri și intensitate de carbon pentru România și zonele interconectate." :
              view === "sources" ? "Sănătatea surselor oficiale și a pipeline-ului hibrid de ingestie." :
              "Preferințe de aspect, monedă și conformitate reglementară."
            }</p>
          </div>

          {view === "overview" && <Overview go={go} md={md} />}
          {view === "dayahead" && <DayAhead md={md} />}
          {view === "forecast" && <Forecast md={md} />}
          {view === "battery" && <Battery md={md} />}
          {view === "map" && <MapView />}
          {view === "sources" && <Sources md={md} apiBase={apiBase} apiToken={apiToken} />}
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

/* map */
.zflag{display:inline-flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;border:1px solid var(--border-strong);border-radius:4px;padding:1px 4px;margin-right:6px;color:var(--text-dim)}
.flowmap{position:relative;height:240px;display:flex;align-items:center;justify-content:center}
.flownode{position:absolute;border:1px solid var(--border);background:var(--bg);border-radius:10px;padding:9px 12px;display:flex;flex-direction:column;align-items:center;font-size:11px;color:var(--text-dim);min-width:62px}
.flownode b{color:var(--text);font-size:12px}
.flownode.center{position:static;border-color:var(--accent);color:var(--accent);gap:2px;padding:14px 18px}
.flownode.center b{color:var(--accent)}
.flownode.center span{font-weight:700;font-size:13px}
.flownode.n0{top:6px;left:18%}.flownode.n1{top:6px;right:18%}.flownode.n2{bottom:6px;left:14%}
.flownode.n3{bottom:6px;right:14%}.flownode.n4{top:42%;right:4%}
.flowarrow{width:6px;height:6px;border-radius:50%;margin-top:4px;background:var(--text-faint)}
.flowarrow.in{background:var(--green)}.flowarrow.out{background:var(--accent)}

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

/* responsive */
@media(max-width:1000px){.grid2{grid-template-columns:1fr}.revsplit{border-left:none;padding-left:0}.apiform{grid-template-columns:1fr}}
@media(max-width:820px){.side{position:fixed;z-index:50;height:100vh;box-shadow:0 0 40px rgba(0,0,0,.5)}.content{padding:20px 16px 50px}.marketclock{display:none}.cmdklabel{display:none}}
`;
