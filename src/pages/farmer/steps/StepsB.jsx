// Season planner steps 5–7: the recommendation, the next crop, and the price-drop (glut) check.
import { Droplet, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../../store';
import { StepHeader, Card, Tags, WhyButton, Note, ScoreRing, MiniBar, LABEL_STYLE, RISK_STYLE, climateTag, soilTag, climateSource, soilSource, Button } from '../../../components/ui';
import SupplyChart from '../../../components/SupplyChart';
import SeasonRibbon from '../../../components/SeasonRibbon';
import Photo from '../../../components/Photo';
import { W_LABEL } from './StepsA.jsx';
import { cropName, DECIMAL_HA } from '../../../engine/crops.js';
import { PRIORITIES } from '../../../engine/decision.js';
import { num, fmtDate, fmtRange, fmtBangla, bnDigits } from '../../../engine/dates.js';
import { supplyCurve, normalWeekly, PRICE_DIP, slotLoad, slotOf, weekOf, weekStart } from '../../../engine/glut.js';

export const shiftLabel = (shift, T) => (shift === 0 ? T('স্বাভাবিক সময়ে', 'at the usual time') : shift < 0 ? T('দুই সপ্তাহ আগে', 'two weeks earlier') : T('দুই সপ্তাহ পরে', 'two weeks later'));
const WATER_DROPS = { High: 3, Medium: 2, 'Low-Medium': 1.5, Low: 1 };
const WATER_WORD = { High: { bn: 'বেশি', en: 'High' }, Medium: { bn: 'মাঝারি', en: 'Medium' }, 'Low-Medium': { bn: 'কম-মাঝারি', en: 'Low to medium' }, Low: { bn: 'কম', en: 'Low' } };
function WaterNeed({ level }) {
  const { L } = useStore();
  const n = WATER_DROPS[level];
  return (
    <span className="inline-flex items-center gap-1" title={L(WATER_WORD[level])}>
      {[0, 1, 2].map((i) => <Droplet key={i} size={14} className={i < Math.floor(n) ? 'fill-sky-500 text-sky-500' : i < n ? 'fill-sky-200 text-sky-400' : 'text-black/15'} />)}
      <span className="ml-0.5">{L(WATER_WORD[level])}</span>
    </span>
  );
}

export function optionWhy(o, d, ctx) {
  const { T, L, s } = ctx;
  const lang = s.lang;
  const rules = o.crop.rules.map((r) => {
    const bad = o.bt.seasons.filter((x) => x.fired.includes(r.id)).map((x) => x.season);
    return `${L(r)}। ${bad.length ? T(`এমন হয়েছিল ${bnDigits(bad.join(', '))} সালে।`, `This happened in ${bad.join(', ')}.`) : T('গত ২৫ মৌসুমে একবারও হয়নি।', 'It did not happen once in 25 seasons.')}`;
  });
  return {
    title: `${L(o.crop.name)}, ${shiftLabel(o.shift, T)} (${fmtDate(o.t0, lang)})`,
    tags: [climateTag(), soilTag(), 'RULE', 'DEMO'],
    blocks: [
      { h: T('নম্বর কীভাবে এল', 'How the score adds up'), table: {
        totalRow: true,
        head: [T('বিষয়', 'Factor'), T('নম্বর (১০০-র মধ্যে)', 'Score (of 100)'), T('ওজন', 'Weight'), T('যোগ হলো', 'Adds')],
        rows: [...Object.entries(d.weights).filter(([, w]) => w > 0).map(([k, w]) => [L(W_LABEL[k]), num(o.comp[k], lang), `${num(w * 100, lang)}%`, num(w * o.comp[k], lang, { dp: 1 })]),
          [T('মোট', 'Total'), '', '', num(o.score, lang, { dp: 1 })]],
      } },
      { h: T('গত ২৫ মৌসুমে এই ফসল এই সময়ে লাগালে কী হতো', 'What would have happened in the last 25 seasons'), lines: [
        T(`ঠিকঠাক গেছে: ২০০১–২০১২-এ ${bnDigits(o.bt.then.n)}টির মধ্যে ${bnDigits(o.bt.then.safe)}টি, ২০১৩–২০২৫-এ ${bnDigits(o.bt.now.n)}টির মধ্যে ${bnDigits(o.bt.now.safe)}টি মৌসুম।`, `Went fine: ${o.bt.then.safe} of ${o.bt.then.n} seasons in 2001–2012, ${o.bt.now.safe} of ${o.bt.now.n} in 2013–2025.`),
        ...rules] },
      { h: T('মাটি', 'Soil'), lines: o.soilNotes.map(L) },
      { h: T('আর যা ধরা হয়েছে', 'Also counted'), lines: [
        T(`সেচ লাগে ${WATER_WORD[o.crop.water].bn}; আপনার সেচের উৎস ধরে পানির নম্বর ${bnDigits(Math.round(o.comp.W))}।`, `Needs ${WATER_WORD[o.crop.water].en.toLowerCase()} water; with your water source that scores ${Math.round(o.comp.W)}.`),
        T(`বিঘাপ্রতি লাভ আনুমানিক ৳${num(o.profit.low, 'bn')} থেকে ৳${num(o.profit.high, 'bn')} (নমুনা দাম ও খরচ ধরে)।`, `Profit per bigha roughly ৳${num(o.profit.low, 'en')} to ৳${num(o.profit.high, 'en')} (sample prices and costs).`),
        T(`ইউনিয়নে দাম পড়ার ঝুঁকি: ${RISK_STYLE[o.glut.level].bn}।`, `Price-drop risk in your union: ${o.glut.level.toLowerCase()}.`),
        T(`ফসল তোলা আনুমানিক ${fmtRange(o.hw.start, o.hw.end, 'bn')}।`, `Harvest roughly ${fmtRange(o.hw.start, o.hw.end, 'en')}.`)] },
      { h: T('মনে রাখবেন', 'Keep in mind'), lines: [T('এটা সিদ্ধান্ত নিতে সাহায্যের হিসাব, কোনো নিশ্চয়তা নয়। ফসলের সীমাগুলো কৃষিবিদ দিয়ে যাচাই করে নিতে হবে।', 'This helps you decide; it is not a guarantee. The crop thresholds still need an agronomist to check them.')] },
    ],
    sources: [climateSource(lang), soilSource(lang), T('দাম ও খরচ: নমুনা তথ্য', 'Prices and costs: sample data')],
  };
}

// ---------- 5. Keep / Adjust / Shift ----------
export function StepDecision() {
  const ctx = useStore();
  const { s, dispatch, T, L, decision: d, chosen, farmer } = ctx;
  const lang = s.lang;
  const st = LABEL_STYLE[d.label];
  const rec = d.rec;
  const when = T(`${fmtBangla(rec.t0, 'bn')} (${fmtDate(rec.t0, 'bn')})`, `${fmtDate(rec.t0, 'en')} (${fmtBangla(rec.t0, 'en')})`);
  const sentence = d.label === 'SHIFT'
    ? T(`এবার ${cropName(farmer.last_crop, 'bn')} না করে ${rec.crop.name.bn} করুন। ${rec.crop.action.bn} ${when}।`, `Grow ${rec.crop.name.en.toLowerCase()} instead of ${cropName(farmer.last_crop, 'en').toLowerCase()}. ${rec.crop.action.en} around ${when}.`)
    : d.label === 'ADJUST'
      ? T(`${rec.crop.name.bn}ই করুন, তবে ${shiftLabel(rec.shift, T)}। ${rec.crop.action.bn} ${when}।`, `Stay with ${rec.crop.name.en.toLowerCase()} but plant ${shiftLabel(rec.shift, T)}, around ${when}.`)
      : T(`${rec.crop.name.bn}ই স্বাভাবিক সময়ে করুন। ${rec.crop.action.bn} ${when}।`, `Stay with ${rec.crop.name.en.toLowerCase()} at the usual time, around ${when}.`);
  return (
    <div>
      <StepHeader kicker={T('ধাপ ৫, পরামর্শ', 'Step 5, recommendation')} title={T('এই রবিতে কী করবেন', 'What to do this Rabi')}
        sub={s.priorities.length ? T(`আপনার চাওয়া ধরে: ${s.priorities.map((p) => PRIORITIES[p].bn).join(' আর ')}`, `Based on what you chose: ${s.priorities.map((p) => PRIORITIES[p].en.toLowerCase()).join(' and ')}`) : T('কোনো চাওয়া বাছা হয়নি, তাই সব দিক সমান ধরে হিসাব।', 'No priorities picked, so every factor counts equally.')}
        tags={[climateTag(), soilTag(), 'RULE']} />
      <div className={`rounded-[20px] ${st.bg} p-5 text-white shadow-[var(--shadow-card)]`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[14px] text-white/80">{T('আমাদের পরামর্শ', 'Our recommendation')}</div>
            <div className="font-display mt-1 text-[32px] font-bold leading-[1.1] sm:text-[38px]">{L(st)}</div>
          </div>
          <div className="rounded-full bg-white p-1"><ScoreRing value={rec.score} size={60} /></div>
        </div>
        <p className="mt-3 text-[17px] font-medium leading-7">{sentence}</p>
        {d.caution && <p className="mt-2 text-[14px] text-white/85">{T('সাবধান: কোনো ফসলের নম্বরই খুব ভালো নয়। সিদ্ধান্তের আগে কৃষি কর্মকর্তার সঙ্গে কথা বলুন।', 'Careful: no option scores well. Talk to your agriculture officer before deciding.')}</p>}
        <div className="mt-4"><WhyButton inverse payload={optionWhy(rec, d, ctx)} /></div>
      </div>
      <h3 className="mt-6 text-[18px] font-bold">{T('সব ফসল পাশাপাশি', 'All the options side by side')}</h3>
      <p className="text-[14px] text-muted">{T('প্রতিটি ফসল তিনটি তারিখে (দুই সপ্তাহ আগে, স্বাভাবিক সময়, দুই সপ্তাহ পরে) যাচাই করা হয়েছে; এখানে প্রত্যেকটির সবচেয়ে ভালো তারিখ দেখানো হলো।', 'Each crop was checked at three dates (two weeks earlier, usual, two weeks later); its best date is shown here.')}</p>
      <div className="mt-3 space-y-2.5">
        {d.options.map((o) => {
          const isRec = o.crop.id === rec.crop.id && o.shift === rec.shift;
          const isChosen = o.crop.id === chosen.crop.id && o.shift === chosen.shift;
          const isCur = o.crop.id === farmer.last_crop;
          return (
            <Card key={o.crop.id} className={`p-4 ${isChosen ? 'ring-2 ring-primary-600' : ''}`}>
              <div className="flex items-start gap-3">
                <ScoreRing value={o.score} size={50} color={isRec ? '#2f6e2f' : '#8a9a8f'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-display text-[19px] font-bold">{L(o.crop.name)}</span>
                    {isCur && <span className="chip bg-black/5 text-ink/70">{T('গতবারের ফসল', 'your last crop')}</span>}
                    {isRec && <span className="chip bg-primary-700 text-white">{T('পরামর্শ', 'recommended')}</span>}
                  </div>
                  <div className="text-[13.5px] text-muted">{L(o.crop.action)} {fmtDate(o.t0, lang)}, {shiftLabel(o.shift, T)}</div>
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-[13.5px] sm:grid-cols-2">
                    <div className="flex gap-1.5"><dt className="text-muted">{T('ঠিকঠাক মৌসুম', 'Good seasons')}</dt><dd className="font-semibold tabular">{T(`${bnDigits(o.bt.now.n)}টির মধ্যে ${bnDigits(o.bt.now.safe)}টি`, `${o.bt.now.safe} of ${o.bt.now.n}`)} <span className="font-normal text-muted">{T(`(আগে ${bnDigits(o.bt.then.safe)}/${bnDigits(o.bt.then.n)})`, `(was ${o.bt.then.safe}/${o.bt.then.n})`)}</span></dd></div>
                    <div className="flex gap-1.5"><dt className="text-muted">{T('সেচ', 'Water')}</dt><dd><WaterNeed level={o.crop.water} /></dd></div>
                    <div className="flex gap-1.5"><dt className="text-muted">{T('লাভ/বিঘা', 'Profit/bigha')}</dt><dd className="font-semibold tabular">৳{num(o.profit.low / 1000, lang)}–{num(o.profit.high / 1000, lang)} {T('হাজার', 'k')}</dd></div>
                    <div className="flex gap-1.5"><dt className="text-muted">{T('দাম পড়ার ঝুঁকি', 'Price-drop risk')}</dt><dd><span className={`chip ${RISK_STYLE[o.glut.level].cls}`}>{L(RISK_STYLE[o.glut.level])}</span></dd></div>
                  </dl>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <WhyButton small payload={optionWhy(o, d, ctx)} />
                <button type="button" onClick={() => dispatch({ type: 'set', patch: { pick: { crop: o.crop.id, shift: o.shift } } })} aria-pressed={isChosen}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-semibold ${isChosen ? 'bg-primary-700 text-white' : 'bg-primary-50 text-primary-800 hover:bg-primary-100'}`}>
                  {isChosen ? <><CheckCircle2 size={15} />{T('এটা বেছে নিয়েছেন', 'Your choice')}</> : T('এটা বেছে নিন', 'Choose this')}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] text-muted">{T('লাভের হিসাব নমুনা দাম ও খরচ দিয়ে করা।', 'Profit uses sample prices and costs.')} <Tags list={['DEMO']} /></p>
    </div>
  );
}

// ---------- 6. Next crop ----------
export function StepRotation() {
  const ctx = useStore();
  const { s, T, L, rotation: r, chosen } = ctx;
  const lang = s.lang;
  const b = r.best;
  const why = b && {
    title: T(`পরের ফসল: ${b.crop.name.bn}`, `Next crop: ${b.crop.name.en}`), tags: [climateTag(), soilTag(), 'RULE'],
    blocks: [
      { h: T('নম্বর', 'Score'), table: { head: [T('বিষয়', 'Factor'), T('নম্বর', 'Score'), T('ওজন', 'Weight')], rows: [
        [T('মাটির উপকার', 'Good for the soil'), num(b.comp.soil, lang), `${num(r.weights.soil * 100, lang)}%`],
        [T('আলাদা গোত্রের ফসল', 'Different crop family'), num(b.comp.family, lang), `${num(r.weights.family * 100, lang)}%`],
        [T('সেচের পানি', 'Water'), num(b.comp.water, lang), `${num(r.weights.water * 100, lang)}%`],
        [T('আবহাওয়া (২০১৩–২০২৫)', 'Weather (2013–2025)'), num(b.comp.climate, lang), `${num(r.weights.climate * 100, lang)}%`],
        [T('সময়ে কুলোয় কিনা', 'Fits the gap'), num(b.comp.window, lang), `${num(r.weights.window * 100, lang)}%`]] } },
      { h: T('কারণ', 'Reasons'), lines: b.why.map(L) },
      { h: T('সময়', 'Timing'), lines: [T(`${chosen.crop.name.bn} তোলা শেষ হবে মোটামুটি ${fmtBangla(chosen.hw.end, 'bn')} (${fmtDate(chosen.hw.end, 'bn')})। এক সপ্তাহ জমি তৈরি করে ${fmtBangla(r.sowT, 'bn')} নাগাদ বোনা যাবে।`, `${chosen.crop.name.en} finishes around ${fmtDate(chosen.hw.end, 'en')}. After a week to prepare the land, sow around ${fmtDate(r.sowT, 'en')}.`)] },
    ],
    sources: [climateSource(lang), soilSource(lang)],
  };
  return (
    <div>
      <StepHeader kicker={T('ধাপ ৬, পরের মৌসুম', 'Step 6, next season')} title={T('এই ফসলের পর কী লাগাবেন', 'What to grow after this crop')}
        sub={T('এটা আপনার জমির জন্য একটা পরামর্শ, সবার জন্য এক নিয়ম নয়।', 'A suggestion for your field, not a rule for everyone.')} tags={[climateTag(), soilTag(), 'RULE']} />
      <Card className="p-4">
        <div className="mb-2 text-[14px] font-semibold">{T('বাংলা মাসে পুরো বছরের পরিকল্পনা', 'The year, by Bangla month')}</div>
        <SeasonRibbon compact />
      </Card>
      <Card className="mt-4 overflow-hidden">
        <div className="grid sm:grid-cols-[1fr_1.4fr]">
          <div className="relative min-h-[160px]"><Photo name="seedlings" fill sizes="300px" /></div>
          <div className="p-5">
            {b ? (
              <>
                <div className="text-[14px] text-muted">{T(`${chosen.crop.name.bn} তোলার পর`, `After the ${chosen.crop.name.en.toLowerCase()}`)}</div>
                <div className="font-display text-[28px] font-bold text-sky-700">{L(b.crop.name)}</div>
                <div className="text-[14px] text-muted">{T(`বোনা ${fmtBangla(r.sowT, 'bn')} (${fmtDate(r.sowT, 'bn')}) নাগাদ, তারপর বর্ষায় রোপা আমন`, `Sow around ${fmtDate(r.sowT, 'en')}, then transplanted Aman in the monsoon`)}</div>
                <ul className="mt-3 space-y-1.5">{b.why.map((w, i) => <li key={i} className="flex gap-2 text-[14.5px] leading-6"><CheckCircle2 size={16} className="mt-1 shrink-0 text-primary-600" />{L(w)}</li>)}</ul>
                <div className="mt-3"><WhyButton payload={why} /></div>
              </>
            ) : (
              <>
                <div className="font-display text-[24px] font-bold">{T('সরাসরি রোপা আমন', 'Straight to transplanted Aman')}</div>
                <p className="mt-2 text-[15px] leading-7 text-muted">{T(`${chosen.crop.name.bn} তুলতে দেরি হয়, তাই মাঝে আরেকটা ফসলের সময় থাকে না। মাটির জন্য আগামী রবিতে মসুর বা সরিষা ভেবে দেখুন।`, `${chosen.crop.name.en} is harvested late, leaving no gap for another crop. For the soil, think about lentil or mustard next Rabi.`)}</p>
              </>
            )}
          </div>
        </div>
      </Card>
      {r.alternatives.length > 0 && (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {r.alternatives.map((a) => (
            <Card key={a.crop.id} className="flex items-start gap-3 p-4">
              <ScoreRing value={a.score} size={40} color="#8a9a8f" />
              <div className="min-w-0"><div className="font-semibold">{T('অথবা', 'Or')} {L(a.crop.name)}</div><div className="text-[13.5px] leading-snug text-muted">{L(a.why[0])}</div></div>
            </Card>
          ))}
        </div>
      )}
      {r.closed.length > 0 && <p className="mt-2 text-[13.5px] text-muted">{T('সময়ে কুলোবে না: ', 'Not enough time for: ')}{r.closed.map((c) => L(c.crop.name)).join(', ')}</p>}
      <Note tone="gold" className="mt-4">{L(r.nextRabiCaution)}</Note>
    </div>
  );
}

// ---------- 7. Price-drop check ----------
export function StepGlut() {
  const ctx = useStore();
  const { s, dispatch, T, L, toast, decision: d, chosen, union, farmer, confirmedPlan } = ctx;
  const lang = s.lang;
  const crop = chosen.crop;
  const bins = supplyCurve(null, union.plans, crop.id);
  const mine = new Map();
  const myT = ((crop.yieldTHa[0] + crop.yieldTHa[1]) / 2) * farmer.area_dec * DECIMAL_HA;
  const w0 = weekOf(chosen.hw.start);
  crop.harvestWeeks.forEach((sh, i) => mine.set(w0 + i, myT * sh));
  const normal = normalWeekly(union.area_dec, crop.id);
  const g = chosen.glut;
  const same = confirmedPlan && confirmedPlan.crop === crop.id && confirmedPlan.date === chosen.t0;
  const alts = d.all.filter((o) => o.crop.id === crop.id).sort((a, b) => a.shift - b.shift);
  const slots = crop.id === 'tomato' ? slotLoad(union) : null;
  const mySlot = slotOf(chosen.t0);
  const why = {
    title: T('দাম পড়ার ঝুঁকি কীভাবে বের হয়', 'How the price-drop risk is worked out'), tags: ['RULE', 'DEMO'],
    blocks: [
      { h: T('হিসাব', 'The calculation'), lines: [
        T('ইউনিয়নের সব কৃষকের পরিকল্পনা যোগ করে দেখা হয় কোন সপ্তাহে কত টন ফসল উঠবে (জমি × গড় ফলন × সেই সপ্তাহের ভাগ)।', 'Every farmer’s plan in the union is added up into tonnes per harvest week (area × average yield × that week’s share).'),
        T('লাল দাগ: সাধারণ সপ্তাহের চেয়ে ১.৩ গুণ বেশি ফসল।', 'Red line: 1.3 times a normal week’s supply.'),
        T('হলুদ ছায়া: যে সপ্তাহগুলোতে সাধারণত দাম পড়ে যায় (নমুনা)।', 'Gold band: weeks when prices usually fall (sample).'),
        T('কোনো সপ্তাহ "বেশি" ঝুঁকির হয় যখন ফসল লাল দাগের ওপরে আর দামও পড়ার সময়। দুটোর একটা হলে "মাঝারি"।', 'A week is high-risk when supply is above the red line and it falls in the price-dip weeks; one of the two makes it medium.'),
        T('আপনার ফসলের অর্ধেক বা বেশি "বেশি" ঝুঁকির সপ্তাহে উঠলে আপনার ঝুঁকি বেশি।', 'If half or more of your harvest lands in high-risk weeks, your risk is high.')] },
      { h: T('আপনার জমির হিসাব', 'Your field'), lines: g.detail.map((x) => T(`${fmtDate(weekStart(x.week), 'bn')}-এর সপ্তাহে ইউনিয়নে ${num(x.supply, 'bn', { dp: 1 })} টন, ঝুঁকি ${RISK_STYLE[x.level].bn}${x.inDip ? ', দাম পড়ার সময়' : ''}`, `Week of ${fmtDate(weekStart(x.week), 'en')}: ${num(x.supply, 'en', { dp: 1 })} t in the union, ${x.level.toLowerCase()} risk${x.inDip ? ', in a price-dip week' : ''}`)) },
    ],
    sources: [T('কৃষকদের পরিকল্পনা, সাধারণ সপ্তাহের ফসল আর দাম পড়ার সময়: নমুনা তথ্য', 'Farmer plans, normal supply and price-dip weeks: sample data'), climateSource(lang)],
  };
  const confirm = () => {
    dispatch({ type: 'confirmPlan', plan: { plot_id: farmer.id, crop: crop.id, date: chosen.t0, area_dec: farmer.area_dec, union: farmer.union } });
    toast('পরিকল্পনা পাকা হয়েছে, কৃষি কর্মকর্তা দেখতে পাবেন', 'Plan confirmed. Your officer can now see it.');
  };
  return (
    <div>
      <StepHeader kicker={T('ধাপ ৭, দাম পড়ার ঝুঁকি', 'Step 7, price-drop check')} title={T('সবাই একই ফসল করলে দাম পড়ে যায়', 'When everyone grows the same crop, prices fall')}
        sub={T(`${union.meta.bn} ইউনিয়নে যত জমির পরিকল্পনা হয়েছে, তার ${num(g.share * 100, 'bn')}%-এ ${crop.name.bn}।`, `${num(g.share * 100, 'en')}% of the planned land in ${union.meta.en} is ${crop.name.en.toLowerCase()}.`)} tags={['RULE', 'DEMO']} />
      <Card className="p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[15px] font-semibold">{T(`${crop.name.bn}: কোন সপ্তাহে কত টন উঠবে`, `${crop.name.en}: tonnes ready each week`)}</div>
          <span className={`chip !text-[13px] ${RISK_STYLE[g.level].cls}`}>{T('আপনার ঝুঁকি', 'Your risk')}: {L(RISK_STYLE[g.level])}</span>
        </div>
        <SupplyChart bins={bins} mine={mine} normal={normal} dip={PRICE_DIP[crop.id]} highlight={g.weeks} height={210} />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-primary-500" />{T('ইউনিয়নের অন্যরা', 'Rest of the union')}</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-paddy-500" />{T('আপনার জমি', 'Your field')}</span>
          {PRICE_DIP[crop.id] && <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-paddy-100" />{T('সাধারণত দাম পড়ে', 'Prices usually fall')}</span>}
          <WhyButton small payload={why} />
        </div>
      </Card>
      <h3 className="mt-6 text-[17px] font-bold">{T('লাগানোর তারিখ বদলে দেখুন', 'Try another planting date')}</h3>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {alts.map((o) => {
          const on = o.shift === chosen.shift;
          return (
            <button key={o.shift} type="button" onClick={() => dispatch({ type: 'set', patch: { pick: { crop: o.crop.id, shift: o.shift } } })} aria-pressed={on}
              className={`rounded-xl border p-3 text-left transition ${on ? 'border-primary-700 bg-primary-50 ring-2 ring-primary-200' : 'border-border bg-white hover:border-primary-300'}`}>
              <div className="text-[12.5px] text-muted">{shiftLabel(o.shift, T)}</div>
              <div className="font-display text-[17px] font-bold">{fmtDate(o.t0, lang)}</div>
              <div className="text-[12.5px] text-muted">{fmtBangla(o.t0, lang)}</div>
              <span className={`chip mt-1.5 ${RISK_STYLE[o.glut.level].cls}`}>{T('ঝুঁকি', 'Risk')} {L(RISK_STYLE[o.glut.level])}</span>
            </button>
          );
        })}
      </div>
      {slots && (
        <Card className="mt-4 p-4">
          <div className="mb-1 text-[15px] font-semibold">{T('ইউনিয়নে টমেটো লাগানোর পালা', 'Tomato planting slots in the union')}</div>
          <p className="mb-3 text-[13.5px] text-muted">{T('একটা পালা ভরে গেলে পরের জনকে অন্য সময় বা অন্য ফসল দেওয়া হয়, যাতে ভিড় শুধু এক সপ্তাহ থেকে আরেক সপ্তাহে না সরে।', 'Once a slot fills, the next farmer is offered another date or crop, so the rush does not just move to a different week.')}</p>
          <div className="space-y-2">
            {slots.map((sl) => (
              <div key={sl.id} className="grid grid-cols-[minmax(0,150px)_1fr_56px] items-center gap-2 text-[13.5px]">
                <span className={sl.id === mySlot ? 'font-bold text-primary-800' : 'text-ink/70'}>{fmtRange(sl.from, sl.to, lang)}</span>
                <MiniBar value={(sl.load / sl.cap) * 100} color={sl.full ? 'bg-red-500' : 'bg-primary-500'} />
                <span className={`text-right ${sl.full ? 'font-semibold text-red-700' : 'text-muted'}`}>{sl.full ? T('ভরা', 'full') : `${num((sl.load / sl.cap) * 100, lang)}%`}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {g.level === 'High' && <Note tone="warn" className="mt-4">{T('ঝুঁকি বেশি। অন্য তারিখ বেছে নিন, অথবা জমির অর্ধেকে মসুর বা সরিষার মতো অন্য ফসল দিন।', 'High risk. Pick another date, or put half the field under another crop such as lentil or mustard.')}</Note>}
      <div className="mt-5 rounded-2xl border border-primary-200 bg-primary-50 p-4">
        <div className="text-[15px] font-semibold text-primary-900">{same ? T('আপনার পরিকল্পনা পাকা করা আছে', 'Your plan is confirmed') : T('ঠিক করলে পরিকল্পনা পাকা করুন', 'Happy with it? Confirm your plan')}</div>
        <p className="mt-1 text-[14px] leading-6 text-primary-900/80">{T('পাকা করলে আপনার ইউনিয়নের কৃষি কর্মকর্তা পরিকল্পনাটা দেখতে পাবেন, আর ইউনিয়নের ফসলের হিসাবে আপনার জমিও যোগ হবে।', 'Once confirmed, your union’s officer can see it and your field is counted in the union’s harvest totals.')}</p>
        <Button onClick={confirm} disabled={same} className="mt-3 w-full py-3">
          {same ? <><CheckCircle2 size={18} />{T('পাকা করা হয়েছে', 'Confirmed')}</> : T(`পাকা করুন: ${crop.name.bn}, ${fmtDate(chosen.t0, 'bn')}`, `Confirm: ${crop.name.en}, ${fmtDate(chosen.t0, 'en')}`)}
        </Button>
      </div>
    </div>
  );
}
