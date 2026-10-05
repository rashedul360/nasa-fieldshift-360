// The season on a Bangla-month calendar (Kartik → Shrabon): this Rabi crop, the next crop in the rotation,
// then T. Aman. Farmers plan by the Bangla month, so this is the main way the plan is drawn.
import { useStore } from '../store';
import { BN_MONTHS, BN_MONTHS_EN, banglaMonthStart, fmtDate, fmtBangla, addDays } from '../engine/dates';
import { ymd } from '../engine/dates';
import { PLAN_SEASON } from '../engine/climate';

const Y0 = PLAN_SEASON - 1; // Bangla year that starts on 14 April 2026
const MONTHS = [
  ...[6, 7, 8, 9, 10, 11].map((m) => ({ m, start: banglaMonthStart(Y0, m) })),
  ...[0, 1, 2, 3].map((m) => ({ m, start: banglaMonthStart(Y0 + 1, m) })),
];
const START = MONTHS[0].start;
const END = banglaMonthStart(Y0 + 1, 4);
const pct = (t) => Math.max(0, Math.min(100, ((t - START) / (END - START)) * 100));

export default function SeasonRibbon({ dark = false, compact = false, showToday = true }) {
  const { s, T, L, chosen, rotation: r, today } = useStore();
  const lang = s.lang;
  const nextStart = r.best ? r.sowT : null;
  const nextEnd = r.best ? addDays(r.sowT, r.best.crop.days) : null;
  const amanStart = ymd(PLAN_SEASON, 7, 15);
  const rows = [
    { key: 'rabi', label: T('এই রবি', 'This Rabi'), name: L(chosen.crop.name), from: chosen.t0, to: chosen.hw.end, harvestFrom: chosen.hw.start, cls: dark ? 'bg-primary-300 text-primary-950' : 'bg-primary-600 text-white' },
    r.best && { key: 'next', label: T('পরের ফসল', 'Next crop'), name: L(r.best.crop.name), from: nextStart, to: nextEnd, cls: dark ? 'bg-sky-200 text-sky-900' : 'bg-sky-600 text-white' },
    { key: 'aman', label: T('বর্ষায়', 'Monsoon'), name: T('রোপা আমন', 'T. Aman rice'), from: amanStart, to: END, open: true, cls: dark ? 'bg-white/25 text-white' : 'bg-primary-100 text-primary-900' },
  ].filter(Boolean);
  const ink = dark ? 'text-white' : 'text-ink';
  const quiet = dark ? 'text-white/70' : 'text-muted';
  const grid = dark ? 'border-white/15' : 'border-black/[.07]';
  return (
    <div className="hide-scrollbar -mx-1 overflow-x-auto px-1" role="img" aria-label={T(`মৌসুমের পরিকল্পনা: ${chosen.crop.name.bn} ${fmtBangla(chosen.t0, 'bn')} থেকে ${fmtBangla(chosen.hw.end, 'bn')}`, `Season plan: ${chosen.crop.name.en} from ${fmtDate(chosen.t0, 'en')} to ${fmtDate(chosen.hw.end, 'en')}`)}>
      <div className={compact ? 'min-w-[520px]' : 'min-w-[600px]'}>
        <div className="relative flex">
          {MONTHS.map((mo, i) => (
            <div key={mo.m} className={`flex-1 border-l ${grid} ${i === 0 ? 'border-l-0' : ''} pb-1.5 pl-1.5`}>
              <div className={`font-display text-[13px] font-semibold ${ink}`}>{lang === 'bn' ? BN_MONTHS[mo.m] : BN_MONTHS_EN[mo.m]}</div>
              {!compact && <div className={`text-[11px] ${quiet}`}>{fmtDate(mo.start, lang)}</div>}
            </div>
          ))}
        </div>
        <div className={`relative mt-1 space-y-2 border-t ${grid} pt-2.5`}>
          {rows.map((row) => {
            const left = pct(row.from), width = Math.max(2, pct(row.to) - left);
            return (
              <div key={row.key} className="relative h-9">
                <div className={`absolute top-0 flex h-9 items-center gap-1.5 overflow-hidden rounded-lg px-2.5 text-[13px] font-semibold ${row.cls} ${row.open ? 'rounded-r-none' : ''}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${row.name}: ${fmtDate(row.from, lang)} – ${fmtDate(row.to, lang)}`}>
                  <span className="truncate">{row.name}</span>
                  {row.harvestFrom && <span className="absolute inset-y-1 right-1 rounded-md bg-paddy-300/90" style={{ width: `${((row.to - row.harvestFrom) / (row.to - row.from)) * 100}%` }} aria-hidden="true" />}
                </div>
                <span className={`absolute top-1/2 -translate-y-1/2 text-[12px] ${quiet}`} style={left > 30 ? { right: `${100 - left + 1}%` } : { left: `${left + width + 1}%` }}>{row.label}</span>
              </div>
            );
          })}
          {showToday && (
            <div className="pointer-events-none absolute -top-1 bottom-0" style={{ left: `${pct(today)}%` }}>
              <div className={`h-full border-l-2 border-dashed ${dark ? 'border-paddy-300' : 'border-paddy-500'}`} />
              <span className={`absolute -top-5 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 text-[11px] font-semibold ${dark ? 'bg-paddy-300 text-primary-950' : 'bg-paddy-500 text-white'}`}>{T('আজ', 'Today')}</span>
            </div>
          )}
        </div>
        {!compact && (
          <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] ${quiet}`}>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-4 rounded-sm bg-paddy-300" />{T('ফসল তোলার সময়', 'Harvest weeks')}</span>
            <span>{T(`লাগানো ${fmtBangla(chosen.t0, 'bn')} (${fmtDate(chosen.t0, 'bn')}), তোলা শেষ ${fmtBangla(chosen.hw.end, 'bn')}`, `Planting ${fmtDate(chosen.t0, 'en')} (${fmtBangla(chosen.t0, 'en')}), harvest ends ${fmtDate(chosen.hw.end, 'en')}`)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
