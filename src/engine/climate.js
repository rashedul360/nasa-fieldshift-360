// Climate access, season statistics and the 25-season backtest. [REAL data in, RULE logic]
import { DAY, ymd, addDays, parseISO } from './dates.js';

export const SEASONS = Array.from({ length: 25 }, (_, i) => 2001 + i); // harvest years 2001–2025
export const THEN = SEASONS.filter((y) => y <= 2012); // 12 seasons
export const NOW = SEASONS.filter((y) => y >= 2013); // 13 seasons
export const PLAN_SEASON = 2027; // Rabi 2026–27

export function makeClimate(json) {
  const start = parseISO(json.start);
  const n = json.tmax.length;
  const end = addDays(start, n - 1);
  const idx = (t) => Math.round((t - start) / DAY);
  const val = (v, t) => {
    const i = idx(t);
    if (i < 0 || i >= n) return undefined; // outside data
    const x = json[v][i];
    return x === null ? null : x;
  };
  return { prov: json.provenance, start, end, n, val, idx, raw: json };
}

// values of variable v from t0+from .. t0+to (inclusive). Returns null if any day is outside the data.
export function windowVals(clim, v, t0, from, to) {
  const out = [];
  for (let k = from; k <= to; k++) {
    const x = clim.val(v, addDays(t0, k));
    if (x === undefined) return null;
    if (x !== null) out.push(x);
  }
  return out;
}

export function evalRule(clim, rule, t0) {
  const w = windowVals(clim, rule.v, t0, rule.from, rule.to);
  if (w === null) return { ok: null }; // not evaluable
  if (rule.type === 'any') {
    const hit = w.filter((x) => x >= rule.thr).length;
    return { ok: hit === 0, value: Math.max(0, ...w) };
  }
  if (rule.type === 'count') {
    const c = w.filter((x) => x >= rule.thr).length;
    return { ok: c < rule.min, value: c };
  }
  if (rule.type === 'total_below') {
    const s = w.reduce((a, b) => a + b, 0);
    return { ok: s >= rule.thr, value: Math.round(s) };
  }
  return { ok: null };
}

// Planting date for a crop in a given harvest-season year, shifted by `shift` days.
export function plantDate(crop, season, shift = 0) {
  const y = crop.plant.prevYear ? season - 1 : season;
  return addDays(ymd(y, crop.plant.m, crop.plant.d), shift);
}

// Replay one crop+date through every season. Returns per-season results and then/now safe rates.
export function backtest(clim, crop, shift = 0, plantFn = null) {
  const seasons = SEASONS.map((y) => {
    const t0 = plantFn ? plantFn(y) : plantDate(crop, y, shift);
    const res = crop.rules.map((r) => ({ id: r.id, ...evalRule(clim, r, t0) }));
    if (res.some((r) => r.ok === null)) return { season: y, safe: null, fired: [] };
    const fired = res.filter((r) => !r.ok).map((r) => r.id);
    return { season: y, safe: fired.length === 0, fired, values: Object.fromEntries(res.map((r) => [r.id, r.value])) };
  });
  const rate = (ys) => {
    const s = seasons.filter((x) => ys.includes(x.season) && x.safe !== null);
    return s.length ? { safe: s.filter((x) => x.safe).length, n: s.length } : { safe: 0, n: 0 };
  };
  return { seasons, then: rate(THEN), now: rate(NOW) };
}

// ---- Climate Time Machine statistics (per season) ----
const sumRange = (clim, v, a, b) => {
  let s = 0;
  for (let t = a; t <= b; t += DAY) {
    const x = clim.val(v, t);
    if (x === undefined) return null;
    if (x !== null) s += x;
  }
  return s;
};
const countRange = (clim, v, a, b, pred) => {
  let c = 0;
  for (let t = a; t <= b; t += DAY) {
    const x = clim.val(v, t);
    if (x === undefined) return null;
    if (x !== null && pred(x)) c++;
  }
  return c;
};

export const TM_METRICS = {
  hotMarApr: {
    bn: 'চৈত্র-বৈশাখের খুব গরম দিন', en: 'Very hot days in March–April', unit: { bn: 'দিন', en: 'days' },
    detail: { bn: '১ মার্চ থেকে ৩০ এপ্রিলের মধ্যে যেসব দিনে তাপমাত্রা ৩৫° সেলসিয়াস ছুঁয়েছে', en: 'Days from 1 March to 30 April that reached 35 °C' },
    why: { bn: 'এই সময়ে বোরো ধানে ফুল আসে; বেশি গরমে ধান চিটা হয়', en: 'Boro flowers in these weeks, and heat leaves the grains empty' },
    f: (c, y) => countRange(c, 'tmax', ymd(y, 3, 1), ymd(y, 4, 30), (x) => x >= 35),
  },
  rabiRain: {
    bn: 'রবি মৌসুমের মোট বৃষ্টি', en: 'Total Rabi-season rain', unit: { bn: 'মিলিমিটার', en: 'mm' },
    detail: { bn: 'নভেম্বর থেকে ফেব্রুয়ারি পর্যন্ত মোট বৃষ্টি', en: 'All rain from November to February' },
    why: { bn: 'বৃষ্টি কম হলে সেচের খরচ বাড়ে; হঠাৎ ভারী বৃষ্টি চারা আর ফুল নষ্ট করে', en: 'Less rain means more irrigation; a sudden downpour damages seedlings and flowers' },
    f: (c, y) => sumRange(c, 'prec', ymd(y - 1, 11, 1), ymd(y, 2, 28)),
  },
  lateHeat: {
    bn: 'ফাল্গুন-চৈত্রের গরম দিন', en: 'Warm days in late winter', unit: { bn: 'দিন', en: 'days' },
    detail: { bn: '১৫ ফেব্রুয়ারি থেকে ৩১ মার্চের মধ্যে যেসব দিনে তাপমাত্রা ৩২° সেলসিয়াস ছুঁয়েছে', en: 'Days from 15 February to 31 March that reached 32 °C' },
    why: { bn: 'গমের দানা পুষ্ট হয় আর দেরিতে লাগানো টমেটোয় ফল ধরে এই সময়ে', en: 'Wheat fills its grain and late tomatoes set fruit in these weeks' },
    f: (c, y) => countRange(c, 'tmax', ymd(y, 2, 15), ymd(y, 3, 31), (x) => x >= 32),
  },
  coldNights: {
    bn: 'পৌষ-মাঘের কনকনে ঠান্ডা রাত', en: 'Cold nights in December–January', unit: { bn: 'রাত', en: 'nights' },
    detail: { bn: 'ডিসেম্বর-জানুয়ারির যেসব রাতে তাপমাত্রা ১০° সেলসিয়াস বা তার নিচে নেমেছে', en: 'Nights in December and January at 10 °C or below' },
    why: { bn: 'বেশি ঠান্ডায় বোরোর বীজতলা আর চারা হলুদ হয়ে মরে যায়', en: 'Hard cold yellows and kills Boro seedbeds and young plants' },
    f: (c, y) => countRange(c, 'tmin', ymd(y - 1, 12, 1), ymd(y, 1, 31), (x) => x <= 10),
  },
};

export function timeMachine(clim) {
  const out = {};
  for (const [k, m] of Object.entries(TM_METRICS)) {
    const series = SEASONS.map((y) => ({ season: y, value: m.f(clim, y) }));
    const mean = (ys) => {
      const v = series.filter((s) => ys.includes(s.season) && s.value !== null).map((s) => s.value);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    const thenM = mean(THEN), nowM = mean(NOW);
    out[k] = { series, then: thenM, now: nowM, change: thenM !== null && nowM !== null ? nowM - thenM : null,
      pct: thenM ? ((nowM - thenM) / thenM) * 100 : null };
  }
  return out;
}

// Mean daily temperature climatology by day of a Jul–Jun "crop year", for planning estimates.
export function tmeanClimatology(clim, seasons = NOW) {
  // index 0 = 1 Jul of (season-1)
  const sums = new Array(366).fill(0), cnt = new Array(366).fill(0);
  for (const y of seasons) {
    const t0 = ymd(y - 1, 7, 1);
    for (let k = 0; k < 366; k++) {
      const t = addDays(t0, k);
      const a = clim.val('tmax', t), b = clim.val('tmin', t);
      if (a == null || b == null) continue;
      sums[k] += (a + b) / 2; cnt[k]++;
    }
  }
  return sums.map((s, k) => (cnt[k] ? s / cnt[k] : null));
}
