// Season planner steps 1–4: field, weather then vs now, soil, what matters to the farmer.
import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell, CartesianGrid } from 'recharts';
import { Droplets, Coins, Shield, Sprout, Timer, MapPinned, Pencil, CheckCircle2 } from 'lucide-react';
import { useStore, tm } from '../../../store';
import { StepHeader, Card, Tags, WhyButton, Note, climateTag, soilTag, climateSource, soilSource, MiniBar, Button } from '../../../components/ui';
import LandPicker from '../../../components/LandPicker';
import Photo from '../../../components/Photo';
import { RABI_CROPS, IRRIGATION, cropName } from '../../../engine/crops.js';
import { TM_METRICS, THEN, NOW } from '../../../engine/climate.js';
import { PRIORITIES, weightsFor, soilFit } from '../../../engine/decision.js';
import { num, bnDigits } from '../../../engine/dates.js';

const LEVEL = { 'very low': { bn: 'খুব কম', en: 'Very low', v: 10 }, low: { bn: 'কম', en: 'Low', v: 30 }, medium: { bn: 'মাঝারি', en: 'Medium', v: 55 }, optimum: { bn: 'যথেষ্ট', en: 'Good', v: 80 }, high: { bn: 'বেশি', en: 'High', v: 95 } };
const PRIORITY_ICONS = { droplets: Droplets, coins: Coins, shield: Shield, sprout: Sprout, timer: Timer };

// ---------- 1. Field ----------
export function StepField() {
  const { s, T, L, farmer, union, landConfirmed } = useStore();
  const [editing, setEditing] = useState(!landConfirmed);
  const lang = s.lang;
  return (
    <div>
      <StepHeader kicker={T('ধাপ ১, জমি', 'Step 1, your field')} title={T('আপনার জমিটা কোথায়?', 'Where is your field?')}
        sub={T('মানচিত্রে জমির ওপর পিন বসিয়ে নিশ্চিত করুন। এখান থেকেই ইউনিয়ন, মাটি আর পাশের কৃষকদের হিসাব ঠিক হয়।', 'Put the pin on your field and confirm it. Your union, soil and neighbours are worked out from here.')} tags={['DEMO']} />
      {editing ? (
        <LandPicker compact height={340} onDone={() => setEditing(false)} />
      ) : (
        <Card className="overflow-hidden">
          <div className="relative aspect-[16/7]">
            <Photo name="landParcels" fill sizes="720px" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="flex items-center gap-1.5 text-[13.5px] text-white/85"><CheckCircle2 size={15} />{T('জমি নিশ্চিত করা আছে', 'Field confirmed')}</div>
              <div className="font-display text-[22px] font-bold">{L(farmer.name)}</div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-[14.5px] sm:grid-cols-4">
            <Fact k={T('জায়গা', 'Place')} v={`${lang === 'bn' ? farmer.villageBn : farmer.village}, ${L(union.meta)}`} />
            <Fact k={T('জমির মাপ', 'Size')} v={T(`${num(farmer.area_dec, 'bn')} শতক (${num(farmer.area_dec / 33, 'bn', { dp: 1 })} বিঘা)`, `${farmer.area_dec} decimal (${num(farmer.area_dec / 33, 'en', { dp: 1 })} bigha)`)} />
            <Fact k={T('গত রবিতে', 'Last Rabi')} v={cropName(farmer.last_crop, lang)} />
            <Fact k={T('সেচ', 'Water')} v={L(IRRIGATION[farmer.irrigation])} />
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-border p-4">
            <Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={16} />{T('জমি বদলান', 'Change field')}</Button>
            <Button to="/farmer/farm" variant="ghost"><MapPinned size={16} />{T('বড় মানচিত্রে দেখুন', 'Open the full map')}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
const Fact = ({ k, v }) => <div><dt className="text-[13px] text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>;

// ---------- 2. Weather then vs now ----------
export function StepClimate() {
  const { s, T, L } = useStore();
  const [metric, setMetric] = useState('hotMarApr');
  const m = tm[metric];
  const def = TM_METRICS[metric];
  const lang = s.lang;
  const data = m.series.map((x) => ({ season: x.season, label: lang === 'bn' ? bnDigits(String(x.season).slice(2)) : `'${String(x.season).slice(2)}`, value: x.value, now: x.season >= 2013 }));
  const up = m.change > 0;
  const dp = (v) => ({ dp: v < 20 ? 1 : 0 });
  const why = {
    title: L(def), tags: [climateTag(), 'RULE'],
    blocks: [
      { h: T('কী গোনা হয়েছে', 'What is counted'), lines: [L(def.detail), L(def.why)] },
      { h: T('কোন বছরগুলো', 'Which years'), lines: [T(`আগে: ২০০১ থেকে ২০১২ (${bnDigits(THEN.length)}টি মৌসুম)। এখন: ২০১৩ থেকে ২০২৫ (${bnDigits(NOW.length)}টি মৌসুম)।`, `Then: 2001 to 2012 (${THEN.length} seasons). Now: 2013 to 2025 (${NOW.length} seasons).`),
        T('মৌসুম গোনা হয়েছে ফসল তোলার বছর দিয়ে, যেমন ২০২৫ মানে ২০২৪–২৫-এর রবি।', 'Seasons are named by harvest year, so 2025 means the 2024–25 Rabi.')] },
      { h: T('যা মনে রাখবেন', 'Keep in mind'), lines: [T('নাসা POWER-এর এক একটি ঘর প্রায় ৫০ কিলোমিটার জুড়ে। তাই এটা পুরো এলাকার ছবি, আপনার জমির আলাদা মাপ নয়।', 'Each NASA POWER grid cell covers about 50 km, so this is the picture for the area, not a measurement of your field.'),
        T('এটা অতীতের হিসাব, ভবিষ্যতের আবহাওয়ার পূর্বাভাস নয়।', 'This looks back at past seasons. It is not a forecast.')] },
    ],
    sources: [climateSource(lang)],
  };
  return (
    <div>
      <StepHeader kicker={T('ধাপ ২, আবহাওয়া', 'Step 2, weather')} title={T('আপনার মৌসুম কি বদলে গেছে?', 'Has your season changed?')}
        sub={T('নাসার ২৫ মৌসুমের তথ্যে আগের ১২ বছর আর পরের ১৩ বছর পাশাপাশি।', 'Twenty-five seasons of NASA data: the earlier 12 years beside the later 13.')} tags={[climateTag(), 'RULE']} />
      <div className="relative mb-4 overflow-hidden rounded-2xl">
        <div className="relative aspect-[16/5]"><Photo name="droughtFlood" fill sizes="720px" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(TM_METRICS).map(([k, d]) => {
          const x = tm[k];
          const sel = k === metric;
          return (
            <button key={k} type="button" onClick={() => setMetric(k)} aria-pressed={sel} className={`rounded-xl border p-3 text-left transition ${sel ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200' : 'border-border bg-white hover:border-primary-300'}`}>
              <div className="min-h-[40px] text-[13.5px] leading-snug text-ink/75">{L(d)}</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-[14px] text-muted">{num(x.then, lang, dp(x.then))}</span>
                <span className="text-[13px] text-muted">{T('থেকে', 'to')}</span>
                <span className="font-display text-[22px] font-bold">{num(x.now, lang, dp(x.now))}</span>
                <span className="text-[12.5px] text-muted">{L(d.unit)}</span>
              </div>
              {x.pct !== null && Math.abs(x.pct) >= 5 && (
                <div className={`text-[12.5px] font-semibold ${x.change > 0 ? 'text-clay-500' : 'text-sky-700'}`}>{x.change > 0 ? T(`${num(Math.abs(x.pct), 'bn')}% বেশি`, `${num(Math.abs(x.pct), 'en')}% more`) : T(`${num(Math.abs(x.pct), 'bn')}% কম`, `${num(Math.abs(x.pct), 'en')}% less`)}</div>
              )}
            </button>
          );
        })}
      </div>
      <Card className="mt-4 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[15px] font-semibold">{L(def)}, {T('প্রতি মৌসুমে', 'each season')}</div>
          <WhyButton small payload={why} />
        </div>
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e7ede4" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#566a5e' }} interval={2} tickLine={false} axisLine={{ stroke: '#cdd8ca' }} />
              <YAxis tick={{ fontSize: 11, fill: '#566a5e' }} tickLine={false} axisLine={false} tickFormatter={(v) => num(v, lang)} />
              <Tooltip formatter={(v) => [`${num(v, lang, { dp: 0 })} ${L(def.unit)}`, '']} labelFormatter={(l, p) => (p?.[0] ? T(`${bnDigits(p[0].payload.season)} সালের মৌসুম`, `Season ${p[0].payload.season}`) : l)} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <ReferenceLine segment={[{ x: data[0].label, y: m.then }, { x: data[11].label, y: m.then }]} stroke="#8a9a8f" strokeDasharray="4 3" />
              <ReferenceLine segment={[{ x: data[12].label, y: m.now }, { x: data[24].label, y: m.now }]} stroke="#1c4722" strokeWidth={2} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((d) => <Cell key={d.season} fill={d.now ? '#43863a' : '#c4d1c0'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex flex-wrap gap-4 text-[12.5px] text-muted">
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#c4d1c0]" />{T('২০০১–২০১২', '2001–2012')}</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-primary-500" />{T('২০১৩–২০২৫', '2013–2025')}</span>
          <span>{T('আড়াআড়ি দাগ: দুই সময়ের গড়', 'Horizontal lines: the average for each period')}</span>
        </div>
      </Card>
      <Note className="mt-4">
        {m.change === null ? '' : Math.abs(m.pct ?? 0) < 5
          ? T(`${L(def)} আগের মতোই আছে, তেমন বদলায়নি।`, `${L(def)} have stayed about the same.`)
          : T(`${L(def)} আগে গড়ে ${num(m.then, 'bn', { dp: 1 })} ছিল, এখন ${num(m.now, 'bn', { dp: 1 })} — ${up ? 'বেড়েছে' : 'কমেছে'}। ${L(def.why)}।`,
            `${L(def)} averaged ${num(m.then, 'en', { dp: 1 })} before and ${num(m.now, 'en', { dp: 1 })} now, so they have gone ${up ? 'up' : 'down'}. ${L(def.why)}.`)}
      </Note>
    </div>
  );
}

// ---------- 3. Soil ----------
export function StepSoil() {
  const { s, T, L, soil, union } = useStore();
  const lang = s.lang;
  const phPos = ((soil.ph - 4) / 5) * 100;
  const fits = Object.values(RABI_CROPS).map((c) => ({ c, f: soilFit(c, soil) })).sort((a, b) => b.f.score - a.f.score);
  const phWord = soil.ph < 5.5 ? T('বেশ টক', 'quite acidic') : soil.ph < 6.5 ? T('একটু টক', 'slightly acidic') : soil.ph <= 7.3 ? T('মাঝামাঝি', 'neutral') : T('ক্ষারীয়, চুনযুক্ত', 'alkaline, limey');
  const why = {
    title: T('মাটির হিসাব কীভাবে কাজে লাগে', 'How the soil is used'), tags: [soilTag(), 'RULE'],
    blocks: [
      { h: T('নিয়মগুলো', 'The rules'), lines: [
        T('মাটির pH ফসলের পছন্দের মধ্যে থাকলে ১০০ নম্বর; একটু বাইরে (০.৫-এর মধ্যে) হলে ৬৫; তার বেশি বাইরে হলে ৩০।', 'Soil pH inside the crop’s range scores 100; just outside (within 0.5) scores 65; further out scores 30.'),
        T('যে ফসল পানি জমা সহ্য করে না, তা বরেন্দ্রের শক্ত মাটিতে হলে ১০ নম্বর কম।', 'Crops that hate standing water lose 10 on poorly draining Barind soil.'),
        T('বেশি সার টানে এমন ফসল, আর মাটিতে ফসফরাস বা পটাশ কম হলে ১০ নম্বর কম।', 'Hungry crops lose 10 when the soil is low in phosphorus or potash.'),
        T('চুনযুক্ত মাটিতে ডাল হলে ১০ নম্বর বেশি।', 'Pulses gain 10 on limey soil.')] },
      { h: T('আপনার এলাকায় কোন ফসলের সঙ্গে মাটি কতটা মেলে', 'How each crop matches your area’s soil'), table: { head: [T('ফসল', 'Crop'), T('নম্বর', 'Score'), T('কারণ', 'Reason')], rows: fits.map(({ c, f }) => [L(c.name), num(f.score, lang), f.notes.map(L).join('। ')]) } },
    ],
    sources: [soilSource(lang)],
  };
  return (
    <div>
      <StepHeader kicker={T('ধাপ ৩, মাটি', 'Step 3, soil')} title={T('আপনার এলাকার মাটি কেমন', 'What your area’s soil is like')}
        sub={T(`${union.meta.bn} ইউনিয়ন, ${soil.aez.includes('Barind') ? 'বরেন্দ্র অঞ্চল' : 'পদ্মার পলি অঞ্চল'}। মাটির কোনো পরীক্ষা আপনাকে করতে হবে না।`, `${union.meta.en} union, ${soil.aez}. You do not need to test anything yourself.`)} tags={[soilTag(), 'RULE']} />
      <Card className="p-5">
        <div className="flex items-baseline justify-between"><div className="text-[15px] font-semibold">{T('মাটি কতটা টক (pH)', 'How acidic (pH)')}</div><div className="font-display text-[20px] font-bold">{num(soil.ph, lang, { dp: 1 })} <span className="text-[14px] font-medium text-muted">{phWord}</span></div></div>
        <div className="relative mt-3 h-3 rounded-full" style={{ background: 'linear-gradient(90deg,#d08f26,#e3cf6a,#8dbe78,#5aa6a8,#5e74b6)' }}>
          <div className="absolute -top-1.5 h-6 w-1.5 rounded bg-ink" style={{ left: `calc(${phPos}% - 3px)` }} />
        </div>
        <div className="mt-1 flex justify-between text-[12px] text-muted"><span>{T('টক', 'acidic')}</span><span>{T('মাঝামাঝি', 'neutral')}</span><span>{T('ক্ষারীয়', 'alkaline')}</span></div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[14.5px]">
          <div>
            <div className="text-[13px] text-muted">{T('জৈব পদার্থ', 'Organic matter')}</div>
            <div className="font-semibold">{num(soil.om_pct, lang, { dp: 1 })}%, {soil.om_pct < 1.5 ? T('কম', 'low') : soil.om_pct < 3.5 ? T('মাঝারি', 'medium') : T('ভালো', 'good')}</div>
            <MiniBar value={(soil.om_pct / 3.5) * 100} color={soil.om_pct < 1.5 ? 'bg-paddy-500' : 'bg-primary-500'} className="mt-1" />
          </div>
          <div><div className="text-[13px] text-muted">{T('মাটির ধরন', 'Texture')}</div><div className="font-semibold">{soil.texture}</div></div>
          <div><div className="text-[13px] text-muted">{T('পানি নামে কেমন', 'Drainage')}</div><div className="font-semibold">{{ poor: T('সহজে নামে না (শক্ত স্তর)', 'Poor (hardpan)'), imperfect: T('মাঝারি', 'Fair'), good: T('দ্রুত নেমে যায়', 'Good') }[soil.drainage]}</div></div>
          <div><div className="text-[13px] text-muted">{T('চুন আছে কি', 'Limey')}</div><div className="font-semibold">{soil.calcareous ? T('হ্যাঁ', 'Yes') : T('না', 'No')}</div></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[['N', soil.n_level, T('নাইট্রোজেন', 'Nitrogen')], ['P', soil.p_level, T('ফসফরাস', 'Phosphorus')], ['K', soil.k_level, T('পটাশ', 'Potash')]].map(([k, v, name]) => (
            <div key={k} className="rounded-xl bg-canvas p-2.5">
              <div className="text-[12.5px] text-muted">{name}</div>
              <div className="text-[14.5px] font-semibold">{L(LEVEL[v])}</div>
              <MiniBar value={LEVEL[v].v} color={LEVEL[v].v < 35 ? 'bg-paddy-500' : 'bg-primary-500'} className="mt-1" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4 p-4">
        <div className="mb-2 flex items-center justify-between"><div className="text-[15px] font-semibold">{T('কোন ফসলের সঙ্গে মাটি মেলে', 'Which crops suit this soil')}</div><WhyButton small payload={why} /></div>
        <ul className="divide-y divide-border">
          {fits.map(({ c, f }) => (
            <li key={c.id} className="grid grid-cols-[88px_64px_1fr] items-center gap-3 py-2 text-[14px]">
              <span className="font-semibold">{L(c.name)}</span>
              <MiniBar value={f.score} color={f.score >= 80 ? 'bg-primary-500' : f.score >= 55 ? 'bg-paddy-500' : 'bg-red-500'} />
              <span className="leading-snug text-muted">{L(f.notes[f.notes.length - 1])}</span>
            </li>
          ))}
        </ul>
      </Card>
      {soilTag() === 'DEMO' && <Note tone="gold" className="mt-4">{T('এগুলো নমুনা মান। আসল মান মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউটের গোদাগাড়ী উপজেলা নির্দেশিকা থেকে বসাতে হবে।', 'These are sample values. The real ones come from the SRDI Godagari upazila soil guide.')}</Note>}
      <p className="mt-3 text-[13px] text-muted">{T('এটা পুরো ইউনিয়নের মাটির ধারণা, আপনার জমির মাটি পরীক্ষা নয়। উপগ্রহ মাটি মাপতে পারে না।', 'This is the union’s soil in general, not a test of your field. Satellites cannot measure soil.')}</p>
    </div>
  );
}

// ---------- 4. What matters ----------
const W_LABEL = { C: { bn: 'আবহাওয়ার ঝুঁকি', en: 'Weather safety' }, W: { bn: 'সেচের পানি', en: 'Water' }, S: { bn: 'মাটির সঙ্গে মিল', en: 'Soil match' }, P: { bn: 'লাভ', en: 'Profit' }, R: { bn: 'ফসলচক্র', en: 'Rotation' }, G: { bn: 'দাম পড়ার ঝুঁকি', en: 'Price-drop risk' }, E: { bn: 'আগাম ফসল', en: 'Early harvest' } };
export function StepPriorities() {
  const { s, dispatch, T, L } = useStore();
  const w = weightsFor(s.priorities);
  return (
    <div>
      <StepHeader kicker={T('ধাপ ৪, আপনার চাওয়া', 'Step 4, what matters')} title={T('এই মৌসুমে আপনার কাছে কোনটা বড়?', 'What matters most to you this season?')}
        sub={T('দুটো পর্যন্ত বেছে নিন। না বাছলেও চলবে, তখন সব দিক সমান ধরে হিসাব হবে।', 'Pick up to two. You can skip this and every factor counts equally.')} tags={['RULE']} />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {Object.entries(PRIORITIES).map(([id, p]) => {
          const on = s.priorities.includes(id);
          const Icon = PRIORITY_ICONS[p.icon];
          return (
            <button key={id} type="button" onClick={() => dispatch({ type: 'togglePriority', id })} aria-pressed={on}
              className={`rounded-2xl border p-3.5 text-left transition ${on ? 'border-primary-700 bg-primary-700 text-white shadow-[var(--shadow-card)]' : 'border-border bg-white hover:border-primary-300'}`}>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${on ? 'bg-white/15' : 'bg-primary-50 text-primary-700'}`}>{Icon && <Icon size={19} />}</span>
              <div className="font-display mt-2 text-[17px] font-bold leading-tight">{L(p)}</div>
              <div className={`mt-0.5 text-[13px] leading-snug ${on ? 'text-white/80' : 'text-muted'}`}>{L(p.hint)}</div>
            </button>
          );
        })}
      </div>
      <Card className="mt-4 p-4">
        <div className="mb-2 text-[15px] font-semibold">{T('হিসাবে কোন বিষয়ের কতটা ওজন', 'How much each factor counts')}</div>
        <div className="space-y-2">
          {Object.entries(w).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[130px_1fr_44px] items-center gap-2 text-[13.5px]">
              <span className="text-ink/75">{L(W_LABEL[k])}</span>
              <MiniBar value={v * 250} />
              <span className="text-right font-semibold tabular">{num(v * 100, s.lang)}%</span>
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-3 text-[13px] text-muted">{T('পরের ধাপে গিয়ে এখানে ফিরে চাওয়া বদলালে সুপারিশ সঙ্গে সঙ্গে বদলে যাবে।', 'Come back and change these any time — the recommendation updates straight away.')}</p>
    </div>
  );
}
export { W_LABEL };
