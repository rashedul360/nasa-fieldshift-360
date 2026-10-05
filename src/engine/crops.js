// Crop knowledge table [RULE]. Thresholds are STARTING VALUES from general agronomy;
// they must be checked by an agronomist / SAAO before the final demo.
// Yield, price and cost ranges are [DEMO] planning values.
//
// Fail rule types (offsets are days after planting/transplanting):
//   count: number of days with `v` >= thr in [from,to] must be < min  (else unsafe)
//   any:   any day with `v` >= thr in [from,to] makes the season unsafe
//   total_below: total of `v` in [from,to] below thr makes the season unsafe

export const BIGHA_HA = 0.1336; // 1 bigha = 33 decimal ≈ 0.1336 ha
export const DECIMAL_HA = 0.004047;
export const MAUND_KG = 37.32;

export const WATER_CLASS = { High: 3, Medium: 2, 'Low-Medium': 1.5, Low: 1 };

export const RABI_CROPS = {
  boro: {
    id: 'boro', family: 'Poaceae', familyBn: 'ধান-গম গোত্র', familyEn: 'Grass family',
    name: { bn: 'বোরো ধান', en: 'Boro rice' }, action: { bn: 'চারা রোপণ', en: 'Transplant' },
    plant: { m: 1, d: 15, prevYear: false }, days: 115, water: 'High', ph: [5.0, 7.0],
    wellDrained: false, heavyFeeder: true, legume: false,
    gddBase: 10, harvestWeeks: [0.6, 0.4],
    yieldTHa: [4.0, 5.5], priceTk: [30, 34], costPerBigha: [14000, 17000], // DEMO
    rules: [
      { id: 'boro_heat', type: 'count', v: 'tmax', thr: 35, from: 75, to: 95, min: 3,
        bn: 'ফুল আসার সময় (রোপণের ৭৫–৯৫ দিনে) তিন দিন বা তার বেশি ৩৫° সেলসিয়াসের ওপরে গরম পড়লে ধানে চিটা হয়',
        en: 'Three or more days at 35 °C or above during flowering (days 75–95) cause empty grains' },
    ],
  },
  tomato: {
    id: 'tomato', family: 'Solanaceae', familyBn: 'বেগুন-টমেটো গোত্র', familyEn: 'Nightshade family',
    name: { bn: 'টমেটো', en: 'Tomato' }, action: { bn: 'চারা লাগানো', en: 'Transplant' },
    plant: { m: 11, d: 15, prevYear: true }, days: 80, water: 'Medium', ph: [6.0, 7.0],
    wellDrained: true, heavyFeeder: true, legume: false,
    gddBase: 10, harvestWeeks: [0.10, 0.20, 0.25, 0.20, 0.15, 0.10],
    yieldTHa: [25, 40], priceTk: [8, 25], costPerBigha: [35000, 45000], // DEMO
    rules: [
      { id: 'tom_rain', type: 'any', v: 'prec', thr: 50, from: 0, to: 15,
        bn: 'চারা লাগানোর প্রথম ১৫ দিনে এক দিনে ৫০ মিলিমিটারের বেশি বৃষ্টি হলে চারা পচে যেতে পারে',
        en: 'A single day of 50 mm or more rain in the first 15 days can rot the seedlings' },
      { id: 'tom_heat', type: 'count', v: 'tmax', thr: 32, from: 40, to: 95, min: 5,
        bn: 'ফল ধরার সময় (৪০–৯৫ দিনে) পাঁচ দিন বা তার বেশি ৩২° সেলসিয়াসের ওপরে গরম হলে ফুল ঝরে, ফল কম ধরে',
        en: 'Five or more days at 32 °C or above while fruit sets (days 40–95) make flowers drop' },
    ],
  },
  wheat: {
    id: 'wheat', family: 'Poaceae', familyBn: 'ধান-গম গোত্র', familyEn: 'Grass family',
    name: { bn: 'গম', en: 'Wheat' }, action: { bn: 'বীজ বোনা', en: 'Sow' },
    plant: { m: 11, d: 20, prevYear: true }, days: 115, water: 'Low-Medium', ph: [6.0, 7.5],
    wellDrained: true, heavyFeeder: false, legume: false,
    gddBase: 0, harvestWeeks: [0.6, 0.4],
    yieldTHa: [3.0, 3.8], priceTk: [34, 40], costPerBigha: [9000, 11000], // DEMO
    rules: [
      { id: 'wht_heat', type: 'count', v: 'tmax', thr: 32, from: 85, to: 115, min: 5,
        bn: 'দানা পুষ্ট হওয়ার সময় (৮৫–১১৫ দিনে) পাঁচ দিন বা তার বেশি ৩২° সেলসিয়াসের ওপরে গরম হলে দানা চুপসে যায়',
        en: 'Five or more days at 32 °C or above while grain fills (days 85–115) shrivel the grain' },
    ],
  },
  lentil: {
    id: 'lentil', family: 'Fabaceae', familyBn: 'ডাল-শিম গোত্র', familyEn: 'Legume family',
    name: { bn: 'মসুর ডাল', en: 'Lentil' }, action: { bn: 'বীজ বোনা', en: 'Sow' },
    plant: { m: 11, d: 5, prevYear: true }, days: 105, water: 'Low', ph: [6.0, 8.0],
    wellDrained: true, heavyFeeder: false, legume: true,
    gddBase: 0, harvestWeeks: [0.6, 0.4],
    yieldTHa: [1.1, 1.5], priceTk: [90, 110], costPerBigha: [7000, 9000], // DEMO
    rules: [
      { id: 'len_rain1', type: 'any', v: 'prec', thr: 40, from: 55, to: 85,
        bn: 'ফুল আসার সময় (৫৫–৮৫ দিনে) এক দিনে ৪০ মিলিমিটারের বেশি বৃষ্টি হলে ফুল ঝরে যায়',
        en: 'A single day of 40 mm or more rain at flowering (days 55–85) knocks the flowers off' },
      { id: 'len_rain4', type: 'count', v: 'prec', thr: 5, from: 55, to: 85, min: 4,
        bn: 'ফুল আসার সময় চার দিন বা তার বেশি বৃষ্টি হলে পাতা ঝলসানো (স্টেমফাইলিয়াম) রোগ ধরে',
        en: 'Four or more rainy days at flowering bring Stemphylium blight' },
    ],
  },
  mustard: {
    id: 'mustard', family: 'Brassicaceae', familyBn: 'সরিষা-কপি গোত্র', familyEn: 'Mustard family',
    name: { bn: 'সরিষা', en: 'Mustard' }, action: { bn: 'বীজ বোনা', en: 'Sow' },
    plant: { m: 11, d: 1, prevYear: true }, days: 85, water: 'Low', ph: [5.5, 7.5],
    wellDrained: true, heavyFeeder: false, legume: false,
    gddBase: 0, harvestWeeks: [0.6, 0.4],
    yieldTHa: [1.2, 1.6], priceTk: [70, 85], costPerBigha: [7000, 8500], // DEMO
    rules: [
      { id: 'mus_rain', type: 'any', v: 'prec', thr: 30, from: 35, to: 55,
        bn: 'ফুল আসার সময় (৩৫–৫৫ দিনে) এক দিনে ৩০ মিলিমিটারের বেশি বৃষ্টি হলে ফুল ও ফল নষ্ট হয়',
        en: 'A single day of 30 mm or more rain at flowering (days 35–55) damages flowers and pods' },
    ],
  },
};

// Next-season (Kharif-1) options for the rotation recommendation [RULE]
export const ROTATION_CROPS = {
  mungbean: {
    id: 'mungbean', family: 'Fabaceae', name: { bn: 'মুগ ডাল', en: 'Mungbean' }, days: 65, water: 'Low',
    soilBenefit: 100, latestSow: { m: 4, d: 10 },
    benefit: { bn: 'শিকড়ের গুটি মাটিতে নাইট্রোজেন দেয়; শুঁটি তোলার পর গাছ চাষ দিয়ে মিশিয়ে দিলে মাটির জৈব পদার্থ বাড়ে', en: 'Root nodules add nitrogen; ploughing the plants back in after picking builds organic matter' },
    rules: [{ id: 'mung_rain', type: 'any', v: 'prec', thr: 40, from: 50, to: 65,
      bn: 'শুঁটি পাকার সময় (৫০–৬৫ দিনে) এক দিনে ৪০ মিলিমিটারের বেশি বৃষ্টি হলে শুঁটি পচে যায়', en: 'A single day of 40 mm or more rain while pods ripen (days 50–65) rots them' }],
  },
  sesame: {
    id: 'sesame', family: 'Pedaliaceae', name: { bn: 'তিল', en: 'Sesame' }, days: 85, water: 'Low',
    soilBenefit: 50, latestSow: { m: 4, d: 15 },
    benefit: { bn: 'সেচ প্রায় লাগে না; আলাদা গোত্রের ফসল বলে আগের ফসলের রোগ-পোকা টিকে থাকতে পারে না', en: 'Needs almost no irrigation; a different crop family breaks the pest and disease cycle' },
    rules: [{ id: 'ses_rain', type: 'any', v: 'prec', thr: 50, from: 0, to: 30,
      bn: 'বোনার প্রথম ৩০ দিনে এক দিনে ৫০ মিলিমিটারের বেশি বৃষ্টিতে জমিতে পানি জমে চারা মরে', en: 'A single day of 50 mm or more rain in the first 30 days waterlogs the seedlings' }],
  },
  jute: {
    id: 'jute', family: 'Malvaceae', name: { bn: 'পাট', en: 'Jute' }, days: 110, water: 'Medium',
    soilBenefit: 60, latestSow: { m: 4, d: 30 },
    benefit: { bn: 'ঝরে পড়া পাতা পচে মাটিতে জৈব সার হয়', en: 'Fallen leaves rot into the soil as organic matter' },
    rules: [{ id: 'jute_dry', type: 'total_below', v: 'prec', thr: 50, from: 0, to: 30,
      bn: 'বোনার পর প্রথম ৩০ দিনে মোট বৃষ্টি ৫০ মিলিমিটারের কম হলে সেচ দিতে হয়', en: 'Less than 50 mm of rain in the first 30 days means it needs irrigating' }],
  },
  aus: {
    id: 'aus', family: 'Poaceae', name: { bn: 'আউশ ধান', en: 'Aus rice' }, days: 100, water: 'Medium',
    soilBenefit: 30, latestSow: { m: 4, d: 30 },
    benefit: { bn: 'চেনা ফসল, তবে ধানের পর আবার ধান হলে মাটির তেমন উপকার হয় না', en: 'A familiar crop, but rice after rice does little for the soil' },
    rules: [],
  },
};

export const IRRIGATION = {
  dtw: { bn: 'গভীর নলকূপ', en: 'Deep tube well', penalty: { High: 40, Medium: 15, 'Low-Medium': 8, Low: 0 } },
  stw: { bn: 'অগভীর নলকূপ', en: 'Shallow tube well', penalty: { High: 60, Medium: 25, 'Low-Medium': 15, Low: 5 } },
  none: { bn: 'পুকুর বা সেচ নেই', en: 'Pond / no irrigation', penalty: { High: 90, Medium: 50, 'Low-Medium': 30, Low: 10 } },
};

export const cropName = (id, lang) => (RABI_CROPS[id] || ROTATION_CROPS[id])?.name[lang] ?? id;
