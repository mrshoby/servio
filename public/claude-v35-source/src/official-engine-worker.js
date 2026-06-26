/**
 * SERVIO Official Engine Worker — Stub
 * This file is replaced by the full engine in production deployments.
 * It is kept here to satisfy node --check and package.json CI validation.
 */
'use strict';

if (typeof globalThis.InowattioOfficialEngine === 'undefined') {
  globalThis.InowattioOfficialEngine = {
    DEFAULT_PARAMS: {
      capacityMWh: 1,
      costPerKwh: 250,
      efficiency: 0.90,
      efficiencyPct: 90,
      maxCyclesPerDay: 1,
      chargeWindowHours: 6,
      dischargeWindowHours: 6,
      totalInvestmentEur: 250000,
    },
    parseBalancingCsv(text) { return []; },
    normalizeBalancingRecords(raw) { return raw || []; },
    normalizeParams(params) { return { ...params }; },
    presetWindowSchedule(preset, params) { return {}; },
    simulate(records, params, orion, schedule) {
      return {
        totalRevenueEur: 0, totalCycles: 0, totalDays: 0,
        avgDailyRevenueEur: 0, totalRevenue: 0,
        note: 'Engine stub — production engine not present in this distribution.'
      };
    },
    BatteryProfile: function BatteryProfile(params) {
      this.usableCapacity = Number(params && params.capacityMWh || 1) * 0.9;
      this.usableDischarge = this.usableCapacity;
      this.chargePerInterval = this.usableCapacity / 4;
      this.dischargePerInterval = this.usableDischarge / 4;
      this.maxCyclesPerDay = Number(params && params.maxCyclesPerDay || 1);
    }
  };
}
