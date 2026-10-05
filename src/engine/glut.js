// Collective planting / glut warning [RULE on DEMO plans].
import { ymd, addDays, DAY } from './dates.js';
import { RABI_CROPS, DECIMAL_HA } from './crops.js';
import { harvestWindow } from './harvest.js';
import { PLAN_SEASON } from './climate.js';

export const WEEK0 = ymd(2026, 10, 5); // a Monday; week bins counted from here
export const weekOf = (t) => Math.floor((t - WEEK0) / (7 * DAY));
export const weekStart = (w) => addDays(WEEK0, w * 7);

// typical share of union farm area under each crop in a "normal" Rabi [DEMO baseline]
export const TYPICAL_SHARE = { boro: 0.35, tomato: 0.35, wheat: 0.1, lentil: 0.08, mustard: 0.12 };
// weeks when tomato prices usually dip in Rajshahi [DEMO until DAM data is added]
export const PRICE_DIP = { tomato: [weekOf(ymd(2027, 2, 1)), weekOf(ymd(2027, 3, 8))] };
export const HIGH_FACTOR = 1.3;

// tomato transplant slots (planting windows)
export const SLOTS = [
  { id: 'S1', from: ymd(2026, 10, 25), to: ymd(2026, 11, 7) },
  { id: 'S2', from: ymd(2026, 11, 8), to: ymd(2026, 11, 21) },
  { id: 'S3', from: ymd(2026, 11, 22), to: ymd(2026, 12, 5) },
  { id: 'S4', from: ymd(2026, 12, 6), to: ymd(2026, 12, 19) },
];
export const slotOf = (t) => SLOTS.find((s) => t >= s.from && t <= s.to)?.id ?? null;

const midYield = (crop) => (crop.yieldTHa[0] + crop.yieldTHa[1]) / 2;

// supply (tonnes) by week for one crop in one union
export function supplyCurve(clim, plans, cropId, extra = []) {
  const crop = RABI_CROPS[cropId];
  const bins = new Map();
  for (const p of [...plans, ...extra]) {
    if (p.crop !== cropId) continue;
    const hw = p._hw ?? harvestWindow(clim, crop, p.date, PLAN_SEASON);
    const t = midYield(crop) * p.area_dec * DECIMAL_HA;
    const w0 = weekOf(hw.start);
    crop.harvestWeeks.forEach((share, i) => bins.set(w0 + i, (bins.get(w0 + i) || 0) + t * share));
  }
  return bins;
}

export function normalWeekly(unionArea, cropId) {
  const crop = RABI_CROPS[cropId];
  const totalT = unionArea * DECIMAL_HA * TYPICAL_SHARE[cropId] * midYield(crop);
  const spread = cropId === 'tomato' ? 10 : 4; // normal harvest spread in weeks
  return totalT / spread;
}

export function riskForWeeks(bins, weeks, normal, cropId) {
  const dip = PRICE_DIP[cropId];
  let level = 'Low';
  const detail = [];
  for (const w of weeks) {
    const s = bins.get(w) || 0;
    const inDip = dip ? w >= dip[0] && w <= dip[1] : false;
    const over = s > HIGH_FACTOR * normal;
    let l = 'Low';
    if (over && inDip) l = 'High';
    else if (over || (inDip && s > normal)) l = 'Medium';
    detail.push({ week: w, supply: s, inDip, level: l });
    if (l === 'High' || (l === 'Medium' && level === 'Low')) level = l;
  }
  return { level, detail };
}

// Glut risk for a candidate (crop, planting date) on a plot, given the union's other plans.
// Level is judged on the share of THIS plot's harvest that lands in High / Medium weeks.
export function glutRisk(clim, union, cropId, plantT, plot) {
  const crop = RABI_CROPS[cropId];
  const others = union.plans.filter((p) => p.plot_id !== plot.id);
  const mine = { plot_id: plot.id, crop: cropId, date: plantT, area_dec: plot.area_dec };
  const bins = supplyCurve(clim, others, cropId, [mine]);
  const hw = harvestWindow(clim, crop, plantT, PLAN_SEASON);
  const w0 = weekOf(hw.start);
  const weeks = crop.harvestWeeks.map((_, i) => w0 + i);
  const normal = normalWeekly(union.area_dec, cropId);
  const r = riskForWeeks(bins, weeks, normal, cropId);
  let hiShare = 0, medShare = 0;
  r.detail.forEach((d, i) => {
    if (d.level === 'High') hiShare += crop.harvestWeeks[i];
    if (d.level === 'Medium') medShare += crop.harvestWeeks[i];
  });
  const level = hiShare >= 0.5 ? 'High' : hiShare >= 0.2 || hiShare + medShare >= 0.5 ? 'Medium' : 'Low';
  const share = others.filter((p) => p.crop === cropId).reduce((a, p) => a + p.area_dec, 0) / union.area_dec;
  return { level, detail: r.detail, hiShare, medShare, share, normal, bins, weeks };
}

export function slotLoad(union) {
  const cap = (union.area_dec * TYPICAL_SHARE.tomato / SLOTS.length) * HIGH_FACTOR;
  return SLOTS.map((s) => {
    const load = union.plans.filter((p) => p.crop === 'tomato' && p.date >= s.from && p.date <= s.to).reduce((a, p) => a + p.area_dec, 0);
    return { ...s, load, cap, full: load >= cap };
  });
}

export const GLUT_SCORE = { Low: 90, Medium: 55, High: 20 };
