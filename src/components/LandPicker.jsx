// Interactive land selection: search a village, tap the map or drag the pin onto your field,
// set the size, last crop and water source, then confirm. Everything downstream (union, soil,
// recommendation, glut check, officer map) follows the confirmed location. Demo data only.
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polygon, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, LocateFixed, Crosshair, Satellite, Map as MapIcon, CheckCircle2, RotateCcw, MapPin, X } from 'lucide-react';
import { useStore, demo, soilData } from '../store';
import { Button, Note, Tags } from './ui';
import { BASEMAPS } from './MapView';
import { GODAGARI, PLACES } from '../data/demo';
import { locate, insideBounds, plotSquare, distanceKm } from '../engine/world';
import { IRRIGATION, RABI_CROPS, cropName } from '../engine/crops';
import { num } from '../engine/dates';

const pinIcon = L.divIcon({
  className: 'fs-pin',
  html: '<svg width="34" height="46" viewBox="0 0 34 46"><path d="M17 1C8.2 1 1 8 1 16.8 1 28.5 17 45 17 45s16-16.5 16-28.2C33 8 25.8 1 17 1Z" fill="#d08f26" stroke="#fff" stroke-width="2"/><circle cx="17" cy="16.5" r="6" fill="#fff"/></svg>',
  iconSize: [34, 46],
  iconAnchor: [17, 45],
});

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lon: e.latlng.lng }) });
  return null;
}
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.lat, target.lon], target.zoom ?? 16, { duration: 0.8 }); }, [target, map]);
  return null;
}
function CenterGrabber({ grabRef }) {
  const map = useMap();
  useEffect(() => { grabRef.current = () => map.getCenter(); }, [map, grabRef]);
  return null;
}

const AREA_PRESETS = [10, 33, 66, 100];
const parseCoords = (q) => {
  const m = q.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  return m ? { lat: +m[1], lon: +m[2] } : null;
};

export default function LandPicker({ height = 420, onDone, compact = false }) {
  const { s, dispatch, T, L: tr, toast, farmer, farmers, landConfirmed } = useStore();
  const lang = s.lang;
  const saved = { lat: farmer.lat, lon: farmer.lon };
  const [pos, setPos] = useState(saved);
  const [area, setArea] = useState(farmer.area_dec);
  const [lastCrop, setLastCrop] = useState(farmer.last_crop);
  const [irrigation, setIrrigation] = useState(farmer.irrigation);
  const [basemap, setBasemap] = useState('satellite');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [fly, setFly] = useState(null);
  const [msg, setMsg] = useState(null);
  const grabCenter = useRef(null);

  // Switching farmer resets the picker to that farmer's saved land.
  useEffect(() => {
    setPos({ lat: farmer.lat, lon: farmer.lon }); setArea(farmer.area_dec); setLastCrop(farmer.last_crop); setIrrigation(farmer.irrigation);
    setFly({ lat: farmer.lat, lon: farmer.lon, zoom: 16 }); setMsg(null);
  }, [farmer.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const inside = insideBounds(pos.lat, pos.lon, GODAGARI.bounds);
  const where = useMemo(() => locate(pos.lat, pos.lon, PLACES), [pos]);
  const unionMeta = demo.unions.find((u) => u.id === where?.union);
  const soil = soilData.unions[where?.union];
  const moved = distanceKm(saved, pos) > 0.005;
  const dirty = moved || area !== farmer.area_dec || lastCrop !== farmer.last_crop || irrigation !== farmer.irrigation;
  const square = useMemo(() => plotSquare(pos.lat, pos.lon, Math.max(1, Number(area) || 1)), [pos, area]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const c = parseCoords(q);
    if (c) return [{ id: 'coords', bn: `স্থানাঙ্ক ${q}`, en: `Coordinates ${q}`, lat: c.lat, lon: c.lon, kind: 'coords' }];
    const fromPlaces = PLACES.filter((p) => `${p.bn} ${p.en}`.toLowerCase().includes(q));
    const fromFarmers = farmers.filter((f) => f.hero && `${f.name.bn} ${f.name.en}`.toLowerCase().includes(q))
      .map((f) => ({ id: `f-${f.id}`, bn: `${f.name.bn}-এর জমি`, en: `${f.name.en}'s field`, lat: f.lat, lon: f.lon, kind: 'farm' }));
    return [...fromFarmers, ...fromPlaces].slice(0, 8);
  }, [query, farmers]);

  const place = (p, zoom) => {
    setPos({ lat: p.lat, lon: p.lon });
    setMsg(insideBounds(p.lat, p.lon, GODAGARI.bounds) ? null : { tone: 'warn', bn: 'এই জায়গাটি গোদাগাড়ীর বাইরে। এই নমুনা সংস্করণে শুধু গোদাগাড়ীর জমি বাছাই করা যায়।', en: 'That spot is outside Godagari. This demo only covers land inside Godagari.' });
    if (zoom) setFly({ lat: p.lat, lon: p.lon, zoom });
  };
  const choose = (r) => { place(r, r.kind === 'union' ? 14 : 16); setQuery(tr(r)); setOpen(false); };
  const useMyLocation = () => {
    if (!navigator.geolocation) { setMsg({ tone: 'warn', bn: 'এই ব্রাউজারে অবস্থান জানা যাচ্ছে না। মানচিত্রে চাপ দিয়ে জমি দেখান।', en: 'This browser cannot share your location. Tap the map to mark your field instead.' }); return; }
    setMsg({ tone: 'info', bn: 'আপনার অবস্থান খোঁজা হচ্ছে…', en: 'Finding your location…' });
    navigator.geolocation.getCurrentPosition(
      (g) => place({ lat: g.coords.latitude, lon: g.coords.longitude }, 17),
      () => setMsg({ tone: 'warn', bn: 'অবস্থান পাওয়া গেল না। ফোনের লোকেশন চালু আছে কিনা দেখুন, অথবা মানচিত্রে চাপ দিয়ে জমি দেখান।', en: 'Could not get your location. Check that location is turned on, or tap the map to mark your field.' }),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  const pinToCentre = () => { const c = grabCenter.current?.(); if (c) place({ lat: c.lat, lon: c.lng }); };
  const undo = () => { setPos(saved); setArea(farmer.area_dec); setLastCrop(farmer.last_crop); setIrrigation(farmer.irrigation); setFly({ ...saved, zoom: 16 }); setMsg(null); };
  const confirm = () => {
    if (!inside || !where) return;
    dispatch({ type: 'setField', id: farmer.id, field: { lat: pos.lat, lon: pos.lon, union: where.union, village: where.village, villageBn: where.villageBn, area_dec: Math.max(1, Math.round(Number(area) || 1)), last_crop: lastCrop, irrigation } });
    toast('জমির অবস্থান সংরক্ষণ হয়েছে', 'Field location saved');
    onDone?.();
  };

  return (
    <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-[1.35fr_1fr]'}`}>
      <div className="min-w-0">
        <div className="relative">
          <label className="flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-3 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50">
            <Search size={18} className="shrink-0 text-muted" />
            <span className="sr-only">{T('গ্রাম, ইউনিয়ন বা স্থানাঙ্ক খুঁজুন', 'Search a village, union or coordinates')}</span>
            <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) { e.preventDefault(); choose(results[0]); } if (e.key === 'Escape') setOpen(false); }}
              className="h-full w-full bg-transparent text-[15px] outline-none" placeholder={T('গ্রাম বা ইউনিয়নের নাম লিখুন, যেমন দেওপাড়া', 'Type a village or union, e.g. Deopara')} role="combobox" aria-expanded={open && results.length > 0} aria-controls="land-search-results" />
            {query && <button type="button" onClick={() => { setQuery(''); setOpen(false); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-black/5" aria-label={T('মুছুন', 'Clear')}><X size={16} /></button>}
          </label>
          {open && query && (
            <ul id="land-search-results" role="listbox" className="absolute inset-x-0 top-[52px] z-[600] max-h-72 overflow-auto rounded-xl border border-border bg-white p-1 shadow-[var(--shadow-lift)]">
              {results.length === 0 && <li className="px-3 py-2.5 text-[14px] text-muted">{T('কিছু পাওয়া যায়নি। অন্য নাম লিখুন অথবা মানচিত্রে চাপ দিন।', 'Nothing found. Try another name or tap the map.')}</li>}
              {results.map((r) => (
                <li key={r.id} role="option" aria-selected="false">
                  <button type="button" onClick={() => choose(r)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-primary-50">
                    <MapPin size={16} className="shrink-0 text-primary-600" />
                    <span className="min-w-0 flex-1 truncate text-[14.5px]">{tr(r)}</span>
                    <span className="text-[12px] text-muted">{{ union: T('ইউনিয়ন', 'Union'), village: T('গ্রাম', 'Village'), farm: T('জমি', 'Field'), upazila: T('উপজেলা', 'Upazila'), coords: '' }[r.kind]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative mt-3 overflow-hidden rounded-2xl border border-black/10" style={{ height }}>
          <MapContainer center={[pos.lat, pos.lon]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} maxBounds={[[24.2, 88.0], [24.8, 88.7]]}>
            <TileLayer key={basemap} url={BASEMAPS[basemap].url} attribution={BASEMAPS[basemap].attribution} maxZoom={BASEMAPS[basemap].maxZoom} />
            <Rectangle bounds={GODAGARI.bounds} pathOptions={{ color: '#edc067', weight: 2, dashArray: '8 6', fill: false }} />
            <Polygon positions={square} pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#edc067', fillOpacity: 0.25 }} />
            <Marker position={[pos.lat, pos.lon]} icon={pinIcon} draggable keyboard title={T('আপনার জমি — টেনে সরান', 'Your field — drag to move')}
              eventHandlers={{ dragend: (e) => { const ll = e.target.getLatLng(); place({ lat: ll.lat, lon: ll.lng }); } }} />
            <ClickToPlace onPick={(p) => place(p)} />
            <FlyTo target={fly} />
            <CenterGrabber grabRef={grabCenter} />
          </MapContainer>
          <div className="pointer-events-none absolute right-2 top-2 z-[500] flex justify-end gap-2">
            <div className="pointer-events-auto flex rounded-xl bg-white/95 p-1 shadow-md">
              {[['satellite', Satellite, T('উপগ্রহ', 'Satellite')], ['map', MapIcon, T('মানচিত্র', 'Map')]].map(([k, Icon, l]) => (
                <button key={k} type="button" onClick={() => setBasemap(k)} aria-pressed={basemap === k} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ${basemap === k ? 'bg-primary-700 text-white' : 'text-ink hover:bg-primary-50'}`}><Icon size={15} />{l}</button>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-2 bottom-7 z-[500] flex flex-wrap justify-end gap-2">
            <button type="button" onClick={pinToCentre} className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-[13px] font-semibold shadow-md hover:bg-white"><Crosshair size={16} />{T('পিন মাঝখানে আনুন', 'Pin to centre')}</button>
            <button type="button" onClick={useMyLocation} className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-[13px] font-semibold shadow-md hover:bg-white"><LocateFixed size={16} />{T('আমার অবস্থান', 'My location')}</button>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-muted">{T('মানচিত্রে চাপ দিন অথবা হলুদ পিনটি টেনে আপনার জমির ওপর বসান। সাদা দাগের ঘর আপনার জমির আনুমানিক মাপ।', 'Tap the map or drag the yellow pin onto your field. The white square shows roughly how big your plot is.')}</p>
        {msg && <Note tone={msg.tone === 'warn' ? 'warn' : 'info'} className="mt-2">{tr(msg)}</Note>}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[13px] text-muted">{T('পিন যেখানে আছে', 'Where the pin is')}</div>
              {inside && where ? (
                <div className="font-display mt-0.5 text-[20px] font-bold leading-tight">{lang === 'bn' ? where.villageBn : where.village}, {tr(unionMeta)} {T('ইউনিয়ন', 'union')}</div>
              ) : <div className="font-display mt-0.5 text-[20px] font-bold leading-tight text-red-700">{T('গোদাগাড়ীর বাইরে', 'Outside Godagari')}</div>}
              <div className="mt-1 text-[12.5px] text-muted tabular">{num(pos.lat, 'en', { dp: 5 })}, {num(pos.lon, 'en', { dp: 5 })}</div>
            </div>
            {landConfirmed && !dirty ? <span className="chip bg-primary-50 text-primary-800 ring-1 ring-primary-200"><CheckCircle2 size={13} />{T('নিশ্চিত', 'Saved')}</span> : dirty ? <span className="chip bg-amber-50 text-amber-800 ring-1 ring-amber-200">{T('সংরক্ষণ বাকি', 'Not saved')}</span> : null}
          </div>
          {inside && soil && (
            <div className="mt-3 rounded-xl bg-clay-50 p-3 text-[13.5px] leading-6 text-clay-700">
              {T(`এই ইউনিয়নের মাটি: pH ${num(soil.ph, 'bn', { dp: 1 })}, জৈব পদার্থ ${num(soil.om_pct, 'bn', { dp: 1 })}%, পানি ${soil.drainage === 'poor' ? 'সহজে নামে না' : soil.drainage === 'good' ? 'দ্রুত নেমে যায়' : 'মাঝারি গতিতে নামে'}।`, `Soil in this union: pH ${num(soil.ph, 'en', { dp: 1 })}, organic matter ${num(soil.om_pct, 'en', { dp: 1 })}%, drainage ${soil.drainage}.`)} <Tags list={[soilData.provenance.status === 'REAL' ? 'REAL' : 'DEMO']} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <label className="block" htmlFor="lp-area">
            <span className="text-[14px] font-semibold">{T('জমির পরিমাণ', 'Field size')}</span>
            <div className="mt-1.5 flex items-center gap-2">
              <input id="lp-area" type="number" inputMode="numeric" min="1" max="1000" value={area} onChange={(e) => setArea(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                className="h-11 w-28 rounded-xl border border-border px-3 text-[15px] tabular outline-none focus:border-primary-400" />
              <span className="text-[14px] text-muted">{T('শতক', 'decimal')} = {num((Number(area) || 0) / 33, lang, { dp: 1 })} {T('বিঘা', 'bigha')}</span>
            </div>
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AREA_PRESETS.map((a) => (
              <button key={a} type="button" onClick={() => setArea(a)} className={`rounded-lg border px-2.5 py-1 text-[13px] font-semibold ${Number(area) === a ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-border hover:bg-primary-50'}`}>
                {a % 33 === 0 ? T(`${num(a / 33, 'bn')} বিঘা`, `${a / 33} bigha`) : T(`${num(a, 'bn')} শতক`, `${a} decimal`)}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="block" htmlFor="lp-last">
              <span className="text-[14px] font-semibold">{T('গত রবিতে কী ছিল', 'Last Rabi crop')}</span>
              <select id="lp-last" value={lastCrop} onChange={(e) => setLastCrop(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-[15px]">
                {Object.keys(RABI_CROPS).map((k) => <option key={k} value={k}>{cropName(k, lang)}</option>)}
              </select>
            </label>
            <label className="block" htmlFor="lp-irr">
              <span className="text-[14px] font-semibold">{T('সেচের পানি কোথা থেকে', 'Water source')}</span>
              <select id="lp-irr" value={irrigation} onChange={(e) => setIrrigation(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-[15px]">
                {Object.entries(IRRIGATION).map(([k, v]) => <option key={k} value={k}>{tr(v)}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={confirm} disabled={!inside || !where || !(Number(area) > 0) || (!dirty && landConfirmed)} className="flex-1 py-3">
            <CheckCircle2 size={18} />{landConfirmed && !dirty ? T('জমি নিশ্চিত করা আছে', 'Field saved') : T('এটাই আমার জমি', 'This is my field')}
          </Button>
          {dirty && <Button variant="secondary" onClick={undo}><RotateCcw size={16} />{T('আগের মতো', 'Undo')}</Button>}
        </div>
        <p className="text-[12.5px] leading-5 text-muted">{T('জমির অবস্থান বদলালে ইউনিয়ন, মাটি, সুপারিশ আর দাম পড়ার হিসাব নতুন করে হবে। অবস্থান কেবল এই নমুনার জন্য, কোথাও পাঠানো হয় না।', 'Moving your field updates the union, soil, recommendation and price-drop check. The location stays in this demo and is not sent anywhere.')}</p>
      </div>
    </div>
  );
}
