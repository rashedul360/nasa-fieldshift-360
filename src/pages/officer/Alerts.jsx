import { Link } from 'react-router-dom';
import { BellRing, TrendingDown, Droplets, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store';
import { PageHeader, Card, Badge, Tags, EmptyState, Note, RISK_STYLE } from '../../components/ui';
import { RABI_CROPS, cropName } from '../../engine/crops';
import { num } from '../../engine/dates';
import { bnOf } from '../../engine/text';
import { useOfficerUnion, ClusterCard, unionGlut } from './shared';

export default function Alerts() {
  const { s, T, L, hotspots, farmerOf } = useStore();
  const lang = s.lang;
  const union = useOfficerUnion();
  const hs = hotspots.filter((h) => h.members.some((m) => m.union === union.id));
  const gluts = Object.keys(RABI_CROPS).map((c) => ({ c, g: unionGlut(union, c) })).filter((x) => x.g.risk.level !== 'Low');
  const waterAlerts = s.requests.filter((r) => r.union === union.id && r.type === 'water_alert' && r.status === 'open');
  const myEsc = s.escalations.filter((e) => e.union === union.id);
  const none = hs.length === 0 && gluts.length === 0 && waterAlerts.length === 0;
  return (
    <div>
      <PageHeader eyebrow={T('আগাম সতর্কতা', 'Early warnings')} title={T('এলাকার সতর্কতা', 'Area alerts')} subtitle={T('কাছাকাছি অনেক জমিতে একই সমস্যা, একই সপ্তাহে বেশি ফসল ওঠার ঝুঁকি, আর যাদের জমি খুব শুকনো।', 'The same problem in many nearby fields, too much harvest in the same week, and fields that are badly dry.')} tags={['AI', 'RULE', 'DEMO']} />
      <div className="space-y-4">
        {none && <EmptyState icon={BellRing} title={T('এখন কোনো সতর্কতা নেই', 'No alerts right now')} text={T('নতুন কিছু দেখা দিলে এখানে আসবে।', 'New warnings will appear here.')} />}
        {hs.map((h) => <ClusterCard key={h.id} h={h} union={union} />)}
        {waterAlerts.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center gap-3 border-l-4 !border-l-clay-500 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-clay-50 text-clay-700"><Droplets size={19} /></span>
            <div className="min-w-0 flex-1"><div className="font-bold">{T(`জমি খুব শুকনো: ${L(farmerOf(r.farmerId)?.name)}`, `Field badly dry: ${L(farmerOf(r.farmerId)?.name)}`)}</div><div className="text-[13.5px] text-muted">{cropName(r.crop, lang)}, {lang === 'bn' ? r.villageBn : r.village}</div></div>
            <Link to={`/officer/requests/${r.id}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[14px] font-semibold text-primary-700 hover:bg-primary-50">{T('খুলুন', 'Open')}<ChevronRight size={16} /></Link>
          </Card>
        ))}
        {gluts.map(({ c, g }) => (
          <Card key={c} className="flex flex-wrap items-center gap-3 border-l-4 !border-l-paddy-500 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-paddy-50 text-paddy-700"><TrendingDown size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-bold">{T(`${bnOf(cropName(c, 'bn'))} দাম পড়ার ঝুঁকি`, `${cropName(c, 'en')}: price-drop risk`)} <span className={`chip ${RISK_STYLE[g.risk.level].cls}`}>{L(RISK_STYLE[g.risk.level])}</span></div>
              <div className="text-[13.5px] text-muted">{T(`সবচেয়ে ব্যস্ত সপ্তাহে স্বাভাবিকের ${num(g.peak, 'bn', { dp: 1 })} গুণ ফসল উঠবে`, `The busiest week brings ${num(g.peak, 'en', { dp: 1 })}× the normal amount`)}</div>
            </div>
            <Link to="/officer/planting" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[14px] font-semibold text-primary-700 hover:bg-primary-50">{T('লাগানোর পালা দেখুন', 'See planting slots')}<ChevronRight size={16} /></Link>
          </Card>
        ))}
      </div>
      {myEsc.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="text-[19px] font-bold">{T('উপজেলা কৃষি অফিসারকে যা জানিয়েছেন', 'Sent up to the upazila officer')}</h2>
          <ul className="mt-2 divide-y divide-border">{myEsc.map((e) => <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[14.5px]"><span>{L(e.text)}</span>{e.ack ? <Badge><CheckCircle2 size={12} />{T('অফিসার দেখেছেন', 'Seen by the officer')}</Badge> : <Badge tone="amber">{T('উত্তরের অপেক্ষায়', 'Waiting')}</Badge>}</li>)}</ul>
        </Card>
      )}
      <Note className="mt-6">{T('কাছাকাছি একই রকম খবরগুলো AI এক গুচ্ছে ধরে। তবে কৃষকের কাছে কোনো পরামর্শ যাওয়ার আগে আপনি নিজে পড়ে অনুমোদন করেন।', 'AI groups similar nearby reports together, but nothing reaches farmers until you have read and approved it.')} <Tags list={['AI']} /></Note>
    </div>
  );
}
