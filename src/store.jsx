// App-wide state: the selected farmer, their field, choices, requests and officer actions.
// All data is local demo data. Each "service" this store calls (weather, places, the engine) is a plain function,
// so swapping in a backend later means replacing those calls, not the components.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import climJson from './data/climate_godagari.json';
import soilJson from './data/soil_godagari.json';
import { buildDemo, DEMO_TODAY } from './data/demo.js';
import { makeClimate, timeMachine } from './engine/climate.js';
import { makeUnion } from './engine/world.js';
import { decide } from './engine/decision.js';
import { recommendRotation } from './engine/rotation.js';
import { fetchLiveWeather, waterAdvice, cropStage, DEMO_SCENARIOS } from './engine/water.js';
import { findHotspots } from './engine/cluster.js';
import { addDays, daysBetween } from './engine/dates.js';
import { STORAGE_PREFIX } from './config/brand.js';

export const clim = makeClimate(climJson);
export const soilData = soilJson;
export const demo = buildDemo();
export const tm = timeMachine(clim);

const Ctx = createContext(null);

// ---- saved demo state (per browser; safe to lose) ----
const STATE_KEY = `${STORAGE_PREFIX}.demo.v2`;
const LANG_KEY = `${STORAGE_PREFIX}.lang`;
const SAVED_KEYS = ['farmerId', 'priorities', 'pick', 'confirmed', 'fields', 'requests', 'advisories', 'escalations', 'seenAdvisories', 'officerUnion', 'step', 'fieldCheck', 'scenario', 'harvests'];
const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const savedLang = () => { try { return localStorage.getItem(LANG_KEY) || 'bn'; } catch { return 'bn'; } };

const fresh = () => ({
  lang: savedLang(),
  step: 0, // season planner step
  farmerId: 'RAHIM',
  fields: {}, // farmerId -> { lat, lon, union, village, villageBn, area_dec, last_crop, irrigation, confirmed }
  priorities: [],
  pick: null, // {crop, shift} chosen by the farmer; null = follow the recommendation
  confirmed: [], // plans confirmed by demo farmers -> added to union supply
  harvests: {}, // farmerId -> { qty, price }
  fieldCheck: null,
  weatherMode: 'demo',
  scenario: 'dry',
  live: null,
  daysAfter: null,
  requests: demo.requests,
  advisories: [], // {id, text, to:[farmerIds], at, cluster?, request?, upazila?}
  escalations: [],
  seenAdvisories: 0,
  officerUnion: 'Deopara',
  why: null,
  dataInfo: false,
  toast: null,
});

function initial() {
  const base = fresh();
  const saved = readJSON(STATE_KEY);
  if (!saved) return base;
  for (const k of SAVED_KEYS) if (saved[k] !== undefined) base[k] = saved[k];
  return base;
}

function reducer(s, a) {
  switch (a.type) {
    case 'set': return { ...s, ...a.patch };
    case 'togglePriority': {
      const has = s.priorities.includes(a.id);
      let p = has ? s.priorities.filter((x) => x !== a.id) : [...s.priorities, a.id];
      if (p.length > 2) p = p.slice(-2);
      return { ...s, priorities: p, pick: null };
    }
    case 'chooseFarmer': return { ...s, farmerId: a.id, step: 0, pick: null, priorities: [], fieldCheck: null, daysAfter: null, seenAdvisories: 0 };
    case 'confirmPlan': return { ...s, confirmed: s.confirmed.filter((p) => p.plot_id !== a.plan.plot_id).concat(a.plan) };
    case 'setField': {
      // Saving the land also moves an already-confirmed plan to the new union/area.
      const f = a.field;
      const confirmed = s.confirmed.map((p) => (p.plot_id === a.id ? { ...p, union: f.union, area_dec: f.area_dec } : p));
      return { ...s, fields: { ...s.fields, [a.id]: { ...f, confirmed: true } }, confirmed, pick: null };
    }
    case 'addRequest': return { ...s, requests: [a.req, ...s.requests.filter((r) => r.id !== a.req.id)] };
    case 'updateRequest': return { ...s, requests: s.requests.map((r) => (a.ids.includes(r.id) ? { ...r, ...a.patch } : r)) };
    case 'addAdvisory': return { ...s, advisories: [a.adv, ...s.advisories.filter((x) => x.id !== a.adv.id)] };
    case 'escalate': return { ...s, escalations: [a.esc, ...s.escalations.filter((e) => e.id !== a.esc.id)] };
    case 'recordHarvest': return { ...s, harvests: { ...s.harvests, [a.id]: a.value } };
    case 'toast': return { ...s, toast: a.toast ? { ...a.toast, at: Date.now() } : null };
    case 'reset': return { ...fresh(), lang: s.lang, live: s.live, toast: { bn: 'নমুনা তথ্য শুরুর অবস্থায় ফেরানো হয়েছে', en: 'Demo data reset to the start', at: Date.now() } };
    default: return s;
  }
}

export function StoreProvider({ children }) {
  const [s, dispatch] = useReducer(reducer, undefined, initial);

  // Save the demo state (photos are dropped to stay within browser storage limits).
  useEffect(() => {
    const out = {};
    for (const k of SAVED_KEYS) out[k] = s[k];
    out.requests = s.requests.map((r) => (r.image && r.image.length > 150000 ? { ...r, image: null, imageDropped: true } : r));
    try { localStorage.setItem(STATE_KEY, JSON.stringify(out)); } catch { /* storage full or blocked: keep going without saving */ }
  }, [s]);
  useEffect(() => { try { localStorage.setItem(LANG_KEY, s.lang); } catch { /* storage unavailable */ } document.documentElement.lang = s.lang; }, [s.lang]);
  useEffect(() => {
    if (!s.toast) return undefined;
    const t = setTimeout(() => dispatch({ type: 'toast', toast: null }), 3400);
    return () => clearTimeout(t);
  }, [s.toast]);

  // Demo farmers with any land the user has marked on the map applied on top.
  const farmers = useMemo(() => demo.farmers.map((f) => (s.fields[f.id] ? { ...f, ...s.fields[f.id] } : f)), [s.fields]);
  const farmerById = useMemo(() => new Map(farmers.map((f) => [f.id, f])), [farmers]);
  const world = useMemo(() => ({ ...demo, farmers }), [farmers]);
  const farmer = farmerById.get(s.farmerId) ?? farmers[0];
  const soil = soilData.unions[farmer.union];

  const unions = useMemo(() => Object.fromEntries(demo.unions.map((u) => [u.id, makeUnion(clim, world, u.id, s.confirmed.filter((p) => p.plot_id !== s.farmerId))])), [world, s.confirmed, s.farmerId]);
  const unionsAll = useMemo(() => Object.fromEntries(demo.unions.map((u) => [u.id, makeUnion(clim, world, u.id, s.confirmed)])), [world, s.confirmed]);
  const union = unions[farmer.union];
  const decision = useMemo(() => decide({ clim, soil, plot: farmer, union, priorities: s.priorities }), [farmer, soil, union, s.priorities]);
  const chosen = useMemo(() => {
    if (!s.pick) return decision.rec;
    return decision.all.find((r) => r.crop.id === s.pick.crop && r.shift === s.pick.shift) ?? decision.rec;
  }, [decision, s.pick]);
  const rotation = useMemo(() => recommendRotation({ clim, soil, plot: farmer, chosen, priorities: s.priorities }), [farmer, soil, chosen, s.priorities]);
  const hotspots = useMemo(() => findHotspots(s.requests), [s.requests]);

  useEffect(() => {
    let alive = true;
    fetchLiveWeather(farmer.lat, farmer.lon).then((w) => { if (alive && w) dispatch({ type: 'set', patch: { live: w } }); });
    return () => { alive = false; };
  }, [farmer.lat, farmer.lon]);

  const autoDays = daysBetween(chosen.t0, DEMO_TODAY);
  const daysAfter = s.daysAfter ?? (autoDays > 0 ? autoDays : 30);
  const live = s.weatherMode === 'live' && s.live;
  const weather = live ? s.live : DEMO_SCENARIOS[s.scenario];
  const stage = cropStage(chosen.crop, daysAfter);
  const water = waterAdvice({ crop: chosen.crop, stage, rain7: weather.rain7, rainNext3: weather.rainNext3, tmax: weather.tmax, fieldCheck: s.fieldCheck });
  const myAdvisories = s.advisories.filter((a) => a.to.includes(farmer.id));
  const confirmedPlan = s.confirmed.find((p) => p.plot_id === farmer.id) ?? null;
  const landConfirmed = !!s.fields[farmer.id]?.confirmed;

  const T = useCallback((bn, en) => (s.lang === 'bn' ? bn : en), [s.lang]);
  const L = useCallback((o) => (o ? (s.lang === 'bn' ? o.bn : o.en) : ''), [s.lang]);
  const toast = useCallback((bn, en) => dispatch({ type: 'toast', toast: { bn, en } }), []);
  const farmerOf = useCallback((id) => farmerById.get(id), [farmerById]);

  const value = {
    s, dispatch, T, L, toast, farmer, farmers, farmerOf, soil, union, unions, unionsAll, decision, chosen, rotation, hotspots,
    today: DEMO_TODAY, daysAfter, demoNow: addDays(chosen.t0, daysAfter), weather, liveWeather: !!live, stage, water,
    myAdvisories, unreadAdvisories: Math.max(0, myAdvisories.length - s.seenAdvisories), confirmedPlan, landConfirmed,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
