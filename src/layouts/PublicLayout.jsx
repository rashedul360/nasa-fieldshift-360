import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BrandMark from '../components/brand/BrandMark';
import { LangToggle, PlaceholderBanner } from '../components/chrome';
import { useStore } from '../store';

export const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function PublicLayout() {
  const { T } = useStore();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 40);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const nav = [['how', T('কীভাবে কাজ করে', 'How it works')], ['land', T('জমি বাছাই', 'Your field')], ['data', T('তথ্যের উৎস', 'Data')], ['officer', T('কৃষি কর্মকর্তা', 'Officers')]];
  const go = (id) => { setOpen(false); scrollToId(id); };
  // The hero photo is bright haze at the top, so the header keeps dark text and only gains a background on scroll.
  const onDark = false;
  const clear = !solid && !open;
  return (
    <div className="min-h-screen bg-canvas">
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors ${clear ? 'bg-transparent' : 'border-b border-border bg-white/95 backdrop-blur'}`}>
        <div className="page-shell flex h-[72px] items-center justify-between gap-4">
          <Link to="/" aria-label={T('প্রথম পাতা', 'Home')}><BrandMark inverse={onDark} /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label={T('প্রধান', 'Main')}>
            {nav.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)} className={`rounded-lg px-3 py-2 text-[15px] font-semibold transition ${onDark ? 'text-white/90 hover:bg-white/10' : 'text-ink/75 hover:bg-primary-50 hover:text-primary-800'}`}>{label}</button>)}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <LangToggle dark={onDark} />
            <Link to="/login" className={`inline-flex h-10 items-center rounded-xl px-4 text-[15px] font-semibold shadow-sm ${onDark ? 'bg-white text-primary-900 hover:bg-primary-50' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>{T('শুরু করুন', 'Get started')}</Link>
          </div>
          <button type="button" onClick={() => setOpen(!open)} className={`grid h-10 w-10 place-items-center rounded-xl sm:hidden ${onDark ? 'bg-white/10 text-white' : 'border border-border'}`} aria-label={T('মেনু', 'Menu')} aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {open && (
          <div className="border-t border-border bg-white sm:hidden">
            <div className="page-shell flex flex-col gap-1 py-3">
              {nav.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)} className="rounded-lg px-3 py-3 text-left text-[15px] font-semibold hover:bg-primary-50">{label}</button>)}
              <div className="mt-2 flex gap-2"><LangToggle /><Link to="/login" className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-primary-600 text-[15px] font-semibold text-white">{T('শুরু করুন', 'Get started')}</Link></div>
            </div>
          </div>
        )}
      </header>
      <Outlet />
      <div className="fixed inset-x-0 bottom-0 z-40"><PlaceholderBanner /></div>
    </div>
  );
}
