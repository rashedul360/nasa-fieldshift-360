import { CheckCircle2, Layers, Sprout } from 'lucide-react';
import { useStore } from '../../store';
import { Card, Button, Badge, Tags, soilTag } from '../../components/ui';
import Photo from '../../components/Photo';
import LandPicker from '../../components/LandPicker';
import { num, fmtDate, fmtBangla } from '../../engine/dates';

const LEVEL = { 'very low': { bn: 'খুব কম', en: 'Very low' }, low: { bn: 'কম', en: 'Low' }, medium: { bn: 'মাঝারি', en: 'Medium' }, optimum: { bn: 'যথেষ্ট', en: 'Good' }, high: { bn: 'বেশি', en: 'High' } };

export default function MyFarm() {
  const { s, dispatch, T, L, farmer, union, soil, chosen, confirmedPlan, landConfirmed } = useStore();
  const lang = s.lang;
  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-[24px] bg-primary-950 text-white">
        <div className="absolute inset-0 -z-10"><Photo name="landParcels" fill sizes="(min-width: 1200px) 1200px, 100vw" priority /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,38,20,.9)_0%,rgba(13,38,20,.65)_50%,rgba(13,38,20,.2)_100%)]" /></div>
        <div className="max-w-2xl p-6 sm:p-8">
          <p className="text-[15px] text-white/80">{T('আমার জমি', 'My field')}</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight sm:text-[38px]">{T('মানচিত্রে আপনার জমিটা দেখিয়ে দিন', 'Show us your field on the map')}</h1>
          <p className="mt-3 text-[15.5px] leading-7 text-white/85">{T('গ্রামের নাম লিখে খুঁজুন, উপগ্রহের ছবিতে নিজের জমি চিনে পিন বসান, তারপর মাপ আর সেচের উৎস দিয়ে নিশ্চিত করুন।', 'Search your village, find your field on the satellite picture and drop the pin, then add the size and water source and confirm.')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {landConfirmed ? <Badge tone="dark" className="!border-white/30 !bg-white/15"><CheckCircle2 size={13} />{T('জমি নিশ্চিত করা আছে', 'Field confirmed')}</Badge> : <Badge tone="amber">{T('জমি এখনো নিশ্চিত হয়নি', 'Field not confirmed yet')}</Badge>}
            <Tags list={['DEMO']} />
          </div>
        </div>
      </section>

      <Card className="p-4 sm:p-5">
        <LandPicker height={460} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-[20px] font-bold"><Sprout size={19} className="text-primary-600" />{T('এই মৌসুমের পরিকল্পনা', 'This season’s plan')}</h2>{confirmedPlan ? <Badge><CheckCircle2 size={13} />{T('পাকা', 'Confirmed')}</Badge> : <Badge tone="amber">{T('পাকা হয়নি', 'Not confirmed')}</Badge>}</div>
          <dl className="mt-4 divide-y divide-border text-[15px]">
            {[[T('ফসল', 'Crop'), L(chosen.crop.name)], [T('লাগানো', 'Planting'), `${fmtDate(chosen.t0, lang)} (${fmtBangla(chosen.t0, lang)})`], [T('ফসল তোলা', 'Harvest'), `${fmtDate(chosen.hw.start, lang)} – ${fmtDate(chosen.hw.end, lang)}`], [T('নম্বর', 'Score'), num(chosen.score, lang)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
            ))}
          </dl>
          <Button to="/farmer/plan" onClick={() => dispatch({ type: 'set', patch: { step: confirmedPlan ? 4 : 1 } })} className="mt-4 w-full">{confirmedPlan ? T('পরিকল্পনা দেখুন', 'Review the plan') : T('মৌসুমের পরিকল্পনা করুন', 'Plan the season')}</Button>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-[20px] font-bold"><Layers size={19} className="text-clay-500" />{T(`${union.meta.bn} ইউনিয়নের মাটি`, `Soil in ${union.meta.en}`)}</h2><Tags list={[soilTag()]} /></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-clay-50 p-3"><div className="text-[12.5px] text-clay-700">pH</div><div className="font-display text-[20px] font-bold tabular">{num(soil.ph, lang, { dp: 1 })}</div></div>
            <div className="rounded-xl bg-clay-50 p-3"><div className="text-[12.5px] text-clay-700">{T('জৈব পদার্থ', 'Organic matter')}</div><div className="font-display text-[20px] font-bold tabular">{num(soil.om_pct, lang, { dp: 1 })}%</div></div>
            <div className="rounded-xl bg-clay-50 p-3"><div className="text-[12.5px] text-clay-700">{T('পানি নামে', 'Drainage')}</div><div className="text-[15px] font-bold">{{ poor: T('ধীরে', 'Slowly'), imperfect: T('মাঝারি', 'Fair'), good: T('দ্রুত', 'Quickly') }[soil.drainage]}</div></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[13px]">{[[T('নাইট্রোজেন', 'Nitrogen'), soil.n_level], [T('ফসফরাস', 'Phosphorus'), soil.p_level], [T('পটাশ', 'Potash'), soil.k_level]].map(([k, v]) => <span key={k} className="chip bg-black/5 text-ink/75">{k}: {L(LEVEL[v])}</span>)}</div>
          <p className="mt-3 text-[13.5px] text-muted">{soil.aez}. {T('এটা ইউনিয়নের মাটির সাধারণ চিত্র, এই জমির মাটি পরীক্ষা নয়।', 'This is the union’s soil in general, not a test of this field.')}</p>
        </Card>
      </div>
    </div>
  );
}
