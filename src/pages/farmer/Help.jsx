import { useEffect, useRef, useState } from 'react';
import { Camera, MapPin, Send, UserRoundCheck, MessageSquareText, Clock, X } from 'lucide-react';
import { useStore, demo } from '../../store';
import { PageHeader, Card, Button, Badge, EmptyState, Note } from '../../components/ui';
import { OFFICERS, SYMPTOMS } from '../../data/demo';
import { fmtDate, daysBetween, num } from '../../engine/dates';

const TYPES = {
  disease: { bn: 'পাতায় দাগ বা রোগ', en: 'Spots or disease', symptom: 'leaf_spot', priority: 'Medium' },
  pest: { bn: 'পোকার আক্রমণ', en: 'Pests', symptom: 'aphid', priority: 'Medium' },
  water: { bn: 'সেচের পানি পাচ্ছি না', en: 'Not getting water', symptom: 'water', priority: 'High' },
  question: { bn: 'অন্য কোনো প্রশ্ন', en: 'Something else', symptom: 'question', priority: 'Low' },
};
const STATUS = {
  open: { tone: 'amber', bn: 'উত্তরের অপেক্ষায়', en: 'Waiting for a reply' },
  need_info: { tone: 'blue', bn: 'আরও ছবি চেয়েছেন', en: 'Officer asked for more' },
  answered: { tone: 'green', bn: 'উত্তর দিয়েছেন', en: 'Answered' },
  resolved: { tone: 'slate', bn: 'মিটে গেছে', en: 'Resolved' },
};

export default function Help() {
  const { s, dispatch, T, L, toast, farmer, chosen, today, myAdvisories } = useStore();
  const lang = s.lang;
  const [type, setType] = useState('disease');
  const [text, setText] = useState('');
  const [img, setImg] = useState(null);
  const [err, setErr] = useState(null);
  const fileRef = useRef();
  const myReqs = s.requests.filter((r) => r.farmerId === farmer.id).sort((a, b) => b.created - a.created);
  useEffect(() => { dispatch({ type: 'set', patch: { seenAdvisories: myAdvisories.length } }); }, [myAdvisories.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr({ bn: 'শুধু ছবি দেওয়া যাবে।', en: 'Please choose a photo.' }); return; }
    setErr(null);
    const r = new FileReader();
    r.onload = () => setImg(r.result);
    r.readAsDataURL(f);
  };
  const submit = (e) => {
    e.preventDefault();
    const t = TYPES[type];
    if (type === 'question' && !text.trim()) { setErr({ bn: 'আপনার প্রশ্নটা লিখুন।', en: 'Please write your question.' }); return; }
    const body = text.trim() || L(t);
    dispatch({ type: 'addRequest', req: {
      id: `H-${farmer.id}-${Date.now().toString(36)}`, farmerId: farmer.id, union: farmer.union, village: farmer.village, villageBn: farmer.villageBn, lat: farmer.lat, lon: farmer.lon,
      crop: chosen.crop.id, symptom: t.symptom, type: 'help', text: { bn: body, en: body }, ai: null, image: img, created: today, status: 'open', priority: t.priority, mine: true } });
    setText(''); setImg(null); setErr(null);
    toast('অনুরোধ পাঠানো হয়েছে', 'Request sent');
  };

  return (
    <div>
      <PageHeader eyebrow={T('সাহায্য', 'Help')} title={T('কৃষি কর্মকর্তার কাছে জানান', 'Ask your agriculture officer')}
        subtitle={T('আপনার জমির জায়গা আর ফসলের নাম নিজে থেকেই সঙ্গে যাবে। শুধু সমস্যাটা বলুন।', 'Your field’s location and crop are added for you. Just tell us the problem.')} />
      <div className="grid gap-6 lg:grid-cols-[1fr_.95fr]">
        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} noValidate>
            <fieldset>
              <legend className="text-[15px] font-semibold">{T('কী সমস্যা?', 'What is the problem?')}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.entries(TYPES).map(([k, t]) => (
                  <label key={k} className={`cursor-pointer rounded-xl border px-3 py-3 text-[15px] font-semibold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary-100 ${type === k ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-border hover:bg-canvas'}`}>
                    <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} className="sr-only" />{L(t)}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 block" htmlFor="help-text">
              <span className="text-[15px] font-semibold">{T('একটু খুলে বলুন', 'Tell us a little more')} <span className="font-normal text-muted">{type === 'question' ? '' : T('(না লিখলেও চলবে)', '(optional)')}</span></span>
              <textarea id="help-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="mt-2 w-full rounded-xl border border-border p-3 text-[15.5px] leading-7 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50"
                placeholder={T('যেমন: টমেটোর নিচের পাতায় বাদামি দাগ, তিন দিন ধরে বাড়ছে', 'For example: brown spots on the lower tomato leaves, spreading for three days')} />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}><Camera size={16} />{img ? T('ছবি বদলান', 'Change photo') : T('ছবি দিন', 'Add a photo')}</Button>
              {img && <span className="relative"><img src={img} alt={T('যুক্ত করা ছবি', 'Attached photo')} className="h-11 w-11 rounded-lg object-cover" /><button type="button" onClick={() => setImg(null)} className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-white" aria-label={T('ছবি সরান', 'Remove photo')}><X size={12} /></button></span>}
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-canvas px-3 py-2 text-[13.5px] text-muted"><MapPin size={14} className="text-primary-600" />{lang === 'bn' ? farmer.villageBn : farmer.village}, {L(demo.unions.find((u) => u.id === farmer.union))}</span>
            </div>
            {err && <Note tone="warn" className="mt-3">{L(err)}</Note>}
            <Button type="submit" className="mt-5 w-full py-3"><Send size={16} />{T('পাঠিয়ে দিন', 'Send')}</Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-700"><UserRoundCheck size={23} /></div>
              <div><h2 className="text-[17px] font-bold">{L(OFFICERS.saao[farmer.union])}</h2><p className="text-[13.5px] text-muted">{T(`উপসহকারী কৃষি কর্মকর্তা, ${demo.unions.find((u) => u.id === farmer.union).bn} ইউনিয়ন (নমুনা)`, `Sub-assistant agriculture officer, ${farmer.union} union (sample)`)}</p></div>
            </div>
            <h3 className="mt-5 flex items-center gap-2 text-[15px] font-bold"><MessageSquareText size={17} className="text-primary-600" />{T('কর্মকর্তার বার্তা', 'Messages from officers')}</h3>
            <div className="mt-2 space-y-2.5">
              {myAdvisories.length === 0 && <p className="text-[14px] text-muted">{T('এখনো কোনো বার্তা আসেনি। অনুরোধ পাঠালে উত্তর এখানেই দেখবেন।', 'No messages yet. Replies to your requests will appear here.')}</p>}
              {myAdvisories.map((a) => (
                <div key={a.id} className="rounded-xl bg-primary-50 p-3.5">
                  <div className="text-[12.5px] font-semibold text-primary-700">{a.upazila ? T('উপজেলা কৃষি অফিস থেকে', 'From the upazila agriculture office') : a.cluster ? T('আপনার এলাকার সবার জন্য পরামর্শ', 'Advice for everyone in your area') : T('আপনার অনুরোধের উত্তর', 'Reply to your request')}, {fmtDate(a.at, lang)}</div>
                  <div className="mt-1 whitespace-pre-line text-[15px] leading-7">{a.text}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h3 className="text-[15px] font-bold">{T('আমার পাঠানো অনুরোধ', 'Requests I have sent')}</h3>
            {myReqs.length === 0 ? <div className="mt-3"><EmptyState icon={Clock} title={T('কোনো অনুরোধ পাঠাননি', 'No requests yet')} text={T('সমস্যা হলে পাশের ফর্ম থেকে পাঠান।', 'Use the form to send one when you need help.')} /></div> : (
              <ul className="mt-2 divide-y divide-border">
                {myReqs.map((r) => {
                  const d = daysBetween(r.created, today);
                  return (
                    <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0"><div className="text-[15px] font-semibold">{L(SYMPTOMS[r.symptom])}</div><div className="truncate text-[13.5px] text-muted">{L(r.text)}</div><div className="text-[12.5px] text-muted">{d <= 0 ? T('আজ', 'Today') : T(`${num(d, 'bn')} দিন আগে`, `${d} days ago`)}</div></div>
                      <Badge tone={STATUS[r.status].tone}>{L(STATUS[r.status])}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export { STATUS as REQUEST_STATUS };
