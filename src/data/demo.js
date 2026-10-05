// DEMO data generator (seeded, deterministic). Every value here is synthetic and labelled "Demo" in the UI.
// Union names are real Godagari unions; their positions below are APPROXIMATE demo positions.
import { ymd, addDays } from '../engine/dates.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_TODAY = ymd(2027, 1, 12); // the in-season "today" used by the demo

export const UNIONS = [
  { id: 'Deopara', en: 'Deopara', bn: 'দেওপাড়া', lat: 24.445, lon: 88.430, n: 50,
    mix: { tomato: 0.58, boro: 0.22, wheat: 0.08, lentil: 0.05, mustard: 0.07 } },
  { id: 'Pakri', en: 'Pakri', bn: 'পাকড়ী', lat: 24.545, lon: 88.285, n: 40,
    mix: { tomato: 0.55, boro: 0.25, wheat: 0.08, lentil: 0.04, mustard: 0.08 } },
  { id: 'Rishikul', en: 'Rishikul', bn: 'ঋষিকুল', lat: 24.560, lon: 88.380, n: 40,
    mix: { tomato: 0.30, boro: 0.40, wheat: 0.12, lentil: 0.06, mustard: 0.12 } },
  { id: 'Char Ashariadaha', en: 'Char Ashariadaha', bn: 'চর আষাড়িয়াদহ', lat: 24.395, lon: 88.275, n: 30,
    mix: { tomato: 0.25, boro: 0.10, wheat: 0.20, lentil: 0.30, mustard: 0.15 } },
];

const VILLAGES = [
  { en: 'Purbapara', bn: 'পূর্বপাড়া', dx: 0.012, dy: 0.000 },
  { en: 'Madhyapara', bn: 'মধ্যপাড়া', dx: 0.000, dy: 0.000 },
  { en: 'Paschimpara', bn: 'পশ্চিমপাড়া', dx: -0.014, dy: 0.004 },
  { en: 'Uttarpara', bn: 'উত্তরপাড়া', dx: 0.003, dy: 0.014 },
  { en: 'Dakshinpara', bn: 'দক্ষিণপাড়া', dx: -0.004, dy: -0.013 },
];

const FIRST = [['Karim', 'করিম'], ['Jamal', 'জামাল'], ['Rafiq', 'রফিক'], ['Shafiq', 'শফিক'], ['Aminul', 'আমিনুল'], ['Monir', 'মনির'], ['Sohel', 'সোহেল'], ['Habib', 'হাবিব'], ['Nurul', 'নুরুল'], ['Kamal', 'কামাল'], ['Selina', 'সেলিনা'], ['Rokeya', 'রোকেয়া'], ['Aklima', 'আকলিমা'], ['Mizan', 'মিজান'], ['Babul', 'বাবুল'], ['Jalal', 'জালাল'], ['Shahida', 'শাহিদা'], ['Tofazzal', 'তোফাজ্জল'], ['Anwar', 'আনোয়ার'], ['Rashida', 'রাশিদা']];
const LAST = [['Islam', 'ইসলাম'], ['Hossain', 'হোসেন'], ['Uddin', 'উদ্দিন'], ['Mia', 'মিয়া'], ['Sarkar', 'সরকার'], ['Mondal', 'মণ্ডল'], ['Pramanik', 'প্রামানিক'], ['Begum', 'বেগম'], ['Ali', 'আলী'], ['Sheikh', 'শেখ']];

const NORMAL = { boro: [1, 15, false], tomato: [11, 15, true], wheat: [11, 20, true], lentil: [11, 5, true], mustard: [11, 1, true] };

function pick(r, mix) {
  let x = r();
  for (const [k, p] of Object.entries(mix)) { if ((x -= p) < 0) return k; }
  return Object.keys(mix)[0];
}

const CLUSTER_TEXTS = [
  { bn: 'টমেটোর নিচের পাতায় বাদামি দাগ, চারপাশটা হলুদ হয়ে যাচ্ছে', en: 'Brown spots with yellow edges on the lower tomato leaves' },
  { bn: 'পাতায় গোল গোল দাগ, দাগের ভেতর আংটির মতো দাগ', en: 'Round spots on the leaves with rings inside them' },
  { bn: 'নিচের দিকের পাতা শুকিয়ে ঝরে পড়ছে', en: 'The lower leaves are drying up and falling off' },
  { bn: 'দুই দিনে দাগ অনেক বেড়ে গেছে, পাশের জমিতেও দেখছি', en: 'The spots have spread fast in two days, and I see them next door too' },
];

export function buildDemo() {
  const r = rng(360);
  const farmers = [], plans = [];
  let id = 1;
  for (const u of UNIONS) {
    for (let i = 0; i < u.n; i++) {
      const v = VILLAGES[Math.floor(r() * VILLAGES.length)];
      const f = FIRST[Math.floor(r() * FIRST.length)], l = LAST[Math.floor(r() * LAST.length)];
      const fid = `F${String(id++).padStart(3, '0')}`;
      const irr = r() < 0.55 ? 'dtw' : r() < 0.6 ? 'stw' : 'none';
      const farmer = {
        id: fid, name: { en: `${f[0]} ${l[0]}`, bn: `${f[1]} ${l[1]}` }, union: u.id,
        village: v.en, villageBn: v.bn,
        lat: u.lat + v.dy + (r() - 0.5) * 0.010, lon: u.lon + v.dx + (r() - 0.5) * 0.012,
        area_dec: Math.round(10 + r() * 90), last_crop: r() < 0.6 ? 'boro' : r() < 0.5 ? 'tomato' : 'wheat', irrigation: irr,
      };
      farmers.push(farmer);
      const crop = pick(r, u.mix);
      const [m, d, prev] = NORMAL[crop];
      let date = ymd(prev ? 2026 : 2027, m, d);
      // tomato transplanting bunches around mid-November in practice
      const spread = crop === 'tomato' ? Math.round((r() + r() + r() - 1.5) * 9) : Math.round((r() - 0.5) * 14);
      date = addDays(date, spread);
      plans.push({ plot_id: fid, crop, date, area_dec: farmer.area_dec, union: u.id });
    }
  }
  // Hero farmers (fixed)
  const heroes = [
    { id: 'RAHIM', name: { en: 'Rahim Uddin', bn: 'রহিম উদ্দিন' }, union: 'Deopara', village: 'Purbapara', villageBn: 'পূর্বপাড়া',
      lat: 24.4462, lon: 88.4415, area_dec: 33, last_crop: 'boro', irrigation: 'dtw', hero: true },
    { id: 'SELINA', name: { en: 'Selina Begum', bn: 'সেলিনা বেগম' }, union: 'Char Ashariadaha', village: 'Madhyapara', villageBn: 'মধ্যপাড়া',
      lat: 24.3962, lon: 88.2745, area_dec: 50, last_crop: 'tomato', irrigation: 'none', hero: true },
    { id: 'JALAL', name: { en: 'Jalal Pramanik', bn: 'জালাল প্রামানিক' }, union: 'Rishikul', village: 'Uttarpara', villageBn: 'উত্তরপাড়া',
      lat: 24.5735, lon: 88.3830, area_dec: 66, last_crop: 'boro', irrigation: 'stw', hero: true },
  ];
  farmers.unshift(...heroes);

  // Help requests: 8 seeded leaf-spot reports in two neighbouring Deopara villages + scattered others
  const requests = [];
  const deo = farmers.filter((f) => f.union === 'Deopara' && !f.hero && (f.village === 'Purbapara' || f.village === 'Madhyapara'));
  const tomatoDeo = deo.filter((f) => plans.find((p) => p.plot_id === f.id)?.crop === 'tomato').slice(0, 8);
  tomatoDeo.forEach((f, i) => requests.push({
    id: `R${100 + i}`, farmerId: f.id, union: f.union, village: f.village, villageBn: f.villageBn, lat: f.lat, lon: f.lon,
    crop: 'tomato', symptom: 'leaf_spot', type: 'crop_doctor',
    text: CLUSTER_TEXTS[i % CLUSTER_TEXTS.length],
    ai: [{ k: 'early_blight', p: 0.58 + (i % 3) * 0.05 }, { k: 'septoria', p: 0.18 }, { k: 'unclear', p: 0.12 }],
    created: addDays(DEMO_TODAY, -(i % 6)), status: 'open', priority: 'Medium', demo: true,
  }));
  const others = farmers.filter((f) => !f.hero && !tomatoDeo.includes(f));
  const misc = [
    { symptom: 'aphid', crop: 'mustard', text: { bn: 'সরিষার ডগায় জাব পোকা ভরে গেছে, কী করব?', en: 'The mustard tips are covered in aphids. What should I do?' }, pr: 'Low' },
    { symptom: 'water', crop: 'boro', text: { bn: 'গভীর নলকূপের পানি পালামতো পাচ্ছি না, জমি ফেটে যাচ্ছে', en: 'I am not getting my turn on the deep tube well and the field is cracking' }, pr: 'High' },
    { symptom: 'question', crop: 'wheat', text: { bn: 'গমে শেষ সেচটা কবে দেব?', en: 'When should I give the wheat its last watering?' }, pr: 'Low' },
    { symptom: 'leaf_spot', crop: 'tomato', text: { bn: 'টমেটোর পাতায় কালচে দাগ পড়ছে', en: 'Dark spots are appearing on the tomato leaves' }, pr: 'Medium' },
    { symptom: 'wilt', crop: 'tomato', text: { bn: 'কয়েকটা টমেটো গাছ হঠাৎ নেতিয়ে পড়ছে', en: 'A few tomato plants have suddenly gone limp' }, pr: 'High' },
    { symptom: 'question', crop: 'lentil', text: { bn: 'মসুরে কোন সার কতটুকু দেব?', en: 'Which fertiliser should I give the lentil, and how much?' }, pr: 'Low' },
  ];
  misc.forEach((m, i) => {
    const f = others.filter((o) => o.union !== 'Deopara')[i * 13 % 90];
    requests.push({ id: `R${200 + i}`, farmerId: f.id, union: f.union, village: f.village, villageBn: f.villageBn, lat: f.lat, lon: f.lon,
      crop: m.crop, symptom: m.symptom, type: 'question', text: m.text, ai: null, created: addDays(DEMO_TODAY, -i), status: 'open', priority: m.pr, demo: true });
  });

  return { unions: UNIONS, farmers, plans, requests };
}

export const SYMPTOMS = {
  leaf_spot: { bn: 'পাতায় দাগ', en: 'Spots on leaves' },
  aphid: { bn: 'জাব পোকা', en: 'Aphids' },
  water: { bn: 'সেচের সমস্যা', en: 'Water problem' },
  question: { bn: 'পরামর্শ চাই', en: 'Asking for advice' },
  wilt: { bn: 'গাছ নেতিয়ে পড়া', en: 'Plants wilting' },
};
export const DISEASES = {
  early_blight: { bn: 'আগাম ধসা (আর্লি ব্লাইট) হতে পারে', en: 'Could be early blight' },
  septoria: { bn: 'পাতার ছোট দাগ রোগ (সেপটোরিয়া) হতে পারে', en: 'Could be Septoria leaf spot' },
  unclear: { bn: 'বোঝা যাচ্ছে না, অন্য কিছুও হতে পারে', en: 'Not clear, could be something else' },
  alternaria: { bn: 'পাতা ঝলসানো (অল্টারনারিয়া) হতে পারে', en: 'Could be Alternaria blight' },
  nutrient: { bn: 'সারের ঘাটতি হতে পারে', en: 'Could be a nutrient shortage' },
  pest: { bn: 'পোকার আক্রমণ হতে পারে', en: 'Could be pest damage' },
};

// Demo officer accounts (fictional people)
export const OFFICERS = {
  saao: {
    Deopara: { bn: 'নাসরিন আক্তার', en: 'Nasrin Akter' },
    Pakri: { bn: 'মাহফুজুর রহমান', en: 'Mahfuzur Rahman' },
    Rishikul: { bn: 'শাহীনুর ইসলাম', en: 'Shahinur Islam' },
    'Char Ashariadaha': { bn: 'আব্দুল কাদের', en: 'Abdul Kader' },
  },
  uao: { bn: 'মোঃ হাসান আলী', en: 'Md. Hasan Ali' },
};

// Godagari demo area. Used to keep the land picker inside the upazila.
export const GODAGARI = { center: [24.4667, 88.3306], bounds: [[24.36, 88.18], [24.62, 88.50]] };

// Searchable places for the land picker: union centres and the demo villages inside them (positions approximate).
export const PLACES = [
  { id: 'godagari', bn: 'গোদাগাড়ী উপজেলা সদর', en: 'Godagari upazila centre', lat: 24.4667, lon: 88.3306, kind: 'upazila' },
  ...UNIONS.flatMap((u) => [
    { id: `u-${u.id}`, bn: `${u.bn} ইউনিয়ন`, en: `${u.en} union`, lat: u.lat, lon: u.lon, kind: 'union', union: u.id },
    ...VILLAGES.map((v) => ({ id: `v-${u.id}-${v.en}`, bn: `${v.bn}, ${u.bn}`, en: `${v.en}, ${u.en}`, lat: u.lat + v.dy, lon: u.lon + v.dx, kind: 'village', union: u.id, village: v.en, villageBn: v.bn })),
  ]),
];
