// Next-season rotation recommendation [RULE on REAL climate + soil].
import { ROTATION_CROPS, RABI_CROPS } from './crops.js';
import { backtest, PLAN_SEASON } from './climate.js';
import { ymd, addDays, monthOf, dayOf, bnDigits } from './dates.js';
import { waterFit } from './decision.js';
import { bnOf } from './text.js';

const RW = { soil: 0.30, family: 0.25, water: 0.20, climate: 0.15, window: 0.10 };
const PRIO = {
  water: (w) => { w.water *= 2.5; },
  soil: (w) => { w.soil *= 2; w.family *= 1.5; },
  risk: (w) => { w.climate *= 1.6; },
  early: (w) => { w.window *= 1.5; },
  income: () => {},
};

export function recommendRotation({ clim, soil, plot, chosen, priorities = [] }) {
  const w = { ...RW };
  priorities.forEach((p) => PRIO[p]?.(w));
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach((k) => (w[k] /= sum));

  const current = chosen.crop;
  const harvestEnd = chosen.hw.end;
  const sowT = addDays(harvestEnd, 7); // 1 week to clear and prepare the land
  const m = monthOf(sowT), d = dayOf(sowT);
  const lowOM = soil.om_pct < 1.5;

  const options = Object.values(ROTATION_CROPS).map((rc) => {
    const latest = ymd(PLAN_SEASON, rc.latestSow.m, rc.latestSow.d);
    const fits = sowT <= latest;
    const slack = Math.round((latest - sowT) / 864e5);
    const bt = rc.rules.length ? backtest(clim, rc, 0, (y) => ymd(y, m, d)) : null;
    const climate = bt && bt.now.n ? (bt.now.safe / bt.now.n) * 100 : 80;
    const comp = {
      soil: Math.min(100, rc.soilBenefit + (lowOM && rc.soilBenefit >= 60 ? 0 : 0)),
      family: rc.family === current.family ? 30 : 100,
      water: waterFit(rc.water, plot.irrigation),
      climate,
      window: !fits ? 0 : slack >= 10 ? 100 : 60,
    };
    const score = fits ? Object.entries(w).reduce((a, [k, x]) => a + x * comp[k], 0) : 0;
    const why = [];
    why.push(rc.benefit);
    if (rc.family !== current.family) why.push({ bn: `${current.name.bn} থেকে আলাদা গোত্রের ফসল, তাই আগের রোগ-পোকা জমিতে টিকে থাকতে পারে না`, en: `A different crop family from ${current.name.en.toLowerCase()}, so its pests and diseases die out` });
    else why.push({ bn: `${bnOf(current.name.bn)} একই গোত্রের ফসল, তাই রোগ-পোকা জমে থাকার ঝুঁকি আছে`, en: `The same crop family as ${current.name.en.toLowerCase()}, so pests and diseases can build up` });
    why.push({ bn: `সেচ লাগে ${rc.water === 'Low' ? 'খুব কম' : rc.water === 'Medium' ? 'মাঝারি' : 'বেশি'}`, en: `Needs ${rc.water === 'Low' ? 'very little' : rc.water === 'Medium' ? 'some' : 'a lot of'} irrigation` });
    if (bt) why.push({ bn: bnDigits(`২০১৩ থেকে ২০২৫-এর ১৩ মৌসুমের ${bt.now.safe}টিতে এই সময়ের আবহাওয়া ঠিক ছিল`), en: `The weather at this time of year was fine in ${bt.now.safe} of the 13 seasons from 2013 to 2025` });
    if (lowOM && rc.soilBenefit >= 60) why.push({ bn: bnDigits(`আপনার এলাকার মাটিতে জৈব পদার্থ কম (${soil.om_pct}%), এই ফসল তা বাড়াতে সাহায্য করে`), en: `Organic matter in your area's soil is low (${soil.om_pct}%) and this crop helps rebuild it` });
    return { crop: rc, fits, slack, comp, score, bt, why, sowT };
  });
  const feasible = options.filter((o) => o.fits).sort((a, b) => b.score - a.score);
  const nextRabiCaution = current.family === 'Solanaceae'
    ? { bn: 'আগামী রবিতে এই জমিতে আবার টমেটো, বেগুন বা আলু না করাই ভালো। এগুলো একই গোত্রের, রোগ জমে যায়।', en: 'Next Rabi, avoid tomato, brinjal or potato on this plot. They are one family and share diseases.' }
    : current.family === 'Poaceae'
      ? { bn: 'বছরে তিনবার ধান করলে মাটি দুর্বল হয়ে যায়। আগামী রবিতে মসুর বা সরিষা ভেবে দেখুন।', en: 'Rice after rice after rice wears the soil out. Think about lentil or mustard next Rabi.' }
      : { bn: 'আগামী রবিতে অন্য গোত্রের কোনো ফসল ভেবে দেখুন।', en: 'Next Rabi, think about a crop from a different family.' };
  return {
    current, sowT, weights: w,
    best: feasible[0] ?? null,
    alternatives: feasible.slice(1, 3),
    closed: options.filter((o) => !o.fits),
    directAman: feasible.length === 0,
    nextRabiCaution,
  };
}

export { RABI_CROPS };
