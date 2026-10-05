import { bnDigits } from './dates.js';
// Keep / Adjust / Shift decision engine [RULE on REAL climate + soil + DEMO economics].
import { RABI_CROPS, IRRIGATION } from './crops.js';
import { backtest, plantDate, PLAN_SEASON } from './climate.js';
import { harvestWindow, profitPerBigha } from './harvest.js';
import { glutRisk, GLUT_SCORE } from './glut.js';

export const SHIFTS = [-14, 0, 14];
export const BASE_WEIGHTS = { C: 0.30, W: 0.20, S: 0.15, P: 0.15, R: 0.10, G: 0.10, E: 0 };
export const PRIORITIES = {
  water: { bn: 'সেচ কম লাগুক', en: 'Use less water', hint: { bn: 'কম পানির ফসল আগে আসবে', en: 'Crops that need less irrigation rank higher' }, icon: 'droplets', apply: (w) => { w.W *= 2.5; } },
  income: { bn: 'আয় বেশি হোক', en: 'Earn more', hint: { bn: 'বেশি লাভের ফসল আগে আসবে', en: 'More profitable crops rank higher' }, icon: 'coins', apply: (w) => { w.P *= 2.5; } },
  risk: { bn: 'ঝুঁকি কম থাকুক', en: 'Play it safe', hint: { bn: 'আবহাওয়া আর দাম পড়ার ঝুঁকি কম এমন ফসল', en: 'Less weather and price risk' }, icon: 'shield', apply: (w) => { w.C *= 1.6; w.G *= 1.6; } },
  soil: { bn: 'মাটি ভালো হোক', en: 'Build up the soil', hint: { bn: 'মাটির উপকার করে এমন ফসল ও ফসলচক্র', en: 'Crops and rotations that feed the soil' }, icon: 'sprout', apply: (w) => { w.S *= 2; w.R *= 2.5; } },
  early: { bn: 'তাড়াতাড়ি ঘরে তুলি', en: 'Harvest sooner', hint: { bn: 'যে ফসল আগে ওঠে', en: 'Crops that are ready sooner' }, icon: 'timer', apply: (w) => { w.E += 0.15; } },
};

export function weightsFor(priorities) {
  const w = { ...BASE_WEIGHTS };
  for (const p of priorities) PRIORITIES[p]?.apply(w);
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(w)) w[k] = w[k] / sum;
  return w;
}

const LOW = ['very low', 'low'];

export function soilFit(crop, soil) {
  const notes = [];
  const [lo, hi] = crop.ph;
  let s;
  if (soil.ph >= lo && soil.ph <= hi) { s = 100; notes.push({ bn: bnDigits(`মাটির pH ${soil.ph}, এই ফসলের জন্য ঠিক আছে (${lo}–${hi})`), en: `Soil pH ${soil.ph} suits this crop (${lo}–${hi})` }); }
  else if (soil.ph >= lo - 0.5 && soil.ph <= hi + 0.5) { s = 65; notes.push({ bn: bnDigits(`মাটির pH ${soil.ph}, একটু টক (দরকার ${lo}–${hi}); চুন বা জৈব সার দিলে ভালো`), en: `Soil pH ${soil.ph} is a little off (needs ${lo}–${hi}); lime or compost helps` }); }
  else { s = 30; notes.push({ bn: bnDigits(`মাটির pH ${soil.ph}, এই ফসলের জন্য মানানসই নয় (দরকার ${lo}–${hi})`), en: `Soil pH ${soil.ph} does not suit this crop (needs ${lo}–${hi})` }); }
  if (crop.wellDrained && soil.drainage === 'poor') { s -= 10; notes.push({ bn: 'বরেন্দ্রের শক্ত মাটিতে পানি নামে না, তাই উঁচু বেড করে লাগাতে হবে', en: 'Water sits on the Barind hardpan, so plant on raised beds' }); }
  if (!crop.wellDrained && soil.drainage === 'good') { s -= 10; notes.push({ bn: 'বেলে মাটিতে পানি ধরে রাখা কঠিন, সেচ বেশি লাগবে', en: 'Sandy soil does not hold standing water, so it needs more irrigation' }); }
  if (crop.heavyFeeder && (LOW.includes(soil.p_level) || LOW.includes(soil.k_level))) { s -= 10; notes.push({ bn: 'মাটিতে ফসফরাস বা পটাশ কম, সার খরচ বাড়বে', en: 'Soil is low in phosphorus or potash, so fertiliser costs more' }); }
  if (crop.legume && soil.calcareous) { s += 10; notes.push({ bn: 'চুনযুক্ত মাটিতে ডাল ভালো হয়', en: 'Limey soil suits pulses' }); }
  return { score: Math.max(0, Math.min(100, s)), notes };
}

export function waterFit(waterClass, irrigation) {
  const pen = IRRIGATION[irrigation]?.penalty[waterClass] ?? 30;
  return 100 - pen;
}

export function rotationFit(crop, lastCropId) {
  const last = RABI_CROPS[lastCropId];
  let s = last && last.family === crop.family ? 30 : 80;
  if (crop.legume) s += 20;
  return Math.min(100, s);
}

export function decide({ clim, soil, plot, union, priorities = [] }) {
  const weights = weightsFor(priorities);
  const raw = [];
  for (const crop of Object.values(RABI_CROPS)) {
    for (const shift of SHIFTS) {
      const t0 = plantDate(crop, PLAN_SEASON, shift);
      const bt = backtest(clim, crop, shift);
      const C = bt.now.n ? (bt.now.safe / bt.now.n) * 100 : 50;
      const W = waterFit(crop.water, plot.irrigation);
      const sf = soilFit(crop, soil);
      const prof = profitPerBigha(crop);
      const R = rotationFit(crop, plot.last_crop);
      const gr = glutRisk(clim, union, crop.id, t0, plot);
      const G = GLUT_SCORE[gr.level];
      const hw = harvestWindow(clim, crop, t0, PLAN_SEASON);
      raw.push({ crop, shift, t0, bt, hw, glut: gr, profit: prof, comp: { C, W, S: sf.score, P: 0, R, G, E: 0 }, soilNotes: sf.notes });
    }
  }
  // normalise profit and earliness across candidates
  const pm = raw.map((r) => r.profit.mid), pMin = Math.min(...pm), pMax = Math.max(...pm);
  const hs = raw.map((r) => r.hw.start), hMin = Math.min(...hs), hMax = Math.max(...hs);
  for (const r of raw) {
    r.comp.P = pMax > pMin ? 20 + (80 * (r.profit.mid - pMin)) / (pMax - pMin) : 60;
    r.comp.E = hMax > hMin ? 100 - (80 * (r.hw.start - hMin)) / (hMax - hMin) : 60;
    r.score = Object.entries(weights).reduce((a, [k, w]) => a + w * r.comp[k], 0);
  }
  const bestOf = (id) => raw.filter((r) => r.crop.id === id).sort((a, b) => b.score - a.score)[0];
  const cur = plot.last_crop;
  const curNormal = raw.find((r) => r.crop.id === cur && r.shift === 0);
  const curBest = bestOf(cur);
  const perCrop = Object.keys(RABI_CROPS).map(bestOf).sort((a, b) => b.score - a.score);
  const otherBest = perCrop.find((r) => r.crop.id !== cur);

  let label, rec;
  if (otherBest && otherBest.score >= curBest.score + 15) { label = 'SHIFT'; rec = otherBest; }
  else if (curBest.shift !== 0 && curBest.score >= curNormal.score + 10) { label = 'ADJUST'; rec = curBest; }
  else { label = 'KEEP'; rec = curNormal; }
  const caution = label === 'KEEP' && curNormal.score < 60;

  return { label, caution, rec, curNormal, curBest, options: perCrop, all: raw, weights, priorities };
}
