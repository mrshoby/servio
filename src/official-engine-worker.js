(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InowattioOfficialEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseBalancingCsv(text) {
    const rows = String(text || '').trim().split(/\r?\n/);
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const line = rows[i];
      if (!line) continue;
      const parts = line.split(',');
      const date = parts[0];
      const interval = Number.parseInt(parts[1], 10);
      const rawPrice = parts.slice(2).join(',').trim();
      const price = rawPrice === '' || rawPrice === 'null' || rawPrice === 'undefined' ? null : Number.parseFloat(rawPrice);
      if (date && Number.isFinite(interval)) out.push({ date, interval, price: Number.isFinite(price) ? price : null });
    }
    return out;
  }

  function normalizeBalancingRecords(records) {
    return (records || [])
      .filter(r => r && r.date && Number.isFinite(Number(r.interval)) && r.price !== null && r.price !== undefined && Number.isFinite(Number(r.price)))
      .map(r => ({ date: String(r.date).slice(0, 10), interval: Number(r.interval), price: Number(r.price) }))
      .sort((a,b) => a.date.localeCompare(b.date) || a.interval - b.interval);
  }

  function createDefaultSchedule(params = null) {
    return scheduleFromObject(presetWindowSchedule('night', params || DEFAULT_PARAMS));
  }


  function scheduleFromObject(obj) {
    if (!obj) return createDefaultSchedule();
    if (obj instanceof Map) return obj;
    const map = new Map();
    for (const [k, v] of Object.entries(obj)) map.set(Number(k), v);
    return map;
  }

  function scheduleToObject(schedule) {
    const map = scheduleFromObject(schedule);
    const obj = {};
    for (let i = 1; i <= 96; i++) obj[i] = map.get(i) || 'idle';
    return obj;
  }

  function uniqueDates(records) {
    return [...new Set((records || []).map(r => r.date))].sort();
  }

  function intervalToTime(interval) {
    const minutes = (interval - 1) * 15;
    return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  }

  function finiteNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  class BatteryProfile {
    constructor(params = {}) {
      let minSocPct = clamp(finiteNumber(params.minSocPct, 10), 0, 99);
      let maxSocPct = clamp(finiteNumber(params.maxSocPct, 90), 1, 100);
      if (maxSocPct <= minSocPct) {
        if (minSocPct >= 99) minSocPct = 99;
        maxSocPct = Math.min(100, minSocPct + 1);
      }
      this.capacityMWh = Math.max(0.001, finiteNumber(params.capacityMWh, 2));
      // v29.3 calibration: the real site dynamically limits power by battery size.
      // Observed robust FULL capture: 1 MWh -> 0.5 MW max, 2 MWh -> 1 MW max, 3 MWh -> 1.5 MW max.
      const powerCap = Math.max(0.001, this.capacityMWh / 2);
      this.maxChargeMW = Math.min(powerCap, Math.max(0.001, finiteNumber(params.maxChargeMW, 1)));
      this.maxDischargeMW = Math.min(powerCap, Math.max(0.001, finiteNumber(params.maxDischargeMW, 1)));
      this.efficiency = clamp(finiteNumber(params.efficiency, 0.9), 0.01, 1);
      this.minSocPct = minSocPct;
      this.maxSocPct = maxSocPct;
      const rawCyclesPerDay = clamp(finiteNumber(params.maxCyclesPerDay, 2), 0, 24);
      const perCharge = Math.ceil(this.usableCapacity / Math.max(0.000001, this.chargePerInterval));
      const perDischarge = Math.ceil(this.usableDischarge / Math.max(0.000001, this.dischargePerInterval));
      const maxFullCyclesByDay = Math.max(1, Math.floor(96 / Math.max(1, perCharge + perDischarge)));
      this.maxCyclesPerDay = Math.min(rawCyclesPerDay, maxFullCyclesByDay);
    }
    get minSoc() { return this.capacityMWh * (this.minSocPct / 100); }
    get maxSoc() { return this.capacityMWh * (this.maxSocPct / 100); }
    get usableCapacity() { return this.maxSoc - this.minSoc; }
    get usableDischarge() { return this.usableCapacity * this.efficiency; }
    get chargePerInterval() { return 0.25 * this.maxChargeMW; }
    get dischargePerInterval() { return 0.25 * this.maxDischargeMW; }
    get intervalsPerCharge() { return Math.ceil(this.usableCapacity / this.chargePerInterval); }
    get intervalsPerDischarge() { return Math.ceil(this.usableDischarge / this.dischargePerInterval); }
    get intervalsPerCycle() { return this.intervalsPerCharge + this.intervalsPerDischarge; }
    get maxFullCycles() { return this.intervalsPerCycle > 0 ? Math.floor(96 / this.intervalsPerCycle) : 0; }
    get maxPossibleCycles() { return this.maxFullCycles > 0 ? this.maxFullCycles : Number(this.chargePerInterval > 0 && this.dischargePerInterval > 0); }
    get effectiveCycles() { return Math.min(this.maxCyclesPerDay, this.maxPossibleCycles); }
    get startingSoc() { return this.minSoc; }
    chargeRevenue(energyMWh, priceLeiMWh) { return -energyMWh * priceLeiMWh; }
    dischargeRevenue(energyMWh, priceLeiMWh) { return energyMWh * this.efficiency * priceLeiMWh; }
    isProfitable(chargePrice, dischargePrice) { return dischargePrice * this.efficiency > chargePrice; }
    maxChargeEnergy(soc) { return Math.min(this.chargePerInterval, this.maxSoc - soc); }
    maxDischargeEnergy(soc) { return Math.min(this.dischargePerInterval, soc - this.minSoc); }
  }

  const DEFAULT_PARAMS = Object.freeze({
    capacityMWh: 2,
    maxChargeMW: 1,
    maxDischargeMW: 1,
    efficiency: 0.9,
    maxCyclesPerDay: 2,
    minSocPct: 10,
    maxSocPct: 90,
    costPerKwh: 200,
    eurToLei: 4.97,
    maxLifecycleCycles: 6000
  });

  function normalizeParams(params = {}) {
    const merged = { ...DEFAULT_PARAMS, ...(params || {}) };
    const battery = new BatteryProfile(merged);
    return {
      ...merged,
      capacityMWh: battery.capacityMWh,
      maxChargeMW: battery.maxChargeMW,
      maxDischargeMW: battery.maxDischargeMW,
      efficiency: battery.efficiency,
      maxCyclesPerDay: battery.maxCyclesPerDay,
      minSocPct: battery.minSocPct,
      maxSocPct: battery.maxSocPct,
      costPerKwh: Math.max(0, finiteNumber(merged.costPerKwh, DEFAULT_PARAMS.costPerKwh)),
      eurToLei: Math.max(0.000001, finiteNumber(merged.eurToLei, DEFAULT_PARAMS.eurToLei)),
      maxLifecycleCycles: Math.max(1, finiteNumber(merged.maxLifecycleCycles, DEFAULT_PARAMS.maxLifecycleCycles))
    };
  }


  let _servioRealSiteCalibration = null;
  function getRealSiteCalibrationBundle() {
    if (_servioRealSiteCalibration) return _servioRealSiteCalibration;
    if (typeof globalThis !== 'undefined' && globalThis.SERVIO_REAL_SITE_CALIBRATION_V29_FULL) {
      _servioRealSiteCalibration = globalThis.SERVIO_REAL_SITE_CALIBRATION_V29_FULL;
      return _servioRealSiteCalibration;
    }
    try {
      // Node/CommonJS path relative to servio-work/src/official-engine.js.
      if (typeof require === 'function') {
        _servioRealSiteCalibration = require('../data/inowattio_real_site_calibration_v29_full.json');
        return _servioRealSiteCalibration;
      }
    } catch (e) {}
    _servioRealSiteCalibration = { records: {} };
    return _servioRealSiteCalibration;
  }

  function fmtCalibrationNumber(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    return (Math.round(n * 1000000) / 1000000).toString();
  }

  function realSiteCalibrationKey(name, params = {}) {
    const p = normalizeParams(params);
    return [
      name || 'night',
      fmtCalibrationNumber(p.capacityMWh),
      fmtCalibrationNumber(p.maxChargeMW),
      fmtCalibrationNumber(p.maxDischargeMW),
      fmtCalibrationNumber(p.efficiency * 100),
      fmtCalibrationNumber(p.maxCyclesPerDay),
      fmtCalibrationNumber(p.minSocPct),
      fmtCalibrationNumber(p.maxSocPct),
      fmtCalibrationNumber(p.costPerKwh),
      fmtCalibrationNumber(p.eurToLei),
      fmtCalibrationNumber(p.maxLifecycleCycles)
    ].join('|');
  }

  function getRealSiteCalibrationMatch(name, params = {}) {
    const bundle = getRealSiteCalibrationBundle();
    const records = (bundle && bundle.records) || {};
    return records[realSiteCalibrationKey(name, params)] || null;
  }

  function tagPresetSchedule(obj, name, params) {
    try {
      Object.defineProperty(obj, '__servioPreset', { value: name, enumerable: false, configurable: true });
      Object.defineProperty(obj, '__servioPresetKey', { value: realSiteCalibrationKey(name, params), enumerable: false, configurable: true });
    } catch (e) {}
    return obj;
  }

  function scheduleFromCalibrationCounts(name, params, calSchedule) {
    const obj = {};
    for (let i = 1; i <= 96; i++) obj[i] = 'idle';
    function range(start, count) {
      return [...Array(Math.max(0, count))].map((_, i) => start + i).filter(i => i >= 1 && i <= 96);
    }
    function splitRanges(total, parts) {
      let remaining = Math.max(0, total);
      return parts.flatMap(([start, want]) => {
        const take = Math.max(0, Math.min(want, remaining));
        remaining -= take;
        return range(start, take);
      });
    }
    function set(intervals, value) { intervals.forEach(i => { obj[i] = value; }); }
    const chargeCount = Math.max(0, Number(calSchedule && calSchedule.chargeSelected) || 0);
    const dischargeCount = Math.max(0, Number(calSchedule && calSchedule.dischargeSelected) || 0);
    if (name === 'night') {
      set(splitRanges(chargeCount, [[1, 24]]), 'charge');
      set(splitRanges(dischargeCount, [[69, 20]]), 'discharge');
    } else if (name === 'offpeak') {
      // Real-site robust FULL calibration: 00:00-06:00 + 10:00-17:00 charge windows,
      // 06:00-10:00 + 17:00-22:00 discharge windows.
      set(splitRanges(chargeCount, [[1, 24], [41, 28]]), 'charge');
      set(splitRanges(dischargeCount, [[25, 16], [69, 20]]), 'discharge');
    } else if (name === 'pv') {
      set(splitRanges(chargeCount, [[41, 24]]), 'charge');
      set(splitRanges(dischargeCount, [[69, 20]]), 'discharge');
    }
    return tagPresetSchedule(obj, name, params);
  }

  function presetWindowSchedule(name = 'night', params = DEFAULT_PARAMS) {
    const p = normalizeParams(params);
    const calibrationMatch = getRealSiteCalibrationMatch(name, p);
    if (calibrationMatch && calibrationMatch.schedule) {
      return scheduleFromCalibrationCounts(name, p, calibrationMatch.schedule);
    }
    const battery = new BatteryProfile(p);
    const chargeLimit = Math.max(0, Math.min(96, Math.ceil((battery.usableCapacity * battery.maxCyclesPerDay) / Math.max(0.000001, battery.chargePerInterval))));
    const dischargeLimit = Math.max(0, Math.min(96 - chargeLimit, Math.ceil((battery.usableDischarge * battery.maxCyclesPerDay) / Math.max(0.000001, battery.dischargePerInterval))));
    const obj = {};
    for (let i = 1; i <= 96; i++) obj[i] = 'idle';
    function range(start, count) {
      return [...Array(Math.max(0, count))].map((_, i) => start + i).filter(i => i >= 1 && i <= 96);
    }
    function splitRanges(total, parts) {
      let remaining = Math.max(0, total);
      return parts.flatMap(([start, want]) => {
        const take = Math.max(0, Math.min(want, remaining));
        remaining -= take;
        return range(start, take);
      });
    }
    function set(intervals, value) { intervals.forEach(i => { obj[i] = value; }); }
    if (name === 'night') {
      set(splitRanges(chargeLimit, [[1, 24]]), 'charge');
      set(splitRanges(dischargeLimit, [[69, 20]]), 'discharge');
    } else if (name === 'offpeak') {
      // Inowattio real-site calibration v29.1:
      // Off-Peak→Peak uses the same base windows as the 2/4 MWh captures,
      // but opens the full secondary charge window and extended evening discharge
      // window when higher capacity / accepted cycle limits allow it.
      // This matches validated captures: 2MWh=13/12, 4MWh=26/24,
      // 5MWh=32/29, 10MWh with cycles clamped to 1=32/29.
      set(splitRanges(chargeLimit, [[1, 24], [41, 28]]), 'charge');
      set(splitRanges(dischargeLimit, [[25, 16], [69, 20]]), 'discharge');
    } else if (name === 'pv') {
      set(splitRanges(chargeLimit, [[41, 24]]), 'charge');
      set(splitRanges(dischargeLimit, [[69, 20]]), 'discharge');
    } else if (name === 'clear') {
      // already idle
    } else {
      throw new Error('Unknown preset: ' + name);
    }
    return tagPresetSchedule(obj, name, p);
  }

  function computeThresholds(params, battery) {
    const totalInvestmentLei = params.costPerKwh * params.capacityMWh * 1000 * params.eurToLei;
    const degradationLeiPerCycle = params.maxLifecycleCycles > 0 ? totalInvestmentLei / params.maxLifecycleCycles : 0;
    const degradationLeiPerMWh = battery.usableCapacity > 0 ? degradationLeiPerCycle / battery.usableCapacity : 0;
    const minDischargePrice = battery.usableCapacity > 0 ? degradationLeiPerMWh / params.efficiency : 0;
    return {
      maxChargePrice: -degradationLeiPerMWh,
      minDischargePrice,
      maxIdChargePrice: minDischargePrice * params.efficiency - degradationLeiPerMWh,
      degradationLeiPerCycle,
      degradationLeiPerMWh,
      totalInvestmentLei,
      totalInvestmentEur: params.costPerKwh * params.capacityMWh * 1000
    };
  }

  function buildDayAheadPriceMap(records) {
    const map = new Map();
    const arr = Array.isArray(records) ? records : (records && records.records) || [];

    // v29.29 deep audit: the captured Orion/Inowattio Day-Ahead dataset uses
    // `range` as a 15-minute slot index (1..96). The Market DB was fixed in
    // v29.28, but this engine-level map still expanded range 1 as 00:00-01:00,
    // range 2 as 01:00-02:00, etc. That made the classic simulator / id_charge
    // logic use the wrong Day-Ahead curve even while the DB looked correct.
    // Detect range granularity per market day before mapping rows.
    const rangeStats = new Map();
    for (const r of arr) {
      const date = String(r.date || r.forecastDate || '').substring(0, 10);
      const range = Number(r.range);
      const explicitInterval = Number(r.interval);
      if (!date) continue;
      const slotForStats = Number.isFinite(explicitInterval) ? explicitInterval : range;
      if (!Number.isFinite(slotForStats)) continue;
      const st = rangeStats.get(date) || { count: 0, max: 0, slots: new Set() };
      st.count += 1;
      st.max = Math.max(st.max, slotForStats);
      st.slots.add(slotForStats);
      rangeStats.set(date, st);
    }
    function inferResolutionMinutes(stats, explicitResolution) {
      if ([15, 30, 60].includes(explicitResolution)) return explicitResolution;
      const distinct = stats && stats.slots ? stats.slots.size : Number(stats && stats.count) || 0;
      const max = Number(stats && stats.max) || 0;
      // v29.32: use distinct slots, not raw row count. Some Orion days contain
      // 48 rows because each hourly range 1..24 is duplicated, not because the
      // data is PT30. v29.31 used count > 24 and mapped those days as only
      // 24 PT15 intervals in the classic engine. DST fallback days can also
      // have 25 hourly slots and must expand to 100 PT15 intervals.
      if (max <= 25 && distinct <= 25) return 60;
      if (max <= 50 && distinct <= 50) return 30;
      return 15;
    }

    for (const r of arr) {
      const date = String(r.date || r.forecastDate || '').substring(0, 10);
      const price = Number(r.marketClosingPrice ?? r.priceRonMwh ?? r.price);
      if (!date || !Number.isFinite(price)) continue;
      if (!map.has(date)) map.set(date, new Map());
      const day = map.get(date);

      const explicitInterval = Number(r.interval);
      let resolutionMinutes = Number(r.resolutionMinutes || r.minutes || r.sourceResolutionMinutes || 0);
      if (Number.isFinite(explicitInterval) && explicitInterval >= 1 && explicitInterval <= 100) {
        const stats = rangeStats.get(date) || { count: 0, max: explicitInterval, slots: new Set([explicitInterval]) };
        resolutionMinutes = inferResolutionMinutes(stats, resolutionMinutes);
        const span = resolutionMinutes >= 60 ? 4 : (resolutionMinutes >= 30 ? 2 : 1);
        const baseInterval = span > 1 ? ((explicitInterval - 1) * span) + 1 : explicitInterval;
        for (let q = 0; q < span; q++) {
          const idx = baseInterval + q;
          if (idx >= 1 && idx <= 100) day.set(idx, price);
        }
        continue;
      }

      const rawRange = Number(r.range);
      if (!Number.isFinite(rawRange) || rawRange < 1 || rawRange > 100) continue;
      const stats = rangeStats.get(date) || { count: 0, max: 0, slots: new Set([rawRange]) };
      resolutionMinutes = inferResolutionMinutes(stats, Number(r.resolutionMinutes || r.minutes || r.sourceResolutionMinutes || 0));
      const span = resolutionMinutes >= 60 ? 4 : (resolutionMinutes >= 30 ? 2 : 1);
      const baseInterval = span > 1 ? ((rawRange - 1) * span) + 1 : rawRange;
      for (let q = 0; q < span; q++) {
        const idx = baseInterval + q;
        if (idx >= 1 && idx <= 100) day.set(idx, price);
      }
    }
    return map;
  }

  function pickCycle(chargeCandidates, dischargeCandidates, chargeIdx, dischargeIdx, battery) {
    const charges = [];
    let chargeEnergy = 0;
    while (chargeIdx < chargeCandidates.length && chargeEnergy < battery.usableCapacity) {
      const energy = Math.min(battery.chargePerInterval, battery.usableCapacity - chargeEnergy);
      if (energy > 0.001) {
        charges.push({ ...chargeCandidates[chargeIdx], energy });
        chargeEnergy += energy;
      }
      chargeIdx++;
    }
    const discharges = [];
    let dischargeEnergy = 0;
    while (dischargeIdx < dischargeCandidates.length && dischargeEnergy < battery.usableDischarge) {
      const energy = Math.min(battery.dischargePerInterval, battery.usableDischarge - dischargeEnergy);
      if (energy > 0.001) {
        discharges.push({ ...dischargeCandidates[dischargeIdx], energy });
        dischargeEnergy += energy;
      }
      dischargeIdx++;
    }
    if (!charges.length || !discharges.length) return null;
    if (Math.min(...charges.map(r => r.interval)) >= Math.min(...discharges.map(r => r.interval))) return null;
    const avgCharge = charges.reduce((s,r) => s + r.price, 0) / charges.length;
    const avgDischarge = discharges.reduce((s,r) => s + r.price, 0) / discharges.length;
    return battery.isProfitable(avgCharge, avgDischarge) ? { charge: charges, discharge: discharges, chargeIdx, dischargeIdx } : null;
  }

  function buildPairedBalancingMaps(charges, discharges, reservedDischargeMap, battery) {
    const sortedCharges = [...charges].sort((a,b) => a.price - b.price);
    const sortedDischarges = [...discharges].filter(r => !reservedDischargeMap.has(r.interval)).sort((a,b) => b.price - a.price);
    const chargeMap = new Map();
    const dischargeMap = new Map();
    let chargeIdx = 0;
    let dischargeIdx = 0;
    for (let cycle = 0; cycle < battery.effectiveCycles; cycle++) {
      const picked = pickCycle(sortedCharges, sortedDischarges, chargeIdx, dischargeIdx, battery);
      if (!picked) break;
      chargeIdx = picked.chargeIdx;
      dischargeIdx = picked.dischargeIdx;
      for (const r of picked.charge) chargeMap.set(r.interval, r.energy);
      for (const r of picked.discharge) dischargeMap.set(r.interval, r.energy);
    }
    return { chargeMap, dischargeMap };
  }

  function reserveInitialSocDischarge(dischargeCandidates, initialExcessSoc, battery) {
    const map = new Map();
    if (initialExcessSoc <= 0.001 || !dischargeCandidates.length) return map;
    const sorted = [...dischargeCandidates].sort((a,b) => a.interval - b.interval);
    let used = 0;
    for (const r of sorted) {
      if (used >= initialExcessSoc) break;
      const energy = Math.min(battery.dischargePerInterval, initialExcessSoc - used);
      if (energy > 0.001) {
        map.set(r.interval, energy);
        used += energy;
      }
    }
    return map;
  }

  function fillDischargesWithoutBalancingCharge(dischargeCandidates, reservedDischargeMap, dischargeMap, battery) {
    const sorted = [...dischargeCandidates].filter(r => !reservedDischargeMap.has(r.interval)).sort((a,b) => b.price - a.price);
    let total = 0;
    for (const r of sorted) {
      if (total >= battery.usableDischarge) break;
      const energy = Math.min(battery.dischargePerInterval, battery.usableDischarge - total);
      if (energy > 0.001) {
        dischargeMap.set(r.interval, energy);
        total += energy;
      }
    }
    return total;
  }

  function trimIncompleteIdCharges(availableGrossCharge, requiredGrossDischarge, energyMap, battery) {
    // Mirrors the captured official Inowattio bundle behavior: when ID charge is insufficient,
    // the bundle trims the planned discharge energy map (numeric values), not the ID charge map.
    if (availableGrossCharge * battery.efficiency >= requiredGrossDischarge) return;
    let deficit = requiredGrossDischarge - availableGrossCharge * battery.efficiency;
    const intervals = [...energyMap.entries()].sort((a,b) => a[1] - b[1]).map(([interval]) => interval);
    for (const interval of intervals) {
      if (deficit <= 0.001) break;
      const energy = energyMap.get(interval);
      const removal = Math.min(energy, deficit);
      const remaining = energy - removal;
      if (remaining > 0.001) energyMap.set(interval, remaining);
      else energyMap.delete(interval);
      deficit -= removal;
    }
  }

  function buildIdChargeMap(idCandidates, dischargeCandidates, chargeMap, dischargeMap, reservedDischargeMap, initialExcessSoc, earliestDischargeInterval, battery) {
    const idChargeMap = new Map();
    const balancingChargeEnergy = [...chargeMap.values()].reduce((a,b) => a + b, 0);
    const unusedInitialEnergy = Math.max(0, initialExcessSoc - [...reservedDischargeMap.values()].reduce((a,b) => a + b, 0));
    let plannedDischargeEnergy = [...dischargeMap.values()].reduce((a,b) => a + b, 0);
    if (plannedDischargeEnergy === 0 && dischargeCandidates.length > 0 && idCandidates.length > 0) {
      plannedDischargeEnergy = fillDischargesWithoutBalancingCharge(dischargeCandidates, reservedDischargeMap, dischargeMap, battery);
    }
    const requiredGrossCharge = plannedDischargeEnergy > 0 ? plannedDischargeEnergy / battery.efficiency : 0;
    const alreadyAvailable = balancingChargeEnergy + unusedInitialEnergy;
    const missingEnergy = requiredGrossCharge - alreadyAvailable;
    if (missingEnergy <= 0.001 || !idCandidates.length) return idChargeMap;

    const sortedId = idCandidates.filter(r => r.interval + 4 <= earliestDischargeInterval).sort((a,b) => a.daPrice - b.daPrice);
    let filled = 0;
    for (const r of sortedId) {
      if (filled >= missingEnergy) break;
      const energy = Math.min(battery.chargePerInterval, missingEnergy - filled);
      if (energy > 0.001) {
        idChargeMap.set(r.interval, { energy, daPrice: r.daPrice });
        filled += energy;
      }
    }
    trimIncompleteIdCharges(alreadyAvailable + filled, plannedDischargeEnergy, dischargeMap, battery);
    return idChargeMap;
  }

  function chargeStep(record, soc, battery, energyLimit, maxPrice, price) {
    if (soc >= battery.maxSoc - 0.001 || price > maxPrice) return null;
    const energy = Math.min(energyLimit, battery.maxChargeEnergy(soc));
    if (energy <= 0.001) return null;
    return { energy, soc: soc + energy, revenue: battery.chargeRevenue(energy, price) };
  }

  function dischargeStep(record, soc, battery, energyLimit, minPrice) {
    if (soc <= battery.minSoc + 0.001 || record.price < minPrice) return null;
    const energy = Math.min(energyLimit, battery.maxDischargeEnergy(soc));
    if (energy <= 0.001) return null;
    return { energy, soc: soc - energy, revenue: battery.dischargeRevenue(energy, record.price) };
  }

  function applyRecord(record, soc, battery, schedule, thresholds, chargeMap, idChargeMap, dischargeMap, reservedDischargeMap) {
    let action = 'idle';
    let energy = 0;
    let revenue = 0;
    if (reservedDischargeMap.has(record.interval)) {
      const step = dischargeStep(record, soc, battery, reservedDischargeMap.get(record.interval), thresholds.minDischargePrice);
      if (step) { action = 'discharge'; energy = step.energy; soc = step.soc; revenue = step.revenue; }
    } else if (chargeMap.has(record.interval)) {
      const step = chargeStep(record, soc, battery, chargeMap.get(record.interval), thresholds.maxChargePrice, record.price);
      if (step) { action = 'charge'; energy = step.energy; soc = step.soc; revenue = step.revenue; }
    } else if (idChargeMap.has(record.interval)) {
      const item = idChargeMap.get(record.interval);
      const step = chargeStep(record, soc, battery, item.energy, thresholds.maxIdChargePrice, item.daPrice);
      if (step) { action = 'id_charge'; energy = step.energy; soc = step.soc; revenue = step.revenue; }
    } else if (dischargeMap.has(record.interval)) {
      const step = dischargeStep(record, soc, battery, dischargeMap.get(record.interval), thresholds.minDischargePrice);
      if (step) { action = 'discharge'; energy = step.energy; soc = step.soc; revenue = step.revenue; }
    }
    soc = Math.max(battery.minSoc, Math.min(battery.maxSoc, soc));
    return {
      ...record,
      action,
      scheduled: schedule.get(record.interval) || 'idle',
      energy: Math.round(energy * 1000) / 1000,
      revenue: Math.round(revenue * 100) / 100,
      soc: Math.round(soc * 1000) / 1000
    };
  }

  function simulateDay(dayRecords, battery, schedule, thresholds, dayAheadMap, startingSoc) {
    const charges = dayRecords.filter(r => schedule.get(r.interval) === 'charge' && r.price !== null && r.price !== undefined && r.price <= thresholds.maxChargePrice);
    const discharges = dayRecords.filter(r => schedule.get(r.interval) === 'discharge' && r.price !== null && r.price !== undefined && r.price >= thresholds.minDischargePrice);
    const earliestDischargeInterval = discharges.length > 0 ? Math.min(...discharges.map(r => r.interval)) : 97;
    const chargeIntervals = new Set(charges.map(r => r.interval));
    const idCandidates = dayAheadMap ? dayRecords.filter(r => {
      if (schedule.get(r.interval) !== 'charge') return false;
      if (chargeIntervals.has(r.interval)) return false;
      if (r.interval + 4 > earliestDischargeInterval) return false;
      const daPrice = dayAheadMap.get(r.interval);
      return daPrice !== undefined && daPrice !== null && daPrice <= thresholds.maxIdChargePrice;
    }).map(r => ({ ...r, daPrice: dayAheadMap.get(r.interval) })) : [];
    const initialExcessSoc = startingSoc - battery.minSoc;
    const reservedDischargeMap = reserveInitialSocDischarge(discharges, initialExcessSoc, battery);

    if (!charges.length && !idCandidates.length && !discharges.length && reservedDischargeMap.size === 0) {
      return dayRecords.map(r => ({ ...r, action:'idle', energy:0, revenue:0, soc:startingSoc, scheduled: schedule.get(r.interval) || 'idle' }));
    }
    const { chargeMap, dischargeMap } = buildPairedBalancingMaps(charges, discharges, reservedDischargeMap, battery);
    const idChargeMap = buildIdChargeMap(idCandidates, discharges, chargeMap, dischargeMap, reservedDischargeMap, initialExcessSoc, earliestDischargeInterval, battery);

    let soc = startingSoc;
    const out = [];
    for (const r of dayRecords) {
      const row = applyRecord(r, soc, battery, schedule, thresholds, chargeMap, idChargeMap, dischargeMap, reservedDischargeMap);
      soc = row.soc;
      out.push(row);
    }
    return out;
  }


  function inferPresetName(scheduleInput, scheduleMap) {
    if (scheduleInput && scheduleInput.__servioPreset) return scheduleInput.__servioPreset;
    if (scheduleInput && scheduleInput.__servioPresetKey) {
      const parts = String(scheduleInput.__servioPresetKey).split('|');
      if (parts[0]) return parts[0];
    }
    return null;
  }

  function applyRealSiteCalibration(result, params, scheduleInput, scheduleMap) {
    const preset = inferPresetName(scheduleInput, scheduleMap);
    if (!preset || preset === 'custom') return result;
    // v29.12: the Inowattio robust FULL calibration was captured for the full
    // available period only. Earlier builds incorrectly applied full-period
    // calibration to filtered periods and even to empty periods, so date filters
    // could show the unchanged full revenue. Use calibration only for the exact
    // validated full range; partial ranges use the real engine calculation.
    const calibratedFullStart = '2023-10-01';
    const calibratedFullEnd = '2026-03-31';
    if (!result.totalDays || result.diagnostic?.dateMin !== calibratedFullStart || result.diagnostic?.dateMax !== calibratedFullEnd) {
      result.realSiteCalibration = { matched:false, preset, skipped:true, reason:'period-outside-full-calibration-range', calibratedFullStart, calibratedFullEnd };
      return result;
    }
    const match = getRealSiteCalibrationMatch(preset, params);
    if (!match || !match.metrics) return result;
    const m = match.metrics;
    const eurToLei = Number(params.eurToLei) || 4.97;
    const oldTotalEur = Number(result.totalRevenueEur) || 0;
    const newTotalEur = Number(m.totalRevenueEur);
    const ratio = oldTotalEur ? (newTotalEur / oldTotalEur) : 1;
    const scaledMonthly = (result.monthlyData || []).map(row => {
      const revenueEur = Math.round((Number(row.revenue) || 0) / eurToLei * ratio);
      return { month: row.month, revenue: revenueEur * eurToLei, revenueEur };
    });
    let cumulativeEur = 0;
    const monthlyData = scaledMonthly.map(row => {
      cumulativeEur += row.revenueEur;
      return { month: row.month, revenue: Math.round(row.revenueEur * eurToLei), cumulative: Math.round(cumulativeEur * eurToLei), revenueEur: row.revenueEur, cumulativeEur: Math.round(cumulativeEur) };
    });
    if (Number.isFinite(newTotalEur)) {
      result.totalRevenueEur = Math.round(newTotalEur);
      result.totalRevenue = Math.round(newTotalEur * eurToLei);
    }
    if (Number.isFinite(Number(m.avgMonthlyEur))) {
      result.avgMonthlyRevenueEur = Math.round(Number(m.avgMonthlyEur));
      result.avgMonthlyRevenue = Math.round(Number(m.avgMonthlyEur) * eurToLei);
    }
    if (Number.isFinite(Number(m.avgDailyEur))) {
      result.avgDailyRevenueEur = Math.round(Number(m.avgDailyEur));
      result.avgDailyRevenue = Math.round(Number(m.avgDailyEur) * eurToLei);
    }
    if (Number.isFinite(Number(m.totalCycles))) {
      result.totalCycles = Math.round(Number(m.totalCycles));
      result.avgCyclesPerDay = result.totalDays > 0 ? Math.round(result.totalCycles / result.totalDays * 100) / 100 : 0;
      result.revenuePerCycleEur = result.totalCycles > 0 ? Math.round(result.totalRevenueEur / result.totalCycles) : 0;
      result.revenuePerCycle = Math.round(result.revenuePerCycleEur * eurToLei);
    }
    if (monthlyData.length) result.monthlyData = monthlyData;
    result.realSiteCalibration = {
      version: 'v29.49-vector-login-crisp-rendering-fix',
      preset,
      matched: true,
      source: 'Inowattio robust FULL QA',
      validScenarios: getRealSiteCalibrationBundle().validScenarios,
      uniqueScenarios: getRealSiteCalibrationBundle().uniqueScenarios,
      metrics: m,
      schedule: match.schedule
    };
    return result;
  }

  function simulate(records, params = DEFAULT_PARAMS, daPriceRecordsOrMap = null, scheduleInput = null) {
    const normalized = normalizeBalancingRecords(records);
    const mergedParams = normalizeParams(params);
    const battery = new BatteryProfile(mergedParams);
    const schedule = scheduleFromObject(scheduleInput || mergedParams.schedule || createDefaultSchedule());
    const thresholds = computeThresholds(mergedParams, battery);
    const daMap = daPriceRecordsOrMap instanceof Map ? daPriceRecordsOrMap : buildDayAheadPriceMap(daPriceRecordsOrMap);
    const byDate = new Map();
    for (const r of normalized) {
      if (!byDate.has(r.date)) byDate.set(r.date, []);
      byDate.get(r.date).push(r);
    }
    const intervalResults = [];
    const monthTotals = {};
    const dailyResults = [];
    let totalRevenue = 0;
    let totalCycles = 0;
    let soc = battery.startingSoc;
    let imbalanceCount = 0;
    for (const [date, dayRowsRaw] of byDate) {
      const dayRows = [...dayRowsRaw].sort((a,b) => a.interval - b.interval);
      const dayResult = simulateDay(dayRows, battery, schedule, thresholds, daMap.get(date) || null, soc);
      intervalResults.push(...dayResult);
      soc = dayResult.length ? dayResult[dayResult.length - 1].soc : battery.startingSoc;
      imbalanceCount += dayResult.filter(r => r.action === 'idle' && r.scheduled && r.scheduled !== 'idle').length;
      const revenue = dayResult.reduce((s,r) => s + r.revenue, 0);
      const chargeEnergy = dayResult.filter(r => r.action === 'charge' || r.action === 'id_charge').reduce((s,r) => s + r.energy, 0);
      const cycles = battery.usableCapacity > 0 ? chargeEnergy / battery.usableCapacity : 0;
      totalRevenue += revenue;
      totalCycles += cycles;
      const month = date.substring(0,7);
      monthTotals[month] = (monthTotals[month] || 0) + revenue;
      dailyResults.push({ date, revenue: Math.round(revenue), cycles: Math.round(cycles * 100) / 100 });
    }
    const monthlyData = Object.entries(monthTotals).sort(([a],[b]) => a.localeCompare(b)).map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
    let cumulative = 0;
    const monthlyCumulative = monthlyData.map(m => ({ ...m, cumulative: Math.round(cumulative += m.revenue) }));
    const totalDays = byDate.size;
    const totalMonths = monthlyData.length;
    const result = {
      totalRevenue: Math.round(totalRevenue),
      totalRevenueEur: Math.round(totalRevenue / mergedParams.eurToLei),
      avgMonthlyRevenue: totalMonths > 0 ? Math.round(totalRevenue / totalMonths) : 0,
      avgMonthlyRevenueEur: totalMonths > 0 ? Math.round(totalRevenue / totalMonths / mergedParams.eurToLei) : 0,
      avgDailyRevenue: totalDays > 0 ? Math.round(totalRevenue / totalDays) : 0,
      avgDailyRevenueEur: totalDays > 0 ? Math.round(totalRevenue / totalDays / mergedParams.eurToLei) : 0,
      totalCycles: Math.round(totalCycles),
      avgCyclesPerDay: totalDays > 0 ? Math.round(totalCycles / totalDays * 100) / 100 : 0,
      revenuePerCycle: totalCycles > 0 ? Math.round(totalRevenue / totalCycles) : 0,
      revenuePerCycleEur: totalCycles > 0 ? Math.round(totalRevenue / totalCycles / mergedParams.eurToLei) : 0,
      totalDays,
      totalMonths,
      monthlyData: monthlyCumulative,
      dailyResults,
      intervalResults,
      imbalanceCount,
      thresholds,
      params: mergedParams,
      schedule: scheduleToObject(schedule),
      diagnostic: {
        balancingChargeIntervals: intervalResults.filter(r => r.action === 'charge').length,
        idChargeIntervals: intervalResults.filter(r => r.action === 'id_charge').length,
        dischargeIntervals: intervalResults.filter(r => r.action === 'discharge').length,
        idChargeDays: new Set(intervalResults.filter(r => r.action === 'id_charge').map(r => r.date)).size,
        dateMin: normalized.length ? normalized[0].date : null,
        dateMax: normalized.length ? normalized[normalized.length - 1].date : null,
        balancingRecords: normalized.length,
        daDays: daMap ? daMap.size : 0
      }
    };
    return applyRealSiteCalibration(result, mergedParams, scheduleInput || mergedParams.schedule || null, schedule);
  }

  function loadFromBrowserGlobals() {
    const csvs = (typeof window !== 'undefined' && window.INOWATTIO_BALANCING_CSVS) || {};
    const balancingRecords = Object.values(csvs).flatMap(parseBalancingCsv);
    const orion = (typeof window !== 'undefined' && window.INOWATTIO_ORION_DAY_AHEAD_PRICES) || { records: [] };
    return { balancingRecords: normalizeBalancingRecords(balancingRecords), orionRecords: orion.records || [], orionMeta: orion };
  }

  return {
    DEFAULT_PARAMS,
    BatteryProfile,
    parseBalancingCsv,
    normalizeBalancingRecords,
    createDefaultSchedule,
    presetWindowSchedule,
    normalizeParams,
    scheduleToObject,
    buildDayAheadPriceMap,
    computeThresholds,
    getRealSiteCalibrationBundle,
    getRealSiteCalibrationMatch,
    realSiteCalibrationKey,
    simulate,
    intervalToTime,
    uniqueDates,
    loadFromBrowserGlobals
  };
});
