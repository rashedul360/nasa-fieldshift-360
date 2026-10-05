import { useEffect } from 'react';
import { CloudRain, Droplets, SunMedium, Thermometer, Sprout, AlertTriangle, ScanLine, Radio } from 'lucide-react';
import { useStore } from '../../store';
import { PageHeader, Card, Button, WhyButton, Note, Tags, WATER_STYLE } from '../../components/ui';
import Photo from '../../components/Photo';
import { weatherAlerts, WATER_COLORS, DEMO_SCENARIOS } from '../../engine/water';
import { num, fmtDate, fmtBangla, bnDigits } from '../../engine/dates';

export default function Today() {
  const { s, dispatch, T, L, toast, chosen, farmer, daysAfter, today, demoNow, weather, liveWeather, stage, water } = useStore();
  const lang = s.lang;
  const crop = chosen.crop;
  const ws = WATER_STYLE[water.color];
  const alerts = weatherAlerts(weather);

  // A red signal tells the farmer's officer automatically (once per farmer).
  useEffect(() => {
    if (water.color !== 'RED') return;
    const id = `W-${farmer.id}`;
    if (s.requests.some((r) => r.id === id && r.status === 'open')) return;
    dispatch({ type: 'addRequest', req: { id, farmerId: farmer.id, union: farmer.union, village: farmer.village, villageBn: farmer.villageBn, lat: farmer.lat, lon: farmer.lon,
      crop: crop.id, symptom: 'water', type: 'water_alert', text: { bn: 'নিজে থেকে পাঠানো সতর্কতা: জমি খুব শুকনো (লাল সংকেত)', en: 'Automatic alert: field very dry (red signal)' }, ai: null, created: today, status: 'open', priority: 'High', mine: true } });
    toast('আপনার কৃষি কর্মকর্তাকে জানানো হয়েছে', 'Your officer has been told');
  }, [water.color]); // eslint-disable-line react-hooks/exhaustive-deps

  const why = {
    title: T('আজকের সেচের পরামর্শ কীভাবে এল', 'How today’s watering advice was worked out'), tags: [liveWeather ? 'REAL' : 'DEMO', 'RULE'],
    blocks: [
      { h: T('কারণগুলো', 'Reasons'), lines: water.reasons.map(L) },
      { h: T('নম্বরের নিয়ম', 'The points'), lines: [
        T('গত সপ্তাহে বৃষ্টি ৫ মিলিমিটারের কম হলে ২ নম্বর, ১৫-র কম হলে ১।', 'Less than 5 mm of rain last week adds 2; less than 15 mm adds 1.'),
        T('আজ ৩৫° বা তার বেশি গরম হলে ২, ৩২° বা তার বেশি হলে ১।', 'A high of 35 °C or more adds 2; 32 °C or more adds 1.'),
        T('চারা লাগার বা ফুল আসার সময় হলে ১; বেশি পানির ফসল হলে ১; আপনি মাটি শুকনো বললে ২।', 'Seedling or flowering stage adds 1; a thirsty crop adds 1; you saying the soil is dry adds 2.'),
        T('আগামী তিন দিনে ১৫ মিলিমিটারের বেশি বৃষ্টির খবর থাকলে ৩ কমে, ৫-এর বেশি হলে ১ কমে। মাটি ভেজা বললে সবুজ।', 'Over 15 mm of rain forecast in three days takes 3 off; over 5 mm takes 1 off. Saying the soil is wet makes it green.'),
        T(`আজ মোট ${bnDigits(water.points)} নম্বর। ১ পর্যন্ত সবুজ, ২–৩ হলুদ, ৪–৫ কমলা, ৬ বা বেশি লাল।`, `Today’s total is ${water.points}. Up to 1 is green, 2–3 yellow, 4–5 orange, 6 or more red.`)] },
      { h: T('মনে রাখবেন', 'Keep in mind'), lines: [T('জমিতে গিয়ে মাটি হাতে নিয়ে দেখাই সবচেয়ে ভালো। উপগ্রহ আপনার জমির মাটির ভেজা-শুকনো মাপে না।', 'Feeling the soil in your field is still the best check. Satellites do not measure your own field’s moisture.')] },
    ],
    sources: [liveWeather ? T(`Open-Meteo আবহাওয়ার পূর্বাভাস, ${s.live.date} (নাসার নয়)`, `Open-Meteo forecast, ${s.live.date} (not NASA)`) : T('নমুনা আবহাওয়া', 'Sample weather')],
  };

  return (
    <div>
      <PageHeader eyebrow={T(`আজকের কাজ, ${fmtBangla(demoNow, 'bn')}`, `Today, ${fmtDate(demoNow, 'en')}`)} title={T('আজ কি সেচ দিতে হবে?', 'Do you need to water today?')}
        subtitle={T(`${crop.name.bn}, লাগানোর ${bnDigits(daysAfter)} দিন পর। ${stage.bn}।`, `${crop.name.en}, ${daysAfter} days after planting. ${stage.en}.`)}
        tags={[liveWeather ? 'REAL' : 'DEMO', 'RULE']} action={<WhyButton payload={why} />} />

      <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
        <section className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br ${ws.grad} p-6 text-white shadow-[var(--shadow-card)] sm:p-8`} aria-live="polite">
          <div className="flex items-center justify-between">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20"><Droplets size={28} /></div>
            <span className="chip bg-white/20 !text-[13px] text-white">{L(ws)}</span>
          </div>
          <div className="mt-6 text-[15px] text-white/85">{T('আজকের পরামর্শ', 'Today’s advice')}</div>
          <div className="font-display mt-1 text-[36px] font-bold leading-tight">{L(WATER_COLORS[water.color])}</div>
          <ul className="mt-4 space-y-2 text-[15px] leading-6 text-white/90">{water.reasons.slice(0, 4).map((r, i) => <li key={i} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />{L(r)}</li>)}</ul>
          <div className="mt-6 rounded-2xl bg-white/15 p-3.5">
            <div className="text-[14px] font-semibold text-white/90">{T('জমিতে গিয়ে মাটি হাতে নিয়ে দেখুন, তারপর জানান', 'Feel the soil in the field, then tell us')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['wet', 'dry'].map((k) => (
                <button key={k} type="button" onClick={() => dispatch({ type: 'set', patch: { fieldCheck: s.fieldCheck === k ? null : k } })} aria-pressed={s.fieldCheck === k}
                  className={`rounded-xl px-3 py-3 text-[15px] font-bold transition ${s.fieldCheck === k ? 'bg-white text-ink' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                  {k === 'wet' ? T('মাটি ভেজা', 'Soil is wet') : T('মাটি শুকনো', 'Soil is dry')}
                </button>
              ))}
            </div>
          </div>
          {water.color === 'RED' && <div className="mt-3 rounded-xl bg-white/20 p-3 text-[14.5px] font-semibold">{T('আপনার ইউনিয়নের কৃষি কর্মকর্তাকে নিজে থেকেই জানানো হয়েছে।', 'Your union’s agriculture officer has been told automatically.')}</div>}
        </section>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[20px] font-bold">{T('আবহাওয়া', 'Weather')}</h2>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={T('আবহাওয়া বেছে নিন', 'Choose weather')}>
                {s.live && <button type="button" onClick={() => dispatch({ type: 'set', patch: { weatherMode: 'live' } })} aria-pressed={liveWeather} className={`chip !px-3 !py-1.5 !text-[13px] ${liveWeather ? 'bg-sky-700 text-white' : 'bg-white ring-1 ring-border'}`}><Radio size={13} />{T('আজকের আসল আবহাওয়া', 'Live weather')}</button>}
                {Object.entries(DEMO_SCENARIOS).map(([k, sc]) => (
                  <button key={k} type="button" onClick={() => dispatch({ type: 'set', patch: { weatherMode: 'demo', scenario: k } })} aria-pressed={!liveWeather && s.scenario === k}
                    className={`chip !px-3 !py-1.5 !text-[13px] ${!liveWeather && s.scenario === k ? 'bg-paddy-700 text-white' : 'bg-white ring-1 ring-border'}`}>{L(sc)}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[[CloudRain, T('গত ৭ দিনের বৃষ্টি', 'Rain, past week'), `${num(weather.rain7, lang)} ${T('মিমি', 'mm')}`], [CloudRain, T('আগামী ৩ দিন', 'Next 3 days'), `${num(weather.rainNext3, lang)} ${T('মিমি', 'mm')}`], [Thermometer, T('আজ সর্বোচ্চ', 'High today'), `${num(weather.tmax, lang)}°`]].map(([Icon, l, v]) => (
                <div key={l} className="rounded-xl bg-canvas p-3.5"><Icon size={18} className="text-sky-600" /><div className="mt-2 text-[12.5px] leading-tight text-muted">{l}</div><div className="font-display mt-0.5 text-[20px] font-bold tabular">{v}</div></div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted">{liveWeather ? T(`উৎস: Open-Meteo, ${s.live.date} (নাসার নয়)`, `Source: Open-Meteo, ${s.live.date} (not NASA)`) : T('এগুলো নমুনা আবহাওয়া। ইন্টারনেট থাকলে আজকের আসল আবহাওয়াও বেছে নিতে পারবেন।', 'This is sample weather. With internet you can switch to today’s real weather.')}</p>
            <div className="mt-4 border-t border-border pt-4">
              <label className="flex items-center justify-between text-[14px]" htmlFor="days-after"><span className="font-semibold">{T('লাগানোর পর কত দিন (নমুনা)', 'Days since planting (demo)')}</span><b className="tabular">{num(daysAfter, lang)}</b></label>
              <input id="days-after" type="range" min="1" max={crop.days + 30} value={daysAfter} onChange={(e) => dispatch({ type: 'set', patch: { daysAfter: +e.target.value } })} className="mt-2 w-full accent-primary-600" />
              <div className="mt-1 flex items-center gap-2 text-[13.5px] text-muted"><Sprout size={15} className="text-primary-600" />{L(stage)}</div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="relative aspect-[16/6]"><Photo name="seedlings" fill sizes="600px" focus="25% 70%" /></div>
            <div className="p-5 sm:p-6">
              <h2 className="text-[20px] font-bold">{T('সতর্কতা', 'Alerts')}</h2>
              <div className="mt-3 space-y-2.5">
                {alerts.length === 0 && <Note tone="ok">{T('আজ আবহাওয়া নিয়ে বিশেষ কোনো সতর্কতা নেই।', 'No weather warnings today.')}</Note>}
                {alerts.map((a, i) => <Note key={i} tone="warn">{L(a)}</Note>)}
                {chosen.glut.level !== 'Low' && <Note tone="gold">{T(`ফসল তোলার সময় আপনার ইউনিয়নে দাম পড়ার ঝুঁকি ${chosen.glut.level === 'High' ? 'বেশি' : 'মাঝারি'}। পরিকল্পনার শেষ ধাপে তারিখ বদলে দেখুন।`, `${chosen.glut.level} price-drop risk in your union at harvest. Try another date in the last planning step.`)}</Note>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button to="/farmer/doctor" variant="secondary"><ScanLine size={16} />{T('পাতার ছবি পরীক্ষা', 'Check a leaf photo')}</Button>
                <Button to="/farmer/help" variant="ghost"><AlertTriangle size={16} />{T('কর্মকর্তাকে জানান', 'Tell your officer')}</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-1.5 text-[13px] text-muted"><SunMedium size={14} />{T('গরমের দিনে ভরদুপুরে নয়, সকালে বা বিকেলে সেচ দিন।', 'On hot days, water in the morning or evening, not at midday.')} <Tags list={['RULE']} /></p>
    </div>
  );
}
