import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Home, ScanLine, Sprout, Droplets, LifeBuoy, Wheat, MapPinned, ShieldCheck, Check, Ellipsis, X } from 'lucide-react';
import BrandMark from '../components/brand/BrandMark';
import { LangToggle, PlaceholderBanner, ResetDemo } from '../components/chrome';
import { useStore, demo } from '../store';
import { cropName } from '../engine/crops';
import { num } from '../engine/dates';

export function useFarmerNav() {
  const { T } = useStore();
  return [
    { to: '/farmer', end: true, icon: Home, label: T('হোম', 'Home') },
    { to: '/farmer/farm', icon: MapPinned, label: T('আমার জমি', 'My field') },
    { to: '/farmer/plan', icon: Sprout, label: T('মৌসুমের পরিকল্পনা', 'Season plan'), short: T('পরিকল্পনা', 'Plan') },
    { to: '/farmer/today', icon: Droplets, label: T('আজকের কাজ', 'Today'), short: T('আজ', 'Today') },
    { to: '/farmer/doctor', icon: ScanLine, label: T('ফসলের ডাক্তার', 'Crop doctor'), short: T('ডাক্তার', 'Doctor') },
    { to: '/farmer/help', icon: LifeBuoy, label: T('সাহায্য', 'Help') },
    { to: '/farmer/harvest', icon: Wheat, label: T('ফসল তোলা ও বিক্রি', 'Harvest'), short: T('ফসল তোলা', 'Harvest') },
  ];
}

function FarmerSwitcher() {
  const { s, dispatch, L, T, farmer, farmers } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const heroes = farmers.filter((f) => f.hero);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-2 text-left hover:bg-primary-50" aria-haspopup="listbox" aria-expanded={open} aria-label={T('কৃষক বদলান', 'Switch farmer')}>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-100 text-[14px] font-bold text-primary-800">{L(farmer.name).slice(0, 1)}</span>
        <span className="hidden leading-tight md:block">
          <span className="block max-w-[130px] truncate text-[14px] font-bold">{L(farmer.name)}</span>
          <span className="block text-[11.5px] text-muted">{L(demo.unions.find((u) => u.id === farmer.union))}</span>
        </span>
        <ChevronDown size={15} className="text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[300px] max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-white p-2 shadow-[var(--shadow-lift)]" role="listbox">
          <div className="px-2 pb-1.5 pt-1 text-[13px] font-semibold text-muted">{T('অন্য নমুনা কৃষক দেখুন', 'View another sample farmer')}</div>
          {heroes.map((h) => (
            <button key={h.id} type="button" role="option" aria-selected={h.id === s.farmerId}
              onClick={() => { dispatch({ type: 'chooseFarmer', id: h.id }); setOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-primary-50 ${h.id === s.farmerId ? 'bg-primary-50' : ''}`}>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-100 text-[15px] font-bold text-primary-800">{L(h.name).slice(0, 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-bold">{L(h.name)}</span>
                <span className="block truncate text-[12.5px] text-muted">{L(demo.unions.find((u) => u.id === h.union))}, {num(h.area_dec / 33, s.lang, { dp: 1 })} {T('বিঘা', 'bigha')}, {T('গতবার', 'last')} {cropName(h.last_crop, s.lang)}</span>
              </span>
              {h.id === s.farmerId && <Check size={16} className="text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MoreSheet({ items, onClose }) {
  const { T } = useStore();
  return (
    <div className="fixed inset-0 z-[1500] lg:hidden" role="dialog" aria-modal="true" aria-label={T('আরও', 'More')}>
      <div className="absolute inset-0 bg-primary-950/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mb-2 flex items-center justify-between"><span className="font-display text-[18px] font-bold">{T('আরও', 'More')}</span><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/5" aria-label={T('বন্ধ করুন', 'Close')}><X size={18} /></button></div>
        <div className="grid grid-cols-2 gap-2">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={onClose} className={({ isActive }) => `flex items-center gap-2.5 rounded-xl border px-3 py-3 text-[15px] font-semibold ${isActive ? 'border-primary-300 bg-primary-50 text-primary-800' : 'border-border'}`}><n.icon size={19} />{n.label}</NavLink>
          ))}
          <Link to="/officer" onClick={onClose} className="col-span-2 flex items-center gap-2.5 rounded-xl bg-primary-950 px-3 py-3 text-[15px] font-semibold text-white"><ShieldCheck size={19} />{T('কৃষি কর্মকর্তার পাতা দেখুন', 'Open the officer view')}</Link>
        </div>
        <div className="mt-3 flex justify-center"><ResetDemo /></div>
      </div>
    </div>
  );
}

export default function FarmerLayout() {
  const { T, unreadAdvisories } = useStore();
  const nav = useFarmerNav();
  const loc = useLocation();
  const navigate = useNavigate();
  const [more, setMore] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); setMore(false); }, [loc.pathname]);
  const bottom = [nav[0], nav[2], nav[3], nav[4]];
  const rest = [nav[1], nav[5], nav[6]];
  const restActive = rest.some((n) => loc.pathname.startsWith(n.to));
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="page-shell flex h-[64px] items-center justify-between gap-3">
          <Link to="/" aria-label={T('প্রথম পাতা', 'Home page')} className="shrink-0"><span className="hidden sm:block"><BrandMark /></span><span className="sm:hidden"><BrandMark compact size={38} /></span></Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/farmer/help')} className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-ink/70 hover:bg-primary-50" aria-label={unreadAdvisories ? T(`কর্মকর্তার ${num(unreadAdvisories, 'bn')}টি নতুন বার্তা`, `${unreadAdvisories} new messages from your officer`) : T('কর্মকর্তার বার্তা', 'Messages from your officer')}>
              <Bell size={18} />
              {unreadAdvisories > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{unreadAdvisories}</span>}
            </button>
            <FarmerSwitcher />
            <LangToggle />
            <Link to="/officer" className="hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary-950 px-3 text-[14px] font-semibold text-white hover:bg-primary-900 lg:inline-flex"><ShieldCheck size={16} />{T('কর্মকর্তার পাতা', 'Officer view')}</Link>
          </div>
        </div>
        <nav className="hidden border-t border-border lg:block" aria-label={T('কৃষকের পাতা', 'Farmer pages')}>
          <div className="page-shell hide-scrollbar flex gap-1 overflow-x-auto">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-[14.5px] font-semibold transition ${isActive ? 'text-primary-800 after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-primary-600' : 'text-ink/65 hover:text-ink'}`}>
                <n.icon size={16} />{n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <PlaceholderBanner />
      <main className="page-shell relative py-6 pb-28 lg:py-8 lg:pb-14"><Outlet /></main>
      <footer className="hidden border-t border-border lg:block">
        <div className="page-shell flex items-center justify-between py-4 text-[13px] text-muted">
          <span>{T('সব সুপারিশ সিদ্ধান্ত নিতে সাহায্যের জন্য। চূড়ান্ত সিদ্ধান্তের আগে কৃষি কর্মকর্তার সঙ্গে কথা বলুন।', 'Recommendations help you decide. Talk to your agriculture officer before you commit.')}</span>
          <ResetDemo />
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-2 pt-1.5 backdrop-blur lg:hidden" style={{ paddingBottom: 'max(.5rem, env(safe-area-inset-bottom))' }} aria-label={T('কৃষকের পাতা', 'Farmer pages')}>
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {bottom.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11.5px] font-semibold ${isActive ? 'text-primary-800' : 'text-ink/55'}`}>
              {({ isActive }) => (<><span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? 'bg-primary-100' : ''}`}><n.icon size={19} /></span><span>{n.short ?? n.label}</span></>)}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMore(true)} className={`flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11.5px] font-semibold ${restActive ? 'text-primary-800' : 'text-ink/55'}`} aria-haspopup="dialog">
            <span className={`grid h-7 w-12 place-items-center rounded-full ${restActive ? 'bg-primary-100' : ''}`}><Ellipsis size={19} /></span><span>{T('আরও', 'More')}</span>
          </button>
        </div>
      </nav>
      {more && <MoreSheet items={rest} onClose={() => setMore(false)} />}
    </div>
  );
}
