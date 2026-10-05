import { Link } from 'react-router-dom';
import { Droplets, ScanLine, Sprout, Wheat, TrendingDown, LifeBuoy, MapPinned, CheckCircle2, MessageSquareText, ChevronRight } from 'lucide-react';
import { useStore, demo } from '../../store';
import { Button, StatCard, Card, Note, Tags, LABEL_STYLE, RISK_STYLE, WATER_STYLE, ScoreRing, climateTag } from '../../components/ui';
import Photo from '../../components/Photo';
import SeasonRibbon from '../../components/SeasonRibbon';
import { WATER_COLORS, weatherAlerts } from '../../engine/water';
import { num, fmtDate, fmtRange, fmtBangla, daysBetween } from '../../engine/dates';
import { IRRIGATION } from '../../engine/crops';

export default function Dashboard() {
  const { s, dispatch, T, L, farmer, union, decision: d, chosen, rotation: r, water, weather, stage, today, myAdvisories, unreadAdvisories, confirmedPlan, landConfirmed } = useStore();
  const lang = s.lang;
  const st = LABEL_STYLE[d.label];
  const ws = WATER_STYLE[water.color];
  const daysTo = daysBetween(today, chosen.hw.start);
  const openReqs = s.requests.filter((q) => q.farmerId === farmer.id && q.status === 'open').length;
  const goStep = (n) => dispatch({ type: 'set', patch: { step: n } });

  // One clear next step, in the order a farmer would naturally do things.
  const next = !landConfirmed
    ? { icon: MapPinned, title: T('প্রথমে মানচিত্রে আপনার জমি দেখান', 'First, show us your field on the map'), text: T('জমির জায়গা ঠিক হলে মাটি আর ইউনিয়নের হিসাব আপনার জমি ধরেই হবে।', 'Once your field is placed, the soil and union figures are worked out for it.'), cta: T('জমি বাছাই করুন', 'Mark my field'), to: '/farmer/farm' }
    : !confirmedPlan
      ? { icon: Sprout, title: T('এই রবির পরিকল্পনা শেষ করুন', 'Finish your plan for this Rabi'), text: T(`সাত ধাপের ${num(Math.min(s.step + 1, 7), 'bn')} নম্বরে আছেন। শেষ ধাপে পরিকল্পনা পাকা করলে কৃষি কর্মকর্তা দেখতে পাবেন।`, `You are on step ${Math.min(s.step + 1, 7)} of 7. Confirm the plan at the end so your officer can see it.`), cta: T('পরিকল্পনায় যান', 'Continue planning'), to: '/farmer/plan' }
      : { icon: Droplets, title: L(WATER_COLORS[water.color]), text: water.reasons[0] ? L(water.reasons[0]) : '', cta: T('আজকের কাজ দেখুন', 'See today'), to: '/farmer/today' };

  const alerts = [
    ...weatherAlerts(weather).map((a) => ({ tone: 'warn', text: L(a), to: '/farmer/today' })),
    ...(chosen.glut.level !== 'Low' ? [{ tone: 'gold', text: T(`ফসল তোলার সময় আপনার ইউনিয়নে দাম পড়ার ঝুঁকি ${RISK_STYLE[chosen.glut.level].bn}। তারিখ বদলে দেখতে পারেন।`, `${chosen.glut.level} price-drop risk in your union at harvest. Try another planting date.`), to: '/farmer/plan', step: 6 }] : []),
    ...myAdvisories.slice(0, 2).map((a) => ({ tone: 'info', text: a.text.split('\n')[0], to: '/farmer/help' })),
  ];

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-[24px] bg-primary-950 text-white">
        <div className="absolute inset-0 -z-10"><Photo name="seedlings" fill sizes="(min-width: 1200px) 1200px, 100vw" priority /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,38,20,.92)_0%,rgba(13,38,20,.75)_45%,rgba(13,38,20,.25)_100%)]" /></div>
        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="text-[15px] text-white/80">{T(`আসসালামু আলাইকুম, ${farmer.name.bn}`, `Assalamu alaikum, ${farmer.name.en}`)}</p>
            <h1 className="mt-2 text-[30px] font-bold leading-tight sm:text-[40px]">{L(st)}<span className="block text-paddy-300">{T(`${chosen.crop.name.bn}, ${chosen.crop.action.bn} ${fmtBangla(chosen.t0, 'bn')}`, `${chosen.crop.name.en}, ${chosen.crop.action.en.toLowerCase()} ${fmtDate(chosen.t0, 'en')}`)}</span></h1>
            <p className="mt-3 max-w-xl text-[15.5px] leading-7 text-white/80">{T(`${farmer.villageBn}, ${union.meta.bn} ইউনিয়ন। আপনার জমির জায়গা, মাটি, সেচের উৎস, ২৫ মৌসুমের আবহাওয়া আর পাশের কৃষকদের পরিকল্পনা মিলিয়ে এই পরামর্শ।`, `${farmer.village}, ${union.meta.en} union. Based on your field, soil, water source, 25 seasons of weather and your neighbours’ plans.`)}</p>
            <div className="mt-3"><Tags list={[climateTag(), 'RULE']} /></div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-ink shadow-[var(--shadow-lift)]">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><next.icon size={20} /></span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-primary-700">{T('এখন যা করবেন', 'Your next step')}</div>
                <div className="font-display text-[19px] font-bold leading-tight">{next.title}</div>
                <p className="mt-1 text-[14px] leading-6 text-muted">{next.text}</p>
              </div>
            </div>
            <Button to={next.to} className="mt-3 w-full">{next.cta}<ChevronRight size={17} /></Button>
          </div>
        </div>
      </section>

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[20px] font-bold">{T('আপনার বছর, বাংলা মাসে', 'Your year, by Bangla month')}</h2>
          <div className="flex items-center gap-3"><ScoreRing value={chosen.score} size={40} /><Link to="/farmer/plan" onClick={() => goStep(4)} className="text-[14.5px] font-semibold text-primary-700 hover:underline">{T('পরামর্শ বদলে দেখুন', 'Explore other options')}</Link></div>
        </div>
        <SeasonRibbon />
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Droplets} tone={ws.tone === 'red' ? 'red' : ws.tone === 'amber' ? 'amber' : 'green'} label={T('আজ সেচ', 'Water today')} value={L(WATER_COLORS[water.color])} note={L(stage)} to="/farmer/today" />
        <StatCard icon={TrendingDown} tone={chosen.glut.level === 'High' ? 'red' : chosen.glut.level === 'Medium' ? 'amber' : 'green'} label={T('দাম পড়ার ঝুঁকি', 'Price-drop risk')} value={L(RISK_STYLE[chosen.glut.level])} note={T(`ইউনিয়নের ${num(chosen.glut.share * 100, 'bn')}% জমিতে ${chosen.crop.name.bn}`, `${num(chosen.glut.share * 100, 'en')}% of the union is ${chosen.crop.name.en.toLowerCase()}`)} to="/farmer/plan" />
        <StatCard icon={Wheat} tone="amber" label={T('ফসল তোলা', 'Harvest')} value={daysTo > 0 ? T(`${num(daysTo, 'bn')} দিন বাকি`, `in ${daysTo} days`) : T('এখন চলছে', 'under way')} note={fmtRange(chosen.hw.start, chosen.hw.end, lang)} to="/farmer/harvest" />
        <StatCard icon={LifeBuoy} tone="violet" label={T('সাহায্য', 'Help')} value={T(`${num(openReqs, 'bn')}টি অপেক্ষায়`, `${openReqs} waiting`)} note={unreadAdvisories ? T(`${num(unreadAdvisories, 'bn')}টি নতুন বার্তা`, `${unreadAdvisories} new message${unreadAdvisories > 1 ? 's' : ''}`) : T('নতুন বার্তা নেই', 'No new messages')} to="/farmer/help" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[20px] font-bold">{T('এই সপ্তাহের কাজ', 'This week')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              [Droplets, L(WATER_COLORS[water.color]), water.reasons[0] ? L(water.reasons[0]) : '', '/farmer/today'],
              [ScanLine, T('পাতা দেখে নিন', 'Check the leaves'), T('দাগ বা পোকা দেখলে ছবি তুলে পাঠান', 'Photograph any spots or pests and send them'), '/farmer/doctor'],
              confirmedPlan
                ? [Sprout, T('পরের ফসলের কথা ভাবুন', 'Think about the next crop'), r.best ? T(`তোলার পর ${r.best.crop.name.bn}`, `${r.best.crop.name.en} after harvest`) : T('সরাসরি রোপা আমন', 'Straight to Aman'), '/farmer/plan', 5]
                : [CheckCircle2, T('পরিকল্পনা পাকা করুন', 'Confirm your plan'), T('তাহলে কৃষি কর্মকর্তা দেখতে পাবেন', 'So your officer can see it'), '/farmer/plan', 6],
            ].map(([Icon, t, dsc, to, step]) => (
              <Link key={t} to={to} onClick={() => step != null && goStep(step)} className="flex items-start gap-3 rounded-xl border border-border p-4 transition hover:border-primary-300 hover:bg-primary-50/50">
                <Icon size={20} className="mt-0.5 shrink-0 text-primary-600" />
                <span className="min-w-0"><span className="block text-[15px] font-bold leading-snug">{t}</span><span className="mt-1 block text-[13.5px] leading-5 text-muted">{dsc}</span></span>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="text-[20px] font-bold">{T('খবর ও সতর্কতা', 'Alerts and messages')}</h2>
          <div className="mt-4 space-y-2.5">
            {alerts.length === 0 && <Note tone="ok">{T('এখন কোনো সতর্কতা নেই।', 'Nothing to worry about right now.')}</Note>}
            {alerts.map((a, i) => (
              <Link key={i} to={a.to} onClick={() => a.step != null && goStep(a.step)} className="block">
                <Note tone={a.tone}><span className="line-clamp-3">{a.text}</span></Note>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-canvas p-3.5 text-[14px] leading-6">
            <div className="font-semibold">{T('আপনার জমি', 'Your field')}</div>
            <div className="text-muted">{T(`${num(farmer.area_dec, 'bn')} শতক, ${IRRIGATION[farmer.irrigation].bn}, ${demo.unions.find((u) => u.id === farmer.union).bn}`, `${farmer.area_dec} decimal, ${IRRIGATION[farmer.irrigation].en.toLowerCase()}, ${farmer.union}`)}</div>
            <Link to="/farmer/farm" className="mt-1 inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline">{T('মানচিত্রে দেখুন', 'View on the map')}<ChevronRight size={15} /></Link>
          </div>
        </Card>
      </div>

      {unreadAdvisories > 0 && (
        <Link to="/farmer/help" className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-[15px] font-semibold text-primary-900">
          <MessageSquareText size={19} />{T(`কৃষি কর্মকর্তার ${num(unreadAdvisories, 'bn')}টি নতুন বার্তা এসেছে`, `${unreadAdvisories} new message${unreadAdvisories > 1 ? 's' : ''} from your officer`)}<ChevronRight size={17} className="ml-auto" />
        </Link>
      )}
    </div>
  );
}
