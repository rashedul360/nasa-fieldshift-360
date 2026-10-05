import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useStore } from '../../store';
import { PageHeader, Card, Tags, ProgressBar, Note, Badge, RISK_STYLE, WhyButton } from '../../components/ui';
import SupplyChart from '../../components/SupplyChart';
import { RABI_CROPS, cropName } from '../../engine/crops';
import { slotLoad, PRICE_DIP, HIGH_FACTOR } from '../../engine/glut';
import { num, fmtRange } from '../../engine/dates';
import { bnOf } from '../../engine/text';
import { useOfficerUnion, unionGlut, CROP_COLOR } from './shared';

export default function Planting() {
  const { s, T, L, farmers } = useStore();
  const lang = s.lang;
  const union = useOfficerUnion();
  const [crop, setCrop] = useState('tomato');
  const g = unionGlut(union, crop);
  const slots = slotLoad(union);
  const mix = Object.keys(RABI_CROPS).map((k) => ({ k, area: union.plans.filter((p) => p.crop === k).reduce((a, p) => a + p.area_dec, 0) }));
  const planned = mix.reduce((a, x) => a + x.area, 0) || 1;
  const undecided = farmers.filter((f) => f.hero && f.union === union.id && !s.confirmed.some((c) => c.plot_id === f.id));
  const why = {
    title: T('দাম পড়ার ঝুঁকি কীভাবে হিসাব হয়', 'How the price-drop warning works'), tags: ['RULE', 'DEMO'],
    blocks: [{ h: T('হিসাব', 'The calculation'), lines: [
      T('প্রতিটি পরিকল্পনা থেকে: জমির মাপ × গড় ফলন, ফসল ওঠার সপ্তাহগুলোতে ভাগ করে কোন সপ্তাহে কত টন।', 'For each plan: field size × average yield, spread over the harvest weeks, gives tonnes per week.'),
      T(`লাল রেখা: স্বাভাবিক সাপ্তাহিক সরবরাহের ${num(HIGH_FACTOR, 'bn', { dp: 1 })} গুণ। এর ওপরে গেলে দাম পড়ার ঝুঁকি বেশি।`, `Red line: ${HIGH_FACTOR}× the normal weekly supply. Above it, the risk of a price drop is high.`),
      T('সোনালি অংশ: যে সপ্তাহগুলোতে সাধারণত দাম কমে (নমুনা তথ্য)।', 'Gold band: the weeks when prices usually fall (sample data).'),
      T('লাগানোর পালা: প্রতিটি পালায় স্বাভাবিক টমেটো জমির চার ভাগের এক ভাগ × ১.৩ পর্যন্ত জায়গা। ভরে গেলে পরের কৃষককে অন্য সময় বা অন্য ফসলের কথা বলা হয়।', 'Planting slots: each slot holds up to a quarter of normal tomato land × 1.3. When it fills, the next farmer is offered another time or crop.')] }],
    sources: [T('কৃষকদের পরিকল্পনা, স্বাভাবিক সরবরাহ ও দাম: নমুনা তথ্য', 'Farmer plans, normal supply and prices: sample data')],
  };
  return (
    <div>
      <PageHeader eyebrow={T('সবাই মিলে পরিকল্পনা', 'Planning together')} title={T('লাগানোর সময় ও দাম পড়ার ঝুঁকি', 'Planting time and price-drop risk')} subtitle={T(`${union.meta.bn} ইউনিয়নের কৃষকদের পরিকল্পনা ধরে, কোন সপ্তাহে কত ফসল উঠবে।`, `How much ${union.meta.en} will harvest each week, based on farmers’ plans.`)} tags={['RULE', 'DEMO']} action={<WhyButton payload={why} />} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={T('ফসল', 'Crop')}>{Object.values(RABI_CROPS).map((c) => <button key={c.id} type="button" aria-pressed={crop === c.id} onClick={() => setCrop(c.id)} className={`min-h-9 rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition ${crop === c.id ? 'border-primary-600 bg-primary-600 text-white' : 'border-border bg-white text-ink/70 hover:border-primary-300'}`}>{L(c.name)}</button>)}</div>
            <span className={`chip ${RISK_STYLE[g.risk.level].cls}`}>{T('ঝুঁকি', 'Risk')}: {L(RISK_STYLE[g.risk.level])}</span>
          </div>
          <div className="mt-3"><SupplyChart bins={g.bins} normal={g.normal} dip={PRICE_DIP[crop]} height={260} /></div>
          <p className="mt-2 text-[13.5px] text-muted">{g.bins.size ? T(`${bnOf(cropName(crop, 'bn'))} সবচেয়ে ব্যস্ত সপ্তাহে স্বাভাবিকের ${num(g.peak, 'bn', { dp: 1 })} গুণ ফসল উঠবে।`, `In the busiest week, ${num(g.peak, 'en', { dp: 1 })}× the normal amount of ${cropName(crop, 'en').toLowerCase()} will come in.`) : T('এই ফসলের কোনো পরিকল্পনা এখনো নেই।', 'No plans for this crop yet.')}</p>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-[19px] font-bold">{T('টমেটো লাগানোর পালা', 'Tomato planting slots')}</h2>
            <div className="mt-3 space-y-3">
              {slots.map((sl) => (
                <div key={sl.id}>
                  <div className="flex justify-between text-[14px]"><span className="font-semibold">{fmtRange(sl.from, sl.to, lang)}</span><span className={sl.full ? 'font-bold text-red-700' : 'text-muted'}>{sl.full ? T('ভরে গেছে', 'Full') : T(`${num((sl.load / sl.cap) * 100, 'bn')}% ভরা`, `${num((sl.load / sl.cap) * 100, 'en')}% full`)}</span></div>
                  <ProgressBar value={(sl.load / sl.cap) * 100} color={sl.full ? 'bg-red-500' : 'bg-primary-500'} className="mt-1" />
                </div>
              ))}
            </div>
            <Note tone="gold" className="mt-4">{T('কোনো পালা ভরে গেলে নতুন কৃষককে অন্য সপ্তাহে লাগাতে, বা জমির অর্ধেকে অন্য ফসল করতে বলুন। তাতে ভিড় শুধু এক সপ্তাহ থেকে আরেক সপ্তাহে সরে যায় না।', 'When a slot is full, suggest another week or a second crop on half the land, so the crowd does not just move to the next week.')}</Note>
          </Card>
          <Card className="p-5">
            <h2 className="text-[19px] font-bold">{T('কোন ফসলে কত জমি', 'Land by crop')}</h2>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-black/5">{mix.map((x) => <div key={x.k} style={{ width: `${(x.area / planned) * 100}%`, background: CROP_COLOR[x.k] }} title={cropName(x.k, lang)} />)}</div>
            <ul className="mt-3 space-y-1.5 text-[14px]">{mix.map((x) => <li key={x.k} className="flex justify-between"><span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CROP_COLOR[x.k] }} />{cropName(x.k, lang)}</span><b className="tabular">{num((x.area / planned) * 100, lang)}%</b></li>)}</ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2"><h2 className="text-[19px] font-bold">{T('এখনো ঠিক করেননি', 'Not decided yet')}</h2><Tags list={['DEMO']} /></div>
            {undecided.length === 0 ? <p className="mt-2 text-[14px] text-muted">{T('এই ইউনিয়নের নমুনা কৃষকেরা সবাই পরিকল্পনা পাকা করেছেন।', 'All sample farmers in this union have confirmed their plans.')}</p> : (
              <ul className="mt-2 divide-y divide-border">{undecided.map((f) => <li key={f.id} className="flex items-center justify-between gap-2 py-2.5 text-[14.5px]"><Link to={`/officer/farmers/${f.id}`} className="font-semibold hover:text-primary-700">{L(f.name)}</Link><Badge tone="slate"><Phone size={12} />{T('ফোন করে জানান', 'Give a call')}</Badge></li>)}</ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
