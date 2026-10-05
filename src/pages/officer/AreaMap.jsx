import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinned } from 'lucide-react';
import { useStore } from '../../store';
import { PageHeader, Card, Tags, Note, Segmented } from '../../components/ui';
import MapView from '../../components/MapView';
import { SYMPTOMS } from '../../data/demo';
import { cropName, RABI_CROPS } from '../../engine/crops';
import { num } from '../../engine/dates';
import { useOfficerUnion, CROP_COLOR } from './shared';

export default function AreaMap() {
  const { s, T, L, hotspots, farmerOf } = useStore();
  const lang = s.lang;
  const navigate = useNavigate();
  const union = useOfficerUnion();
  const [layers, setLayers] = useState({ crops: true, requests: true, clusters: true });
  const [crop, setCrop] = useState('all');
  const [basemap, setBasemap] = useState('map');
  const open = s.requests.filter((r) => r.union === union.id && r.status === 'open');
  const hs = hotspots.filter((h) => h.members.some((m) => m.union === union.id));
  const points = useMemo(() => {
    const pts = [];
    if (layers.crops) union.plans.filter((p) => crop === 'all' || p.crop === crop).forEach((p) => {
      const f = farmerOf(p.plot_id); if (!f) return;
      pts.push({ id: p.plot_id, lat: f.lat, lon: f.lon, color: CROP_COLOR[p.crop], r: 5, label: `${L(f.name)}: ${cropName(p.crop, lang)}, ${num(p.area_dec, lang)} ${T('শতক', 'dec')}`, onClick: () => navigate(`/officer/farmers/${f.id}`) });
    });
    if (layers.requests) open.forEach((r) => pts.push({ id: `q${r.id}`, lat: r.lat, lon: r.lon, color: r.priority === 'High' ? '#b42318' : '#e3a33a', r: 9, ring: '#13261b', label: `${L(farmerOf(r.farmerId)?.name)}: ${L(SYMPTOMS[r.symptom])}`, onClick: () => navigate(`/officer/requests/${r.id}`) }));
    return pts;
  }, [layers, crop, union, open, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (k) => setLayers((x) => ({ ...x, [k]: !x[k] }));
  const counts = Object.keys(RABI_CROPS).map((k) => [k, union.plans.filter((p) => p.crop === k).length]);
  return (
    <div>
      <PageHeader eyebrow={T('এলাকার মানচিত্র', 'Area map')} title={T(`${union.meta.bn} ইউনিয়নের মানচিত্র`, `${union.meta.en} union map`)} subtitle={T('কোন জমিতে কী লাগানো হচ্ছে, কোথা থেকে অনুরোধ এসেছে। কোনো বিন্দুতে চাপ দিলে সেই কৃষক বা অনুরোধ খুলবে।', 'What is planted where, and where requests came from. Tap a dot to open that farmer or request.')} tags={['AI', 'DEMO']} />
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[['crops', T('ফসলের পরিকল্পনা', 'Planned crops')], ['requests', T('খোলা অনুরোধ', 'Open requests')], ['clusters', T('এলাকার সতর্কতা', 'Area alerts')]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => toggle(k)} aria-pressed={layers[k]} className={`min-h-9 rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition ${layers[k] ? 'border-primary-600 bg-primary-600 text-white' : 'border-border bg-white text-ink/70 hover:border-primary-300'}`}>{l}</button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Segmented value={basemap} onChange={setBasemap} options={[{ value: 'map', label: T('মানচিত্র', 'Map') }, { value: 'satellite', label: T('স্যাটেলাইট', 'Satellite') }]} />
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-[14px] font-semibold" aria-label={T('ফসল দিয়ে ছাঁকুন', 'Filter by crop')}>
              <option value="all">{T('সব ফসল', 'All crops')}</option>
              {Object.values(RABI_CROPS).map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
          </div>
        </div>
        <MapView center={[union.meta.lat, union.meta.lon]} zoom={13} basemap={basemap} points={points} circles={layers.clusters ? hs.map((h) => ({ id: h.id, lat: h.lat, lon: h.lon, radius: 900, color: '#b42318' })) : []} height={540} label={T('ইউনিয়নের মানচিত্র', 'Union map')} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          {counts.map(([k, c]) => <span key={k} className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CROP_COLOR[k] }} />{cropName(k, lang)} ({num(c, lang)})</span>)}
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-full bg-paddy-500 ring-2 ring-ink" />{T('অনুরোধ', 'Request')}</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-red-600" />{T('একই সমস্যার গুচ্ছ', 'Problem cluster')}</span>
        </div>
        {hs.length > 0 && <Note tone="warn" className="mt-4"><MapPinned size={14} className="mr-1 inline" />{T(`${hs.map((h) => [...new Set(h.members.map((m) => m.villageBn))].join(' ও ')).join('; ')} গ্রামে একই রকম ${num(hs[0].members.length, 'bn')}টি খবর এসেছে।`, `${hs[0].members.length} similar reports from ${hs.map((h) => [...new Set(h.members.map((m) => m.village))].join(' and ')).join('; ')}.`)}</Note>}
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">{T('ইউনিয়নের নাম আসল, জমির অবস্থান আনুমানিক। ইন্টারনেট না থাকলে মানচিত্রের ছবি আসবে না, তবে বিন্দুগুলো দেখা যাবে।', 'Union names are real; field positions are approximate. Without internet the map tiles will not load, but the dots still show.')} <Tags list={['DEMO']} /></p>
      </Card>
    </div>
  );
}
