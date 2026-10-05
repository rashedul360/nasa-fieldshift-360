import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, X, LayoutDashboard, LifeBuoy, UsersRound, Map as MapIcon, BellRing, CalendarRange, Building2, Truck, UserRound } from 'lucide-react';
import BrandMark from '../components/brand/BrandMark';
import { LangToggle, PlaceholderBanner, DataStatusChips, ResetDemo } from '../components/chrome';
import { useStore, demo } from '../store';
import { OFFICERS } from '../data/demo';

function Sidebar({ onNavigate }) {
  const { s, dispatch, T, L, hotspots } = useStore();
  const loc = useLocation();
  const isUao = loc.pathname.startsWith('/officer/upazila');
  const open = s.requests.filter((r) => r.status === 'open' && r.union === s.officerUnion).length;
  const alerts = hotspots.filter((h) => h.members.some((m) => m.union === s.officerUnion)).length;
  const nav = [
    { to: '/officer', end: true, icon: LayoutDashboard, label: T('আজকের চিত্র', 'Overview') },
    { to: '/officer/requests', icon: LifeBuoy, label: T('কৃষকের অনুরোধ', 'Farmer requests'), badge: open },
    { to: '/officer/alerts', icon: BellRing, label: T('এলাকার সতর্কতা', 'Area alerts'), badge: alerts, hot: true },
    { to: '/officer/farmers', icon: UsersRound, label: T('কৃষক ও জমি', 'Farmers and fields') },
    { to: '/officer/map', icon: MapIcon, label: T('এলাকার মানচিত্র', 'Area map') },
    { to: '/officer/planting', icon: CalendarRange, label: T('লাগানোর সময় ও দাম', 'Planting and prices') },
    { to: '/officer/supply', icon: Truck, label: T('কবে কত ফসল উঠবে', 'Harvest timing') },
    { to: '/officer/upazila', icon: Building2, label: T('উপজেলা অফিস', 'Upazila office'), badge: s.escalations.filter((e) => !e.ack).length, hot: true },
  ];
  return (
    <div className="flex h-full flex-col bg-primary-950 text-white">
      <div className="border-b border-white/10 p-5"><Link to="/" onClick={onNavigate}><BrandMark inverse /></Link></div>
      <div className="p-4">
        <div className="rounded-2xl bg-white/[.07] p-4">
          <div className="text-[12.5px] text-primary-200">{isUao ? T('উপজেলা কৃষি অফিসার', 'Upazila agriculture officer') : T('উপসহকারী কৃষি কর্মকর্তা', 'Sub-assistant agriculture officer')}</div>
          <div className="mt-0.5 text-[16px] font-bold">{isUao ? L(OFFICERS.uao) : L(OFFICERS.saao[s.officerUnion])}</div>
          {isUao ? (
            <div className="mt-1 text-[13px] text-primary-200">{T('গোদাগাড়ী উপজেলা, রাজশাহী', 'Godagari upazila, Rajshahi')}</div>
          ) : (
            <label className="mt-2 block">
              <span className="sr-only">{T('ইউনিয়ন বদলান', 'Change union')}</span>
              <select value={s.officerUnion} onChange={(e) => dispatch({ type: 'set', patch: { officerUnion: e.target.value } })}
                className="w-full rounded-xl border border-white/15 bg-primary-950 px-2.5 py-2 text-[14px] font-semibold text-white">
                {demo.unions.map((u) => <option key={u.id} value={u.id}>{L(u)} {T('ইউনিয়ন', 'union')}</option>)}
              </select>
            </label>
          )}
          <div className="mt-2 text-[12px] text-primary-300">{T('নমুনা অ্যাকাউন্ট', 'Sample account')}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3" aria-label={T('কর্মকর্তার পাতা', 'Officer pages')}>
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition ${isActive ? 'bg-white text-primary-950' : 'text-primary-100 hover:bg-white/[.07]'}`}>
            <n.icon size={18} /><span className="flex-1">{n.label}</span>
            {n.badge > 0 && <span className={`rounded-full px-1.5 text-[12px] font-bold ${n.hot ? 'bg-red-500 text-white' : 'bg-paddy-500 text-white'}`}>{n.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-white/10 p-3">
        <Link to="/farmer" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold text-primary-100 hover:bg-white/[.07]"><UserRound size={18} />{T('কৃষকের পাতায় যান', 'Go to the farmer view')}</Link>
        <ResetDemo dark className="w-full" />
        <div className="px-1"><DataStatusChips dark /></div>
      </div>
    </div>
  );
}

export default function OfficerLayout() {
  const { s, T, L } = useStore();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState('');
  const loc = useLocation();
  const navigate = useNavigate();
  const isUao = loc.pathname.startsWith('/officer/upazila');
  useEffect(() => { setDrawer(false); window.scrollTo({ top: 0 }); }, [loc.pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const k = (e) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [drawer]);
  const open = s.requests.filter((r) => r.status === 'open' && r.union === s.officerUnion).length;
  const name = isUao ? L(OFFICERS.uao) : L(OFFICERS.saao[s.officerUnion]);
  const search = (e) => { e.preventDefault(); navigate(`/officer/farmers?q=${encodeURIComponent(q.trim())}`); };
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 lg:block"><Sidebar /></aside>
      {drawer && (
        <div className="fixed inset-0 z-[1500] lg:hidden" role="dialog" aria-modal="true" aria-label={T('মেনু', 'Menu')}>
          <div className="absolute inset-0 bg-primary-950/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[290px] max-w-[86vw] shadow-2xl">
            <button type="button" onClick={() => setDrawer(false)} className="absolute right-3 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white" aria-label={T('বন্ধ করুন', 'Close')}><X size={18} /></button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex h-[64px] items-center gap-2.5 px-4 sm:px-6">
            <button type="button" onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-border lg:hidden" aria-label={T('মেনু খুলুন', 'Open menu')}><Menu size={19} /></button>
            <form onSubmit={search} className="hidden max-w-md flex-1 items-center gap-2 rounded-xl bg-black/[.05] px-3 md:flex" role="search">
              <Search size={17} className="text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="h-10 w-full bg-transparent text-[14.5px] outline-none" placeholder={T('কৃষক বা গ্রামের নাম খুঁজুন', 'Search a farmer or village')} aria-label={T('খুঁজুন', 'Search')} />
            </form>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={() => navigate('/officer/requests')} className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-white hover:bg-primary-50" aria-label={T(`খোলা অনুরোধ ${open}টি`, `${open} open requests`)}>
                <Bell size={18} />{open > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{open}</span>}
              </button>
              <LangToggle />
              <div className="hidden text-right sm:block">
                <div className="text-[14px] font-bold">{name}</div>
                <div className="text-[12px] text-muted">{isUao ? T('উপজেলা কৃষি অফিসার', 'Upazila agriculture officer') : T(`উপসহকারী কৃষি কর্মকর্তা, ${demo.unions.find((u) => u.id === s.officerUnion).bn}`, `SAAO, ${s.officerUnion}`)}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-100 font-bold text-primary-800">{name.slice(0, 1)}</div>
            </div>
          </div>
        </header>
        <PlaceholderBanner />
        <main className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
