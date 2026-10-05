import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Building2, ShieldCheck, UserRound, Info } from 'lucide-react';
import BrandMark from '../../components/brand/BrandMark';
import Photo from '../../components/Photo';
import { Segmented } from '../../components/ui';
import { LangToggle } from '../../components/chrome';
import { useStore, demo } from '../../store';
import { OFFICERS } from '../../data/demo';
import { cropName, IRRIGATION } from '../../engine/crops';
import { num } from '../../engine/dates';
import { PROJECT_NAME } from '../../config/brand';

export default function Login() {
  const { s, dispatch, T, L, farmers } = useStore();
  const [role, setRole] = useState('farmer');
  const navigate = useNavigate();
  const heroes = farmers.filter((f) => f.hero);
  const enterFarmer = (id) => { dispatch({ type: 'chooseFarmer', id }); navigate('/farmer'); };
  const enterSaao = (u) => { dispatch({ type: 'set', patch: { officerUnion: u } }); navigate('/officer'); };
  const row = 'group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition hover:border-primary-400 hover:bg-primary-50';
  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <Photo name="farmer" fill sizes="50vw" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,38,20,.0)_45%,rgba(13,38,20,.8)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display max-w-md text-[30px] font-bold leading-tight">{T('যিনি মাঠে আছেন, সিদ্ধান্ত তাঁর। আমরা শুধু হিসাবটা হাতের কাছে আনি।', 'The farmer in the field makes the call. We just put the working in their hands.')}</p>
        </div>
      </div>
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between"><Link to="/" aria-label={T('প্রথম পাতা', 'Home')}><BrandMark /></Link><LangToggle /></div>
        <div className="mx-auto my-auto w-full max-w-[520px] py-10">
          <h1 className="text-[32px] font-bold">{T(`${PROJECT_NAME} খুলুন`, `Open ${PROJECT_NAME}`)}</h1>
          <p className="mt-2 text-[16px] leading-7 text-muted">{T('এই নমুনায় পাসওয়ার্ড বা ওটিপি নেই। একজন কৃষক বা কর্মকর্তা বেছে নিলেই চলবে, পরে যেকোনো সময় বদলানো যায়।', 'There is no password or OTP in this demo. Pick a farmer or an officer — you can switch any time.')}</p>
          <Segmented className="mt-6 grid w-full grid-cols-2" value={role} onChange={setRole}
            options={[{ value: 'farmer', icon: UserRound, label: T('আমি কৃষক', 'I am a farmer') }, { value: 'officer', icon: ShieldCheck, label: T('আমি কৃষি কর্মকর্তা', 'I am an officer') }]} />
          {role === 'farmer' ? (
            <div className="mt-5 space-y-2.5">
              {heroes.map((h) => (
                <button key={h.id} type="button" onClick={() => enterFarmer(h.id)} className={`${row} ${h.id === s.farmerId ? 'border-primary-300 bg-white' : 'border-border bg-white'}`}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-100 text-[18px] font-bold text-primary-800">{L(h.name).slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold">{L(h.name)}</span>
                    <span className="block text-[13.5px] leading-5 text-muted">{T(`${demo.unions.find((u) => u.id === h.union).bn} ইউনিয়ন, ${num(h.area_dec / 33, 'bn', { dp: 1 })} বিঘা জমি, গতবার ${cropName(h.last_crop, 'bn')}, সেচ ${IRRIGATION[h.irrigation].bn}`, `${h.union} union, ${num(h.area_dec / 33, 'en', { dp: 1 })} bigha, last grew ${cropName(h.last_crop, 'en').toLowerCase()}, ${IRRIGATION[h.irrigation].en.toLowerCase()}`)}</span>
                  </span>
                  <ChevronRight size={20} className="text-primary-600 transition group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {demo.unions.map((u) => (
                <button key={u.id} type="button" onClick={() => enterSaao(u.id)} className={`${row} border-border bg-white`}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-800"><ShieldCheck size={21} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{L(OFFICERS.saao[u.id])}</span><span className="block text-[13.5px] text-muted">{T(`উপসহকারী কৃষি কর্মকর্তা, ${u.bn} ইউনিয়ন`, `Sub-assistant agriculture officer, ${u.en} union`)}</span></span>
                  <ChevronRight size={20} className="text-primary-600" />
                </button>
              ))}
              <button type="button" onClick={() => navigate('/officer/upazila')} className="group flex w-full items-center gap-3 rounded-2xl bg-primary-950 p-3.5 text-left text-white transition hover:bg-primary-900">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10"><Building2 size={21} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{L(OFFICERS.uao)}</span><span className="block text-[13.5px] text-primary-200">{T('উপজেলা কৃষি অফিসার, গোদাগাড়ী', 'Upazila agriculture officer, Godagari')}</span></span>
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          <div className="mt-6 flex gap-2 rounded-xl bg-white p-3.5 text-[13.5px] leading-6 text-muted ring-1 ring-border"><Info size={17} className="mt-0.5 shrink-0" />{T('সব নাম আর অ্যাকাউন্ট বানানো। আসল ব্যবহারে মোবাইল নম্বর দিয়ে নিবন্ধন হবে — সেটা পরের ধাপের কাজ।', 'All names and accounts are made up. A real launch would register people by mobile number; that comes later.')}</div>
        </div>
      </div>
    </main>
  );
}
