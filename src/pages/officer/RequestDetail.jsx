import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Camera, CheckCircle2, MapPin, Send, UserRound, Footprints, ArrowUpRight, Droplets, Sprout, Layers } from 'lucide-react';
import { useStore, soilData } from '../../store';
import { PageHeader, Card, Badge, Button, Tags, Note, EmptyState } from '../../components/ui';
import MapView from '../../components/MapView';
import { SYMPTOMS, DISEASES, DEMO_TODAY } from '../../data/demo';
import { cropName, IRRIGATION } from '../../engine/crops';
import { num, fmtDate } from '../../engine/dates';
import { PRIORITY, REQ_STATUS, ageLabel, sortRequests } from './shared';

// Starting text for a reply, by problem type. The officer edits it before sending.
function template(r, T) {
  if (r.symptom === 'leaf_spot') return T('ছবি দেখেছি। দাগওয়ালা নিচের পাতাগুলো ছিঁড়ে মাটিতে পুঁতে ফেলুন, আর পাতা না ভিজিয়ে গোড়ায় পানি দিন। দুই দিন পর আরেকটা ছবি পাঠাবেন। কোনো ওষুধ দেওয়ার আগে আমাকে জানাবেন।', 'I have seen your photo. Pick off the spotted lower leaves and bury them, and water at the base without wetting the leaves. Send another photo in two days, and tell me before you use any chemical.');
  if (r.symptom === 'water') return T('আপনার জমি দেখতে আসছি। আপাতত সকালে বা বিকেলে অল্প করে সেচ দিন। নলকূপের অপারেটরের সঙ্গে আমি কথা বলছি।', 'I am coming to see your field. For now, water a little in the morning or evening. I am talking to the tube-well operator.');
  if (r.symptom === 'aphid') return T('হলুদ আঠালো ফাঁদ লাগান আর জাব পোকা ধরা ডগাগুলো ভেঙে ফেলুন। দুই-তিন দিনে বাড়লে আমাকে জানাবেন।', 'Put up yellow sticky traps and snap off the infested tips. Tell me if it spreads in two or three days.');
  if (r.symptom === 'wilt') return T('কয়েকটা নেতানো গাছ গোড়াসহ তুলে সরিয়ে ফেলুন, জমিতে পানি জমতে দেবেন না। কাল আমি জমি দেখতে আসব।', 'Pull out the wilted plants, roots and all, and do not let water stand in the field. I will come and look tomorrow.');
  return T('আপনার প্রশ্ন পেয়েছি, ধন্যবাদ। আজকের মধ্যে ফোন করে বিস্তারিত বলছি।', 'Thank you, I have your question. I will call you today with the details.');
}

export default function RequestDetail() {
  const { id } = useParams();
  return <RequestDetailInner key={id} id={id} />;
}

function RequestDetailInner({ id }) {
  const navigate = useNavigate();
  const { s, dispatch, T, L, toast, unionsAll, farmerOf } = useStore();
  const lang = s.lang;
  const r = s.requests.find((x) => x.id === id);
  const [text, setText] = useState(null);
  if (!r) return <EmptyState title={T('অনুরোধটি পাওয়া যায়নি', 'Request not found')} text={T('হয়তো নমুনা আবার শুরু করা হয়েছে।', 'The demo may have been restarted.')} action={<Button to="/officer/requests">{T('অনুরোধের তালিকায় ফিরুন', 'Back to requests')}</Button>} />;
  const f = farmerOf(r.farmerId);
  const plan = unionsAll[r.union].plans.find((p) => p.plot_id === r.farmerId);
  const soil = soilData.unions[r.union];
  const draft = text ?? template(r, T);
  const queue = sortRequests(s.requests.filter((x) => x.union === r.union && x.status === 'open' && x.id !== r.id));
  const next = queue[0];
  const done = r.status === 'resolved';
  const update = (patch, bn, en) => { dispatch({ type: 'updateRequest', ids: [r.id], patch }); toast(bn, en); };
  const reply = () => {
    if (!draft.trim()) return;
    dispatch({ type: 'addAdvisory', adv: { id: `A-${r.id}-${Date.now().toString(36)}`, text: draft.trim(), to: [r.farmerId], at: DEMO_TODAY, request: r.id } });
    update({ status: 'answered' }, 'কৃষকের কাছে উত্তর গেছে', 'Reply sent to the farmer');
  };
  const askInfo = () => {
    dispatch({ type: 'addAdvisory', adv: { id: `I-${r.id}-${Date.now().toString(36)}`, text: T('পাতার ওপর আর নিচ দুই দিকের আরও পরিষ্কার ছবি পাঠান, দিনের আলোয় তুলবেন।', 'Please send clearer photos of both sides of the leaf, taken in daylight.'), to: [r.farmerId], at: DEMO_TODAY, request: r.id } });
    update({ status: 'need_info' }, 'আরও ছবি চাওয়া হয়েছে', 'Asked for more photos');
  };
  const escalated = s.escalations.some((e) => e.id === `REQ-${r.id}`);
  const escalate = () => {
    dispatch({ type: 'escalate', esc: { id: `REQ-${r.id}`, union: r.union, kind: 'request', text: { bn: `${f.name.bn} (${r.villageBn}): ${SYMPTOMS[r.symptom].bn}`, en: `${f.name.en} (${r.village}): ${SYMPTOMS[r.symptom].en.toLowerCase()}` }, at: DEMO_TODAY } });
    toast('উপজেলা কৃষি অফিসারকে জানানো হয়েছে', 'Sent up to the upazila officer');
  };
  return (
    <div>
      <Link to="/officer/requests" className="mb-4 inline-flex items-center gap-2 text-[14.5px] font-semibold text-muted hover:text-primary-700"><ArrowLeft size={16} />{T('সব অনুরোধ', 'All requests')}</Link>
      <PageHeader eyebrow={T(`অনুরোধ নম্বর ${r.id}`, `Request ${r.id}`)} title={`${L(f.name)}: ${L(SYMPTOMS[r.symptom])}`}
        subtitle={`${lang === 'bn' ? r.villageBn : r.village}, ${cropName(r.crop, lang)}, ${ageLabel(r.created, T)}`}
        action={<><Badge tone={PRIORITY[r.priority].tone}>{L(PRIORITY[r.priority])}</Badge><Badge tone={REQ_STATUS[r.status].tone}>{L(REQ_STATUS[r.status])}</Badge></>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_.85fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><UserRound size={22} /></div><div><h2 className="text-[17px] font-bold">{T('কৃষক যা লিখেছেন', 'What the farmer wrote')}</h2><p className="text-[13.5px] text-muted">{L(f.name)}, {T(`${num(f.area_dec, 'bn')} শতক`, `${f.area_dec} decimal`)}, {L(IRRIGATION[f.irrigation])}</p></div></div>
            <p className="mt-4 rounded-xl bg-canvas p-4 text-[16px] leading-7">“{L(r.text)}”</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[13px]">
              <div className="rounded-xl border border-border p-3"><Camera size={18} className="mx-auto text-primary-600" /><div className="mt-1.5 font-semibold">{r.image ? T('ছবি আছে', 'Photo') : r.ai ? T('ছবি (নমুনা)', 'Photo (sample)') : r.imageDropped ? T('ছবি সংরক্ষিত হয়নি', 'Photo not kept') : T('ছবি নেই', 'No photo')}</div></div>
              <div className="rounded-xl border border-border p-3"><MapPin size={18} className="mx-auto text-primary-600" /><div className="mt-1.5 font-semibold">{T('জায়গা জানা', 'Location known')}</div></div>
              <div className="rounded-xl border border-border p-3"><Sprout size={18} className="mx-auto text-primary-600" /><div className="mt-1.5 font-semibold">{plan ? cropName(plan.crop, lang) : T('পরিকল্পনা নেই', 'No plan')}</div></div>
            </div>
            {r.image && <img src={r.image} alt={T('কৃষকের পাঠানো ছবি', 'Photo from the farmer')} className="mt-4 max-h-64 rounded-xl object-contain" />}
            {r.ai && (
              <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-bold text-violet-900"><Bot size={18} />{T('ফসলের ডাক্তারের ধারণা', 'Crop doctor’s first look')}</div><Tags list={['DEMO']} /></div>
                <div className="mt-3 space-y-1.5">{r.ai.map((a) => <div key={a.k} className="grid grid-cols-[minmax(0,1fr)_90px_44px] items-center gap-2 text-[13.5px]"><span className="text-violet-950">{L(DISEASES[a.k])}</span><div className="h-1.5 rounded-full bg-white"><div className="h-full rounded-full bg-violet-500" style={{ width: `${a.p * 100}%` }} /></div><b className="text-right tabular">{num(a.p * 100, lang)}%</b></div>)}</div>
                {r.ai[0].p < 0.7 && <p className="mt-3 text-[13.5px] leading-5 text-violet-800">{T('সম্ভাবনা ৭০ শতাংশের কম, তাই আপনার চোখে দেখে নেওয়া দরকার।', 'The top match is under 70%, so it needs your judgement.')}</p>}
              </div>
            )}
          </Card>
          <Card className="overflow-hidden">
            <MapView center={[f.lat, f.lon]} zoom={15} basemap="satellite" points={[{ id: f.id, lat: f.lat, lon: f.lon, color: '#d08f26', r: 10, ring: '#ffffff', label: L(f.name) }]} height={240} className="!rounded-none !border-0" label={T('কৃষকের জমি', 'Farmer’s field')} />
            <div className="grid grid-cols-1 gap-2 p-4 text-[13.5px] sm:grid-cols-3">
              <div className="rounded-xl bg-canvas p-3"><Sprout size={16} className="text-primary-600" /><div className="mt-1.5 text-muted">{T('পরিকল্পনা', 'Plan')}</div><div className="font-bold">{plan ? `${cropName(plan.crop, lang)}, ${fmtDate(plan.date, lang)}` : '—'}</div></div>
              <div className="rounded-xl bg-canvas p-3"><Droplets size={16} className="text-sky-600" /><div className="mt-1.5 text-muted">{T('সেচ', 'Water')}</div><div className="font-bold">{L(IRRIGATION[f.irrigation])}</div></div>
              <div className="rounded-xl bg-canvas p-3"><Layers size={16} className="text-clay-500" /><div className="mt-1.5 text-muted">{T('মাটি', 'Soil')}</div><div className="font-bold">pH {num(soil.ph, lang, { dp: 1 })}, {T('জৈব', 'OM')} {num(soil.om_pct, lang, { dp: 1 })}%</div></div>
            </div>
          </Card>
        </div>

        <Card className="h-fit p-5 sm:p-6 xl:sticky xl:top-24">
          <h2 className="text-[20px] font-bold">{T('আপনার উত্তর', 'Your reply')}</h2>
          {(r.status === 'answered' || done) && <Note tone="ok" className="mt-3">{T('উত্তর পাঠানো হয়েছে। কৃষক তাঁর "সাহায্য" পাতায় দেখবেন।', 'Reply sent. The farmer will see it on their Help page.')}</Note>}
          <label className="mt-4 block text-[14.5px] font-semibold" htmlFor="reply">{T('কৃষককে কী বলবেন', 'What to tell the farmer')}</label>
          <textarea id="reply" rows={7} value={draft} onChange={(e) => setText(e.target.value)} disabled={done} className="mt-2 w-full rounded-xl border border-border p-3 text-[15px] leading-7 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 disabled:bg-canvas" />
          <p className="mt-1 text-[12.5px] text-muted">{T('সমস্যার ধরন দেখে একটা খসড়া দেওয়া আছে, দরকারমতো বদলে নিন।', 'A draft is filled in from the problem type. Change it as you need.')}</p>
          <Button onClick={reply} disabled={done || !draft.trim()} className="mt-3 w-full py-3"><Send size={16} />{T('কৃষককে উত্তর পাঠান', 'Send reply')}</Button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={askInfo} disabled={done}><Camera size={16} />{T('আরও ছবি চান', 'Ask for photos')}</Button>
            <Button variant="secondary" onClick={() => update({ visit: !r.visit, priority: r.visit ? r.priority : 'High' }, r.visit ? 'জমিতে যাওয়ার তালিকা থেকে বাদ' : 'জমিতে যাওয়ার তালিকায় রাখা হলো', r.visit ? 'Removed from visits' : 'Added to field visits')} disabled={done}><Footprints size={16} />{r.visit ? T('জমিতে যাবেন ✓', 'Visiting ✓') : T('জমিতে যাবেন', 'Plan a visit')}</Button>
            <Button variant="secondary" onClick={escalate} disabled={escalated}><ArrowUpRight size={16} />{escalated ? T('উপজেলায় জানানো', 'Sent up') : T('উপজেলায় জানান', 'Send up')}</Button>
            <Button variant="ghost" className="text-primary-700" onClick={() => update({ status: 'resolved' }, 'মিটে গেছে বলে রাখা হলো', 'Marked as resolved')} disabled={done}><CheckCircle2 size={16} />{T('মিটে গেছে', 'Resolved')}</Button>
          </div>
          {next && <Button variant="ghost" onClick={() => navigate(`/officer/requests/${next.id}`)} className="mt-4 w-full border border-dashed border-border">{T('পরের খোলা অনুরোধ', 'Next open request')}</Button>}
        </Card>
      </div>
    </div>
  );
}
