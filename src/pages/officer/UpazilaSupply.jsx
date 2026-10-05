import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceArea, CartesianGrid, Legend } from 'recharts';
import { Building2, Send, CheckCircle2, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { PageHeader, Card, Badge, Button, Tags, Note, RISK_STYLE } from '../../components/ui';
import SupplyChart from '../../components/SupplyChart';
import { DEMO_TODAY } from '../../data/demo';
import { RABI_CROPS, cropName } from '../../engine/crops';
import { supplyCurve, PRICE_DIP, weekStart } from '../../engine/glut';
import { num, fmtDate } from '../../engine/dates';
import { unionGlut } from './shared';

const UNION_COLORS = ['#2f6e2f', '#2b8fb3', '#d08f26', '#a8552a'];

export function Upazila() {
  const { s, dispatch, T, L, toast, unionsAll, hotspots, farmers } = useStore();
  const lang = s.lang;
  const [msg, setMsg] = useState(null);
  const stats = Object.values(unionsAll).map((u) => {
    const g = unionGlut(u);
    const open = s.requests.filter((r) => r.union === u.id && r.status === 'open').length;
    const hs = hotspots.filter((h) => h.members.some((m) => m.union === u.id)).length;
    const share = u.plans.filter((p) => p.crop === 'tomato').reduce((a, p) => a + p.area_dec, 0) / u.area_dec;
    return { u, g, open, hs, share, score: g.peak + hs * 2 + open * 0.1 };
  }).sort((a, b) => b.score - a.score);
  const sent = s.advisories.find((a) => a.upazila);
  const allFarmers = farmers.map((f) => f.id);
  const defaultMsg = T('গোদাগাড়ী উপজেলা কৃষি অফিস থেকে টমেটো চাষি ভাইবোনদের জন্য: পাতায় দাগ দেখলে নিচের দাগওয়ালা পাতা ছিঁড়ে ফেলুন আর আপনার ইউনিয়নের উপসহকারী কৃষি কর্মকর্তাকে ছবি পাঠান। সবাই একই সপ্তাহে চারা লাগাবেন না; কয়েক সপ্তাহ আগে-পরে লাগালে ফাল্গুনে বাজারে একসঙ্গে টমেটো উঠে দাম পড়বে না।',
    'From the Godagari upazila agriculture office to tomato growers: if you see leaf spots, pick off the spotted lower leaves and send a photo to your union’s sub-assistant agriculture officer. Please do not all plant in the same week; spreading planting over a few weeks keeps prices from crashing in February.');
  const send = () => {
    dispatch({ type: 'addAdvisory', adv: { id: 'UPZ-1', upazila: true, text: msg ?? defaultMsg, to: allFarmers, at: DEMO_TODAY } });
    s.escalations.forEach((e) => dispatch({ type: 'escalate', esc: { ...e, ack: true } }));
    toast(`${num(allFarmers.length, 'bn')} জন কৃষককে পাঠানো হয়েছে`, `Sent to ${allFarmers.length} farmers`);
  };
  const ack = (e) => { dispatch({ type: 'escalate', esc: { ...e, ack: true } }); toast('দেখেছেন বলে জানানো হয়েছে', 'Marked as seen'); };
  return (
    <div>
      <PageHeader eyebrow={T('উপজেলা কৃষি অফিসার', 'Upazila agriculture officer')} title={T('গোদাগাড়ী উপজেলার সার্বিক চিত্র', 'Godagari upazila at a glance')}
        subtitle={T(`নমুনা তারিখ ${fmtDate(DEMO_TODAY, 'bn')}। এখানে ৯টির মধ্যে ৪টি ইউনিয়ন দেখানো হয়েছে। আপনি আলাদা অনুরোধ নয়, পুরো এলাকার ঝুঁকি আর মাঠকর্মীদের পাঠানো বিষয়গুলো দেখবেন।`, `Sample date ${fmtDate(DEMO_TODAY, 'en')}. Showing 4 of 9 unions. You see area-wide risks and what field officers send up, not single requests.`)} tags={['RULE', 'AI', 'DEMO']} />

      <Card className="mb-6 p-5">
        <div className="flex items-center justify-between"><h2 className="text-[19px] font-bold">{T('মাঠকর্মীরা যা জানিয়েছেন', 'Sent up by field officers')}</h2><Badge tone={s.escalations.some((e) => !e.ack) ? 'red' : 'green'}>{num(s.escalations.filter((e) => !e.ack).length, lang)} {T('নতুন', 'new')}</Badge></div>
        {s.escalations.length === 0 ? <p className="mt-2 text-[14px] text-muted">{T('এখনো কিছু আসেনি। ইউনিয়নের "এলাকার সতর্কতা" পাতায় "উপজেলা অফিসারকে জানান" চাপলে এখানে দেখা যাবে।', 'Nothing yet. When a union officer taps "Tell the upazila officer" on Area alerts, it shows up here.')}</p> : (
          <ul className="mt-2 divide-y divide-border">{s.escalations.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[14px]">
              <span className="font-semibold">{L(e.text)}</span>
              {e.ack ? <Badge><CheckCircle2 size={12} />{T('দেখেছেন', 'Seen')}</Badge> : <Button variant="secondary" className="!py-1.5" onClick={() => ack(e)}>{T('দেখেছি', 'Mark as seen')}</Button>}
            </li>
          ))}</ul>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="bg-canvas text-[13px] text-muted"><tr>
            {[T('ক্রম', 'Rank'), T('ইউনিয়ন', 'Union'), T('কৃষক', 'Farmers'), T('টমেটোর জমি', 'Tomato land'), T('দাম পড়ার ঝুঁকি', 'Price-drop risk'), T('ব্যস্ততম সপ্তাহ', 'Busiest week'), T('এলাকার সতর্কতা', 'Area alerts'), T('খোলা অনুরোধ', 'Open requests')].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {stats.map((x, i) => (
              <tr key={x.u.id}>
                <td className="px-4 py-3 font-bold">{num(i + 1, lang)}</td>
                <td className="px-4 py-3 font-semibold">{L(x.u.meta)}</td>
                <td className="px-4 py-3 tabular">{num(x.u.farmers.length, lang)}</td>
                <td className="px-4 py-3 tabular">{num(x.share * 100, lang)}%</td>
                <td className="px-4 py-3"><span className={`chip ${RISK_STYLE[x.g.risk.level].cls}`}>{L(RISK_STYLE[x.g.risk.level])}</span></td>
                <td className="px-4 py-3 font-semibold tabular">{T(`স্বাভাবিকের ${num(x.g.peak, 'bn', { dp: 1 })} গুণ`, `${num(x.g.peak, 'en', { dp: 1 })}× normal`)}</td>
                <td className="px-4 py-3">{x.hs ? <Badge tone="red">{num(x.hs, lang)}</Badge> : '—'}</td>
                <td className="px-4 py-3 tabular">{num(x.open, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {stats.map((x) => (
          <Card key={x.u.id} className="p-4">
            <div className="flex items-center justify-between"><div className="font-semibold">{T(`${x.u.meta.bn}: প্রতি সপ্তাহে টমেটো`, `${x.u.meta.en}: tomato each week`)}</div><span className={`chip ${RISK_STYLE[x.g.risk.level].cls}`}>{L(RISK_STYLE[x.g.risk.level])}</span></div>
            <SupplyChart bins={x.g.bins} normal={x.g.normal} dip={PRICE_DIP.tomato} height={160} />
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="flex items-center gap-2 text-[19px] font-bold"><Building2 size={18} className="text-primary-600" />{T('পুরো উপজেলায় পরামর্শ পাঠান', 'Send advice to the whole upazila')}</h2>
        <textarea rows={4} value={msg ?? defaultMsg} onChange={(e) => setMsg(e.target.value)} disabled={!!sent} className="mt-3 w-full rounded-2xl border border-border p-3 text-[14px] leading-6 outline-none focus:border-primary-300 disabled:bg-canvas" aria-label={T('পরামর্শের লেখা', 'Advice text')} />
        <Button disabled={!!sent} onClick={send} className="mt-2">{sent ? <><CheckCircle2 size={16} />{T(`${num(allFarmers.length, 'bn')} জনকে পাঠানো হয়েছে`, `Sent to ${allFarmers.length} farmers`)}</> : <><Send size={16} />{T(`${num(allFarmers.length, 'bn')} জন কৃষককে পাঠান`, `Send to ${allFarmers.length} farmers`)}</>}</Button>
      </Card>
      <Link to="/officer" className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-primary-700">{T('ইউনিয়নের পাতায় ফিরুন', 'Back to the union view')}<ChevronRight size={15} /></Link>
    </div>
  );
}

export function Supply() {
  const { s, T, L, unionsAll } = useStore();
  const lang = s.lang;
  const [crop, setCrop] = useState('tomato');
  const list = Object.values(unionsAll);
  const curves = list.map((u) => supplyCurve(null, u.plans, crop));
  const weeks = curves.flatMap((c) => [...c.keys()]);
  const lo = Math.min(...weeks) - 1, hi = Math.max(...weeks) + 1;
  const data = [];
  for (let w = lo; w <= hi; w++) {
    const row = { w, label: fmtDate(weekStart(w), lang) };
    list.forEach((u, i) => { row[u.id] = +(curves[i].get(w) || 0).toFixed(2); });
    data.push(row);
  }
  const dip = PRICE_DIP[crop];
  const lab = (w) => fmtDate(weekStart(w), lang);
  const windows = list.map((u, i) => { const ks = [...curves[i].keys()]; const peak = ks.reduce((a, k) => (curves[i].get(k) > (curves[i].get(a) ?? -1) ? k : a), ks[0]); return { u, first: Math.min(...ks), last: Math.max(...ks), peak, total: [...curves[i].values()].reduce((a, b) => a + b, 0) }; });
  return (
    <div>
      <PageHeader eyebrow={T('ফসল কবে উঠবে', 'Harvest timing')} title={T('কোন সপ্তাহে কত ফসল উঠবে', 'What comes in each week')} subtitle={T('কোন ইউনিয়নে, কোন সপ্তাহে, কত টন ফসল উঠবে। এখানে কেনাবেচা, টাকা লেনদেন বা দামের পূর্বাভাস নেই।', 'How many tonnes each union will harvest, week by week. No buying, payments or price forecasts here.')} tags={['RULE', 'DEMO']} />
      <div className="mb-3 flex flex-wrap gap-1.5">{Object.values(RABI_CROPS).map((c) => <button key={c.id} type="button" onClick={() => setCrop(c.id)} className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${crop === c.id ? 'border-primary-600 bg-primary-600 text-white' : 'border-border bg-white text-ink/70'}`}>{L(c.name)}</button>)}</div>
      <Card className="p-5">
        <div className="font-semibold">{T(`${cropName(crop, 'bn')}: ইউনিয়নভিত্তিক প্রতি সপ্তাহের হিসাব (টন)`, `${cropName(crop, 'en')}: tonnes per week, by union`)}</div>
        <div className="mt-3" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef0ec" />
              {dip && <ReferenceArea x1={lab(Math.max(dip[0], lo))} x2={lab(Math.min(dip[1], hi))} fill="#c9932b" fillOpacity={0.12} />}
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5d6d66' }} tickLine={false} axisLine={{ stroke: '#cfd8d3' }} />
              <YAxis tick={{ fontSize: 11, fill: '#5d6d66' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v, n) => [`${num(v, lang, { dp: 1 })} ${T('টন', 't')}`, L(unionsAll[n]?.meta)]} />
              <Legend formatter={(n) => L(unionsAll[n]?.meta)} wrapperStyle={{ fontSize: 12 }} />
              {list.map((u, i) => <Bar key={u.id} dataKey={u.id} stackId="s" fill={UNION_COLORS[i]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {dip && <p className="mt-1 text-[12px] text-muted">{T('সোনালি অংশ: যে সপ্তাহগুলোতে সাধারণত দাম কমে। এটা নমুনা তথ্য; পরে কৃষি বিপণন অধিদপ্তরের (DAM) দামের তথ্য বসবে।', 'Gold band: weeks when prices usually fall. Sample data for now; to be replaced with Department of Agricultural Marketing (DAM) prices.')}</p>}
      </Card>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[14px]">
          <thead className="bg-canvas text-[13px] text-muted"><tr>{[T('ইউনিয়ন', 'Union'), T('প্রথম সপ্তাহ', 'First week'), T('সবচেয়ে বেশি যে সপ্তাহে', 'Busiest week'), T('শেষ সপ্তাহ', 'Last week'), T('মোট (টন)', 'Total (t)')].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">{windows.map((w) => <tr key={w.u.id}><td className="px-4 py-3 font-semibold">{L(w.u.meta)}</td>{Number.isFinite(w.first) ? <><td className="px-4 py-3">{lab(w.first)}</td><td className="px-4 py-3 font-semibold">{lab(w.peak)}</td><td className="px-4 py-3">{lab(w.last)}</td><td className="px-4 py-3 tabular">{num(w.total, lang, { dp: 1 })}</td></> : <td colSpan={4} className="px-4 py-3 text-muted">—</td>}</tr>)}</tbody>
        </table>
      </Card>
      <Note tone="gold" className="mt-4">{T('সব পরিমাণ আনুমানিক: নমুনা কৃষকদের পরিকল্পনা থেকে জমির মাপ × গড় ফলন।', 'All amounts are estimates: field size × average yield, from the sample farmers’ plans.')} <Tags list={['DEMO']} /></Note>
    </div>
  );
}
