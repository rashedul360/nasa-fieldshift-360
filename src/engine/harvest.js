// Harvest window and yield range: a PLANNING ESTIMATE [RULE on REAL temperature + DEMO yields].
// Growing degree days (GDD) target is calibrated at runtime: the GDD a crop accumulates over its
// typical duration from its normal date, using the 2001–2025 average. A warmer recent climate or a
// different planting date then changes the estimated duration.
import { ymd, addDays, daysBetween } from './dates.js';
import { SEASONS, NOW, tmeanClimatology } from './climate.js';
import { BIGHA_HA, DECIMAL_HA, MAUND_KG } from './crops.js';

const cache = new WeakMap();
function clims(clim) {
  if (!cache.has(clim)) cache.set(clim, { all: tmeanClimatology(clim, SEASONS), now: tmeanClimatology(clim, NOW) });
  return cache.get(clim);
}

// crop-year index: days since 1 Jul of the previous calendar year relative to the harvest season
const cyIndex = (t, season) => daysBetween(ymd(season - 1, 7, 1), t);

function gdd(tm, base, k0, days) {
  let s = 0;
  for (let k = k0; k < k0 + days && k < tm.length; k++) if (tm[k] != null) s += Math.max(0, tm[k] - base);
  return s;
}

export function harvestWindow(clim, crop, plantT, season) {
  const { all, now } = clims(clim);
  const normalT = ymd(crop.plant.prevYear ? season - 1 : season, crop.plant.m, crop.plant.d);
  const target = gdd(all, crop.gddBase, cyIndex(normalT, season), crop.days);
  let k = cyIndex(plantT, season), acc = 0, d = 0;
  while (acc < target && k < now.length) {
    if (now[k] != null) acc += Math.max(0, now[k] - crop.gddBase);
    k++; d++;
  }
  if (acc < target) d = crop.days; // fallback
  const start = addDays(plantT, d);
  const end = addDays(start, crop.harvestWeeks.length * 7 - 1);
  return { start, end, days: d, gddTarget: Math.round(target) };
}

export function yieldRange(crop, areaDecimal, safetyNow = 1) {
  const ha = areaDecimal * DECIMAL_HA;
  const stress = safetyNow < 0.6 ? 0.85 : 1; // high-risk climate trims the upper end
  const lo = crop.yieldTHa[0] * ha * 1000;
  const hi = crop.yieldTHa[1] * ha * 1000 * stress;
  return { kgLow: lo, kgHigh: Math.max(lo, hi), maundLow: lo / MAUND_KG, maundHigh: Math.max(lo, hi) / MAUND_KG };
}

export function profitPerBigha(crop) {
  const kgLo = crop.yieldTHa[0] * BIGHA_HA * 1000, kgHi = crop.yieldTHa[1] * BIGHA_HA * 1000;
  const lo = kgLo * crop.priceTk[0] - crop.costPerBigha[1];
  const hi = kgHi * crop.priceTk[1] - crop.costPerBigha[0];
  return { low: lo, high: hi, mid: (lo + hi) / 2 };
}
