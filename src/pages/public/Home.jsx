import { Link } from 'react-router-dom';
import { MapPinned, Sprout, ShieldCheck, CloudSun, Layers, SlidersHorizontal, RefreshCw, TrendingDown, Droplets, Wheat, Satellite } from 'lucide-react';
import { Button, Tags, LABEL_STYLE, ScoreRing, climateTag } from '../../components/ui';
import BrandMark from '../../components/brand/BrandMark';
import Photo from '../../components/Photo';
import SeasonRibbon from '../../components/SeasonRibbon';
import { useStore, tm, clim } from '../../store';
import { num, fmtDate, fmtBangla } from '../../engine/dates';
import { PROJECT_NAME, PROJECT_TAGLINE, PROJECT_EVENT } from '../../config/brand';

export default function Home() {
  const { s, T, L, decision: d, farmer, union } = useStore();
  const lang = s.lang;
  const st = LABEL_STYLE[d.label];
  const real = clim.prov.status === 'REAL';
  const steps = [
    [MapPinned, T('জমি দেখান', 'Mark your field'), T('মানচিত্রে পিন বসিয়ে জমির জায়গা, মাপ আর সেচের উৎস দিন।', 'Drop a pin on the map and add the size and water source.')],
    [CloudSun, T('আবহাওয়ার আগে-পরে', 'See how the weather changed'), T('২০০১ থেকে ২০২৫ পর্যন্ত ২৫ মৌসুমের নাসার তথ্যে আপনার এলাকা।', 'Your area in 25 seasons of NASA weather, 2001 to 2025.')],
    [Layers, T('মাটি বুঝে নিন', 'Know your soil'), T('এলাকার মাটি টক না ক্ষারীয়, জৈব পদার্থ কতটা, পানি নামে কিনা।', 'How acidic the soil is, how much organic matter, how it drains.')],
    [SlidersHorizontal, T('আপনার চাওয়া বলুন', 'Say what matters to you'), T('কম সেচ, বেশি আয়, কম ঝুঁকি, ভালো মাটি, নাকি আগাম ফসল।', 'Less water, more income, less risk, better soil or an early harvest.')],
    [Sprout, T('সুপারিশ আর কারণ', 'Get a recommendation'), T('একই ফসল, সময় বদল, না অন্য ফসল — প্রতিটির পেছনের হিসাব সহ।', 'Keep, adjust or shift — with the working behind each one.')],
    [RefreshCw, T('পরের মৌসুম', 'Plan the next crop'), T('এই ফসলের পর কী লাগালে মাটির উপকার হয়, আর পাশের সবাই কী লাগাচ্ছে।', 'What to grow after this crop, and what your neighbours are planting.')],
  ];
  const climateFacts = [
    ['hotMarApr', T('চৈত্র-বৈশাখে খুব গরম দিন', 'Very hot days in March–April'), T('দিন', 'days')],
    ['rabiRain', T('রবি মৌসুমের মোট বৃষ্টি', 'Rain over the Rabi season'), T('মিলিমিটার', 'mm')],
    ['coldNights', T('পৌষ-মাঘের কনকনে রাত', 'Cold nights in Dec–Jan'), T('রাত', 'nights')],
  ];
  return (
    <>
      {/* Hero: the dawn aerial with its open haze on the left for the headline. */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Photo name="heroDawn" fill priority sizes="100vw" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(243,246,240,.94)_0%,rgba(243,246,240,.78)_34%,rgba(243,246,240,.15)_62%,rgba(243,246,240,0)_80%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" />
        </div>
        <div className="page-shell pb-10 pt-[120px] sm:pt-[140px]">
          <div className="hero-rise max-w-[600px]">
            <p className="text-[15px] font-semibold text-primary-800">{T('গোদাগাড়ী, রাজশাহী — রবি মৌসুম ২০২৬–২৭', 'Godagari, Rajshahi — Rabi season 2026–27')}</p>
            <h1 className="mt-3 text-[44px] font-bold leading-[1.05] text-primary-950 sm:text-[60px] lg:text-[72px]">{T('এই রবিতে কী লাগাবেন?', 'What should you plant this Rabi?')}</h1>
            <p className="mt-5 max-w-[34rem] text-[17px] leading-8 text-ink/80 sm:text-[18px]">
              {T(`${PROJECT_NAME} আপনার জমির জায়গা, এলাকার মাটি আর গত ২৫ বছরের নাসার আবহাওয়ার তথ্য মিলিয়ে বলে দেয় — একই ফসল রাখবেন, সময় বদলাবেন, না অন্য ফসলে যাবেন। পাশের কৃষকেরা কী লাগাচ্ছেন সেটাও হিসাবে থাকে, যাতে ফসল ওঠার সময় দাম না পড়ে।`,
                `${PROJECT_NAME} looks at where your field is, the local soil and 25 years of NASA weather data, then tells you whether to keep your crop, change the planting date or move to another crop. It also counts what your neighbours are planting, so prices do not collapse at harvest.`)}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/farmer/plan" className="px-5 py-3 text-[16px]"><Sprout size={19} />{T('আমার জমির হিসাব দেখুন', 'Work out my field')}</Button>
              <Button to="/officer" variant="secondary" className="px-5 py-3 text-[16px]"><ShieldCheck size={19} />{T('কৃষি কর্মকর্তার পাতা', 'Officer view')}</Button>
            </div>
          </div>

          <div className="mt-12 rounded-[22px] border border-white/70 bg-white/90 p-5 shadow-[var(--shadow-lift)] backdrop-blur sm:p-6 lg:mt-16">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <ScoreRing value={d.rec.score} size={58} />
                <div>
                  <p className="text-[14px] text-muted">{T(`${farmer.name.bn}, ${union.meta.bn} — এইমাত্র হিসাব করা`, `${farmer.name.en}, ${union.meta.en} — worked out just now`)}</p>
                  <p className="font-display text-[22px] font-bold leading-tight sm:text-[26px]"><span className={st.text}>{L(st)}</span>{T(`: ${d.rec.crop.name.bn}, ${fmtBangla(d.rec.t0, 'bn')}`, `: ${d.rec.crop.name.en}, ${fmtDate(d.rec.t0, 'en')}`)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2"><Tags list={[climateTag(), 'RULE']} /><Link to="/farmer/plan" className="text-[14.5px] font-semibold text-primary-700 underline-offset-4 hover:underline">{T('পুরো হিসাব দেখুন', 'See the full working')}</Link></div>
            </div>
            <div className="mt-5"><SeasonRibbon /></div>
          </div>
        </div>
      </section>

      {/* Climate risk: the drought/flood split photo beside the numbers it stands for. */}
      <section className="py-16 sm:py-20">
        <div className="page-shell grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <figure className="overflow-hidden rounded-[22px] shadow-[var(--shadow-card)]">
            <Photo name="droughtFlood" sizes="(min-width: 1024px) 600px, 100vw" />
          </figure>
          <div>
            <h2 className="text-[32px] font-bold sm:text-[40px]">{T('আবহাওয়া আর আগের মতো নেই', 'The weather is not what it used to be')}</h2>
            <p className="mt-3 text-[16.5px] leading-8 text-muted">{T('বরেন্দ্রে একদিকে সেচের পানি কমছে, অন্যদিকে অসময়ের গরম আর হঠাৎ বৃষ্টি। দাদার আমলের ফসলের ক্যালেন্ডার এখন সবসময় খাটে না। তাই আমরা আপনার এলাকার ২০০১–২০১২ আর ২০১৩–২০২৫ সালের আবহাওয়া পাশাপাশি রেখে দেখাই, কী বদলেছে।', 'In the Barind, irrigation water is getting scarcer while heat and sudden rain arrive out of season. The old crop calendar no longer always holds. So we set your area’s weather in 2001–2012 beside 2013–2025 and show what changed.')}</p>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {climateFacts.map(([k, label, unit]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-[15px] text-ink/80">{label}</dt>
                  <dd className="font-display whitespace-nowrap text-[20px] font-bold tabular">
                    <span className="text-muted">{num(tm[k].then, lang, { dp: tm[k].then < 20 ? 1 : 0 })}</span>
                    <span className="mx-2 text-[15px] font-normal text-muted">{T('থেকে', 'to')}</span>
                    {num(tm[k].now, lang, { dp: tm[k].now < 20 ? 1 : 0 })} <span className="text-[14px] font-normal text-muted">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">{T('মৌসুমপ্রতি গড়, আগের ১২ বছর থেকে পরের ১৩ বছর', 'Average per season, earlier 12 years to later 13 years')} <Tags list={[climateTag()]} /></p>
            {!real && <p className="mt-2 text-[13px] text-red-700">{T('সংখ্যাগুলো এখন অস্থায়ী তথ্য থেকে। নাসার আসল তথ্য আনলে নিজে থেকেই বদলে যাবে।', 'These numbers come from placeholder data for now and update automatically once the real NASA data is loaded.')}</p>}
          </div>
        </div>
      </section>

      {/* How it works: a real sequence, so it is numbered. */}
      <section id="how" className="scroll-mt-20 border-y border-border bg-white py-16 sm:py-20">
        <div className="page-shell">
          <div className="max-w-2xl">
            <h2 className="text-[32px] font-bold sm:text-[40px]">{T('ছয় ধাপে পুরো মৌসুমের হিসাব', 'The whole season in six steps')}</h2>
            <p className="mt-3 text-[16.5px] leading-8 text-muted">{T('প্রতিটি ধাপের উত্তর পরের ধাপে কাজে লাগে। আপনার কোনো পছন্দ বদলালে বাকি সব হিসাব সঙ্গে সঙ্গে নতুন করে হয়।', 'Each answer feeds the next step. Change any choice and everything after it is worked out again straight away.')}</p>
          </div>
          <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(([Icon, t, d2], i) => (
              <li key={t} className="relative border-t-2 border-primary-200 pt-5">
                <span className="font-display absolute -top-[15px] left-0 grid h-7 min-w-7 place-items-center rounded-full bg-primary-700 px-2 text-[14px] font-bold text-white">{num(i + 1, lang)}</span>
                <div className="flex items-center gap-2"><Icon size={19} className="text-primary-600" /><h3 className="text-[19px] font-bold">{t}</h3></div>
                <p className="mt-1.5 text-[15px] leading-7 text-muted">{d2}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Your field: the aerial with outlined plots. */}
      <section id="land" className="scroll-mt-20 py-16 sm:py-20">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-[26px] bg-primary-950">
            <div className="relative aspect-[16/11] sm:aspect-[16/8] lg:aspect-[16/7]">
              <Photo name="landParcels" fill sizes="(min-width: 1200px) 1200px, 100vw" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,38,20,0)_45%,rgba(13,38,20,.75)_100%)] lg:bg-[linear-gradient(90deg,rgba(13,38,20,.0)_40%,rgba(13,38,20,.82)_100%)]" />
            </div>
            <div className="relative bg-primary-950 p-6 text-white sm:p-8 lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-[42%] lg:flex-col lg:justify-center lg:bg-transparent">
              <h2 className="text-[30px] font-bold sm:text-[36px]">{T('আগে নিজের জমিটা দেখিয়ে দিন', 'Start by showing us your field')}</h2>
              <p className="mt-3 text-[16px] leading-8 text-white/85">{T('উপগ্রহের ছবিতে নিজের জমি খুঁজে পিন বসান, অথবা গ্রামের নাম লিখে খুঁজুন। জমি কোন ইউনিয়নে, সেখানকার মাটি কেমন — সব এখান থেকেই ঠিক হয়।', 'Find your field on the satellite map and drop a pin, or search by village name. Your union and its soil are worked out from there.')}</p>
              <ul className="mt-4 space-y-1.5 text-[15px] text-white/85">
                <li>{T('পিন টেনে সরানো যায়, মানচিত্রে চাপ দিলেও বসে', 'Drag the pin, or tap the map to place it')}</li>
                <li>{T('জমির মাপ শতক বা বিঘায় দিন', 'Enter the size in decimal or bigha')}</li>
                <li>{T('ফোনের লোকেশন দিয়েও খোঁজা যায়', 'Or use your phone’s location')}</li>
              </ul>
              <div className="mt-6"><Button to="/farmer/farm" variant="light" className="px-5 py-3"><MapPinned size={18} />{T('মানচিত্রে জমি বাছাই করুন', 'Mark my field on the map')}</Button></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendation: the seedlings photo beside the three possible answers. */}
      <section className="border-y border-border bg-white py-16 sm:py-20">
        <div className="page-shell grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="order-2 lg:order-1">
            <h2 className="text-[32px] font-bold sm:text-[40px]">{T('তিনটির একটি পরামর্শ, সঙ্গে কারণ', 'One of three answers, always with the reason')}</h2>
            <p className="mt-3 text-[16.5px] leading-8 text-muted">{T('পাঁচটি রবি ফসল, প্রতিটি তিনটি আলাদা তারিখে লাগালে গত ২৫ মৌসুমে কী হতো — সেই হিসাব, আপনার মাটি, সেচ, লাভ আর চাওয়ার সঙ্গে মিলিয়ে।', 'Five Rabi crops, each at three planting dates, replayed through the last 25 seasons and weighed against your soil, water, profit and priorities.')}</p>
            <div className="mt-6 space-y-3">
              {['KEEP', 'ADJUST', 'SHIFT'].map((k) => {
                const x = LABEL_STYLE[k];
                const body = { KEEP: T('আপনার আগের ফসলই এখনও সবচেয়ে ভালো, স্বাভাবিক সময়ে।', 'Your usual crop at the usual time is still the best choice.'), ADJUST: T('একই ফসল, তবে দুই সপ্তাহ আগে বা পরে লাগালে ঝুঁকি কমে।', 'Same crop, but two weeks earlier or later lowers the risk.'), SHIFT: T('অন্য একটি ফসল এই মৌসুমে আপনার জমিতে স্পষ্টভাবে ভালো।', 'Another crop clearly does better on your field this season.') }[k];
                return (
                  <div key={k} className="flex gap-4 rounded-2xl border border-border p-4">
                    <span className={`mt-1 h-10 w-1.5 shrink-0 rounded-full ${x.bg}`} />
                    <div><div className={`font-display text-[19px] font-bold ${x.text}`}>{L(x)}</div><p className="text-[15px] leading-7 text-muted">{body}</p></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[14px] text-muted"><TrendingDown size={16} className="text-paddy-700" />{T('সবাই একসঙ্গে একই ফসল লাগালে দাম পড়ে যায় — সেই ঝুঁকিও দেখানো হয়।', 'When everyone plants the same crop at once prices fall — that risk is shown too.')}</div>
          </div>
          <figure className="order-1 overflow-hidden rounded-[22px] shadow-[var(--shadow-card)] lg:order-2">
            <Photo name="seedlings" sizes="(min-width: 1024px) 600px, 100vw" />
          </figure>
        </div>
      </section>

      {/* Data sources over the satellite patchwork. */}
      <section id="data" className="relative isolate scroll-mt-20 overflow-hidden py-16 text-white sm:py-24">
        <div className="absolute inset-0 -z-10"><Photo name="satellite" fill sizes="100vw" decorative /><div className="absolute inset-0 bg-primary-950/85" /></div>
        <div className="page-shell grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div>
            <Satellite size={30} className="text-paddy-300" />
            <h2 className="mt-4 text-[32px] font-bold sm:text-[40px]">{T('যে তথ্য দিয়ে হিসাব হয়', 'The data behind every answer')}</h2>
            <p className="mt-3 text-[16.5px] leading-8 text-white/80">{T('প্রতিটি ফলাফলের পাশে লেখা থাকে সেটা আসল তথ্য, নিয়মে হিসাব, AI, না নমুনা। উপগ্রহ আপনার জমির মাটি মাপে না — এলাকার মাপ এলাকার মাপ হিসেবেই দেখাই।', 'Every result is marked as real data, rule-based, AI or demo. Satellites do not measure your own plot’s soil, so area-level numbers are shown as exactly that.')}</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/15 bg-white/[.06] backdrop-blur-sm">
            <table className="w-full min-w-[520px] text-left text-[14.5px]">
              <thead className="text-[13px] text-white/60"><tr><th className="px-4 py-3 font-semibold">{T('তথ্য', 'Dataset')}</th><th className="px-4 py-3 font-semibold">{T('কত বড় এলাকার', 'Scale')}</th><th className="px-4 py-3 font-semibold">{T('কী কাজে লাগে', 'Used for')}</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {[
                  [T('নাসা POWER', 'NASA POWER'), T('প্রায় ৫০ কিলোমিটার', 'about 50 km'), T('তাপমাত্রা, বৃষ্টি, ২৫ মৌসুমের হিসাব, ফসল তোলার সময়', 'Temperature, rain, the 25-season check, harvest timing')],
                  [T('নাসা GPM IMERG', 'NASA GPM IMERG'), T('প্রায় ১১ কিলোমিটার', 'about 11 km'), T('বৃষ্টির ইতিহাস আরও খুঁটিয়ে (পরে যোগ করা যাবে)', 'Finer rainfall history (optional upgrade)')],
                  [T('মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট', 'SRDI soil guide'), T('ইউনিয়ন', 'union'), T('মাটির pH, জৈব পদার্থ, নাইট্রোজেন-ফসফরাস-পটাশ', 'Soil pH, organic matter, NPK')],
                  ['Open-Meteo', T('প্রায় ১০ কিলোমিটার', 'about 10 km'), T('আজকের সেচের পরামর্শ (ইন্টারনেট থাকলে)', 'Today’s irrigation advice (when online)')],
                  [T('নমুনা কৃষক ও পরিকল্পনা', 'Sample farmers and plans'), '—', T('দাম পড়ার সতর্কতা, কর্মকর্তার কাজ দেখানো', 'Price-drop warning and the officer workflow')],
                ].map((r2) => <tr key={r2[0]}>{r2.map((c, i) => <td key={i} className={`px-4 py-3 ${i === 0 ? 'font-semibold' : 'text-white/75'}`}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* People: the farmer photo with the officer support story. */}
      <section id="officer" className="scroll-mt-20 py-16 sm:py-20">
        <div className="page-shell grid items-stretch gap-8 lg:grid-cols-[1.05fr_1fr]">
          <figure className="relative min-h-[320px] overflow-hidden rounded-[22px] shadow-[var(--shadow-card)]">
            <Photo name="farmer" fill sizes="(min-width: 1024px) 620px, 100vw" />
          </figure>
          <div className="flex flex-col justify-center">
            <h2 className="text-[32px] font-bold sm:text-[40px]">{T('কৃষকের পাশে কৃষি কর্মকর্তা', 'Your agriculture officer, in the loop')}</h2>
            <p className="mt-3 text-[16.5px] leading-8 text-muted">{T('অ্যাপ সব প্রশ্নের উত্তর দেয় না, দেওয়ার কথাও না। পাতার দাগ নিয়ে সন্দেহ, সেচের পানি না পাওয়া, যেকোনো সমস্যা ছবি আর জায়গাসহ সরাসরি ইউনিয়নের উপসহকারী কৃষি কর্মকর্তার কাছে যায়।', 'An app cannot answer everything and should not try. Unsure about leaf spots, not getting irrigation water — any problem goes straight to your union’s sub-assistant agriculture officer with a photo and location.')}</p>
            <ul className="mt-5 space-y-3 text-[15.5px] leading-7">
              <li className="flex gap-3"><LifeDot />{T('কাছাকাছি কয়েকজন একই সমস্যা জানালে কর্মকর্তা এলাকার সতর্কতা পান, আর একবারে সবাইকে পরামর্শ পাঠাতে পারেন।', 'When several nearby farmers report the same problem, the officer gets an area alert and can advise all of them at once.')}</li>
              <li className="flex gap-3"><LifeDot />{T('বড় সমস্যা উপজেলা কৃষি অফিসারের কাছে যায়, যিনি পুরো উপজেলার ছবি দেখেন।', 'Bigger problems go up to the upazila agriculture officer, who sees the whole upazila.')}</li>
              <li className="flex gap-3"><LifeDot />{T('কোন সপ্তাহে কোন ইউনিয়নে কত ফসল উঠবে, সেটাও আগে থেকে জানা যায়।', 'Officers can also see how much crop each union will harvest, week by week.')}</li>
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/officer"><ShieldCheck size={18} />{T('উপসহকারী কৃষি কর্মকর্তার পাতা', 'Sub-assistant officer view')}</Button>
              <Button to="/officer/upazila" variant="secondary">{T('উপজেলা অফিসের পাতা', 'Upazila office view')}</Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-primary-950 pb-16 pt-12 text-primary-100">
        <div className="page-shell grid gap-8 sm:grid-cols-[1.2fr_1fr]">
          <div>
            <BrandMark inverse />
            <p className="mt-4 max-w-md text-[14.5px] leading-7 text-primary-200">{L(PROJECT_TAGLINE)}</p>
          </div>
          <div className="space-y-2 text-[14px] leading-6 text-primary-200 sm:text-right">
            <p>{L(PROJECT_EVENT)}</p>
            <p>{T('এটি সিদ্ধান্ত নিতে সাহায্যের একটি নমুনা প্রকল্প, কোনো নিশ্চয়তা নয়। ফসলের হিসাবের সীমাগুলো কৃষিবিদ দিয়ে যাচাই করে নিতে হবে।', 'A decision-support prototype, not a guarantee. Crop thresholds still need checking by an agronomist.')}</p>
            <p className="text-primary-300">© {new Date().getFullYear()} {PROJECT_NAME}</p>
          </div>
        </div>
        <div className="page-shell mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
          <Link to="/farmer" className="hover:text-white"><Droplets size={14} className="mr-1 inline" />{T('কৃষকের পাতা', 'Farmer view')}</Link>
          <Link to="/farmer/harvest" className="hover:text-white"><Wheat size={14} className="mr-1 inline" />{T('ফসল তোলার হিসাব', 'Harvest timing')}</Link>
          <Link to="/officer" className="hover:text-white"><ShieldCheck size={14} className="mr-1 inline" />{T('কর্মকর্তার পাতা', 'Officer view')}</Link>
        </div>
      </footer>
    </>
  );
}

function LifeDot() {
  return <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />;
}
