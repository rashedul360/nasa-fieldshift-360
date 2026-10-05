import { useEffect, useState } from 'react';
import { CalendarDays, PackageCheck, Scale, Wheat, RefreshCw, ClipboardCheck } from 'lucide-react';
import { useStore } from '../../store';
import { PageHeader, Card, Button, WhyButton, Tags, Note, climateTag, climateSource, RISK_STYLE } from '../../components/ui';
import SupplyChart from '../../components/SupplyChart';
import { yieldRange } from '../../engine/harvest';
import { supplyCurve, normalWeekly, PRICE_DIP, weekOf } from '../../engine/glut';
import { DECIMAL_HA, MAUND_KG } from '../../engine/crops';
import { num, fmtDate, fmtRange, fmtBangla, daysBetween } from '../../engine/dates';
import { bnOf } from '../../engine/text';

export default function Harvest() {
  const { s, dispatch, T, L, toast, chosen, farmer, union, today, rotation: r } = useStore();
  const lang = s.lang;
  const crop = chosen.crop;
  const safety = chosen.bt.now.n ? chosen.bt.now.safe / chosen.bt.now.n : 1;
  const y = yieldRange(crop, farmer.area_dec, safety);
  const bins = supplyCurve(null, union.plans, crop.id);
  const mine = new Map();
  const myT = ((crop.yieldTHa[0] + crop.yieldTHa[1]) / 2) * farmer.area_dec * DECIMAL_HA;
  const w0 = weekOf(chosen.hw.start);
  crop.harvestWeeks.forEach((sh, i) => mine.set(w0 + i, myT * sh));
  const daysTo = daysBetween(today, chosen.hw.start);
  const saved = s.harvests[farmer.id] ?? null;
  const [qty, setQty] = useState(saved ? String(saved.q) : '');
  const [price, setPrice] = useState(saved?.p ? String(saved.p) : '');
  useEffect(() => { setQty(saved ? String(saved.q) : ''); setPrice(saved?.p ? String(saved.p) : ''); }, [farmer.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const est = (y.maundLow + y.maundHigh) / 2;
  const why = {
    title: T('ফসল তোলার সময় আর ফলন কীভাবে আন্দাজ করা', 'How the harvest dates and yield are estimated'), tags: [climateTag(), 'RULE', 'DEMO'],
    blocks: [{ h: T('পদ্ধতি', 'Method'), lines: [
      T(`ফসল পাকতে নির্দিষ্ট পরিমাণ গরম লাগে। লাগানোর দিন থেকে প্রতিদিনের তাপ (${num(crop.gddBase, 'bn')}° সেলসিয়াসের ওপরে যতটুকু) যোগ করে ${num(chosen.hw.gddTarget, 'bn')} হলে ফসল তোলা শুরু ধরা হয়েছে।`, `Crops need a set amount of warmth to ripen. Daily warmth above ${crop.gddBase} °C is added up from planting; harvest starts when it reaches ${chosen.hw.gddTarget}.`),
      T('দিন গোনা হয়েছে ২০১৩–২০২৫ সালের গড় তাপমাত্রা দিয়ে।', 'Days are counted using the average temperature for 2013–2025.'),
      T(`ফলন = জমির মাপ × হেক্টরপ্রতি ${num(crop.yieldTHa[0], 'bn', { dp: 1 })} থেকে ${num(crop.yieldTHa[1], 'bn', { dp: 1 })} টন (নমুনা)।${safety < 0.6 ? ' আবহাওয়ার ঝুঁকি বেশি বলে ওপরের সীমা ১৫% কমানো হয়েছে।' : ''}`, `Yield = field size × ${crop.yieldTHa[0]} to ${crop.yieldTHa[1]} tonnes per hectare (sample).${safety < 0.6 ? ' The upper end is cut by 15% because weather risk is high.' : ''}`),
      T('এটা পরিকল্পনার আন্দাজ। AI দিয়ে ফলন বা দামের পূর্বাভাস দেওয়া হয় না।', 'This is a planning estimate. No AI yield or price forecast is made.')] }],
    sources: [climateSource(lang)],
  };
  const record = (e) => {
    e.preventDefault();
    const q = Number(qty), p = Number(price);
    if (!(q > 0)) return;
    dispatch({ type: 'recordHarvest', id: farmer.id, value: { q, p: p > 0 ? p : null, crop: crop.id } });
    toast('ফসলের হিসাব রাখা হলো, পরের মৌসুমে কাজে লাগবে', 'Harvest saved for next season’s plan');
  };
  return (
    <div>
      <PageHeader eyebrow={T('ফসল তোলা ও বিক্রি', 'Harvest and sale')} title={T(`${bnOf(crop.name.bn)} ফসল কবে উঠবে`, `When your ${crop.name.en.toLowerCase()} will be ready`)}
        subtitle={T('এটা পরিকল্পনার আন্দাজ, নিশ্চিত পূর্বাভাস নয়।', 'A planning estimate, not a guaranteed forecast.')} tags={[climateTag(), 'RULE', 'DEMO']} action={<WhyButton payload={why} />} />
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[.75fr_1.25fr]">
          <div className="bg-paddy-50 p-7 text-center sm:p-9">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-paddy-500 shadow-sm"><Wheat size={38} /></div>
            <p className="mt-5 text-[15px] font-semibold text-paddy-700">{daysTo > 0 ? T('ফসল তুলতে বাকি আরও', 'Harvest starts in about') : T('ফসল তোলা চলছে', 'Harvest is under way')}</p>
            {daysTo > 0 && <div className="font-display mt-1 text-[52px] font-bold leading-none text-paddy-700 tabular">{num(daysTo, lang)} <span className="text-[24px]">{T('দিন', 'days')}</span></div>}
            <p className="mt-2 text-[13.5px] text-paddy-700/80">{T(`নমুনার আজকের তারিখ ${fmtDate(today, 'bn')} ধরে`, `Counting from the demo date, ${fmtDate(today, 'en')}`)}</p>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-3">
              {[[CalendarDays, T('ফসল তোলার সময়', 'Harvest weeks'), fmtRange(chosen.hw.start, chosen.hw.end, lang), T(`${fmtBangla(chosen.hw.start, 'bn')} থেকে`, `from ${fmtBangla(chosen.hw.start, 'en')}`)],
                [PackageCheck, T('আনুমানিক ফলন', 'Likely yield'), T(`${num(y.maundLow, 'bn')}–${num(y.maundHigh, 'bn')} মণ`, `${num(y.maundLow, 'en')}–${num(y.maundHigh, 'en')} maund`), T(`${num(farmer.area_dec, 'bn')} শতক জমিতে`, `on ${farmer.area_dec} decimal`)],
                [Scale, T('কেজিতে', 'In kilograms'), `${num(y.kgLow, lang)}–${num(y.kgHigh, lang)}`, T('মোটামুটি', 'roughly')]].map(([Icon, l, v, sub]) => (
                <div key={l} className="rounded-xl border border-border p-4"><Icon size={19} className="text-paddy-500" /><div className="mt-3 text-[13px] text-muted">{l}</div><div className="font-display mt-0.5 text-[18px] font-bold tabular">{v}</div><div className="text-[12.5px] text-muted">{sub}</div></div>
              ))}
            </div>
            <p className="mt-5 text-[14px] leading-6 text-muted">{T('হিসাবে ধরা হয়েছে: লাগানোর তারিখ, নাসার তাপমাত্রার তথ্য, জমির মাপ আর গত ২৫ মৌসুমের আবহাওয়ার ঝুঁকি।', 'Based on the planting date, NASA temperature data, your field size and 25 seasons of weather risk.')}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-[20px] font-bold">{T(`${union.meta.bn} ইউনিয়নে কোন সপ্তাহে কত ফসল`, `How much ${union.meta.en} harvests each week`)}</h2><span className={`chip !text-[13px] ${RISK_STYLE[chosen.glut.level].cls}`}>{T('দাম পড়ার ঝুঁকি', 'Price-drop risk')}: {L(RISK_STYLE[chosen.glut.level])}</span></div>
          <div className="mt-2"><SupplyChart bins={bins} mine={mine} normal={normalWeekly(union.area_dec, crop.id)} dip={PRICE_DIP[crop.id]} highlight={[...mine.keys()]} height={230} /></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-primary-500" />{T('ইউনিয়নের অন্যরা', 'Rest of the union')}</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-paddy-500" />{T('আপনার জমি', 'Your field')}</span>
            {PRICE_DIP[crop.id] && <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-paddy-100" />{T('সাধারণত দাম পড়ে (নমুনা)', 'Prices usually fall (sample)')}</span>}
          </div>
          <Note className="mt-4">{T('দাম পড়ার সপ্তাহের আগে বিক্রি করতে পারলে ভালো। কৃষি কর্মকর্তা কয়েকজনের ফসল একসঙ্গে করে পাইকারের সঙ্গে কথা বলিয়ে দিতে পারেন। এখানে কেনাবেচা বা টাকা লেনদেন হয় না।', 'Selling before the price dip helps. Your officer can group several farmers’ produce and put you in touch with traders. No buying, selling or payment happens here.')}</Note>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[20px] font-bold"><ClipboardCheck size={20} className="text-primary-600" />{T('ফসল তোলার পর লিখে রাখুন', 'After harvest, write it down')}</h2>
          <p className="mt-1 text-[14px] text-muted">{T('কত পেলেন আর কত দামে বেচলেন — পরের মৌসুমের হিসাব আরও ঠিক হবে।', 'How much you got and the price you sold at — next season’s plan gets better.')}</p>
          <form onSubmit={record} className="mt-4 space-y-3">
            <label className="block" htmlFor="h-qty"><span className="text-[14.5px] font-semibold">{T('মোট ফসল (মণ)', 'Total harvest (maund)')}</span>
              <input id="h-qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ''))} className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-[15px] outline-none focus:border-primary-400" placeholder={T(`যেমন ${num(est, 'bn')}`, `e.g. ${num(est, 'en')}`)} />
            </label>
            <label className="block" htmlFor="h-price"><span className="text-[14.5px] font-semibold">{T('গড় বিক্রির দাম (টাকা/কেজি)', 'Average price (taka per kg)')} <span className="font-normal text-muted">{T('(না দিলেও চলবে)', '(optional)')}</span></span>
              <input id="h-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))} className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-[15px] outline-none focus:border-primary-400" />
            </label>
            <Button type="submit" className="w-full" disabled={!(Number(qty) > 0)}>{saved ? T('হিসাব বদলে রাখুন', 'Update') : T('হিসাব রাখুন', 'Save')}</Button>
          </form>
          {saved && (
            <div className="mt-4 space-y-2">
              <Note tone="ok">{T(`আন্দাজ ছিল প্রায় ${num(est, 'bn')} মণ, পেয়েছেন ${num(saved.q, 'bn')} মণ${saved.p ? `; বিক্রি প্রায় ৳${num(saved.q * MAUND_KG * saved.p, 'bn')}` : ''}।`, `We estimated about ${num(est, 'en')} maund; you got ${num(saved.q, 'en')}${saved.p ? `, worth about ৳${num(saved.q * MAUND_KG * saved.p, 'en')}` : ''}.`)}</Note>
              <div className="rounded-xl border border-primary-100 bg-primary-50 p-3.5 text-[14.5px]">
                <div className="flex items-center gap-1.5 font-bold text-primary-800"><RefreshCw size={15} />{T('পরের মৌসুম', 'Next season')}</div>
                <div className="mt-1 text-primary-900">{r.best ? T(`${crop.name.bn}, তারপর ${r.best.crop.name.bn}, তারপর বর্ষায় রোপা আমন`, `${crop.name.en}, then ${r.best.crop.name.en.toLowerCase()}, then transplanted Aman in the monsoon`) : T('সরাসরি রোপা আমন', 'Straight to transplanted Aman')}</div>
                <Button to="/farmer/plan" onClick={() => dispatch({ type: 'set', patch: { step: 5 } })} variant="ghost" className="mt-1 !px-0 text-primary-700">{T('পরিকল্পনায় দেখুন', 'Open in the planner')}</Button>
              </div>
            </div>
          )}
          <div className="mt-3"><Tags list={['RULE']} /></div>
        </Card>
      </div>
    </div>
  );
}
