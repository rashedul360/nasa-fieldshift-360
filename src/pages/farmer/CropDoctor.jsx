import { useRef, useState } from 'react';
import { Camera, ImagePlus, ScanLine, ShieldAlert, CheckCircle2, Send, Sparkles, X } from 'lucide-react';
import { useStore } from '../../store';
import { PageHeader, Card, Button, Tags, Note, Badge } from '../../components/ui';
import { DISEASES } from '../../data/demo';
import { num } from '../../engine/dates';
import { bnOf } from '../../engine/text';

const THRESHOLD = 0.7;
const SAMPLE = {
  tomato: [{ k: 'early_blight', p: 0.61 }, { k: 'septoria', p: 0.21 }, { k: 'unclear', p: 0.18 }],
  mustard: [{ k: 'alternaria', p: 0.57 }, { k: 'nutrient', p: 0.24 }, { k: 'unclear', p: 0.19 }],
};
const FIRST_STEPS = {
  early_blight: [{ bn: 'দাগওয়ালা নিচের পাতাগুলো ছিঁড়ে মাটিতে পুঁতে ফেলুন', en: 'Pick off the spotted lower leaves and bury them' }, { bn: 'গাছের গোড়ায় পানি দিন, পাতা ভেজাবেন না', en: 'Water at the base and keep the leaves dry' }, { bn: 'দুই দিন পর আবার ছবি তুলে দেখুন দাগ বাড়ছে কিনা', en: 'Take another photo in two days to see if it spreads' }],
  alternaria: [{ bn: 'দাগওয়ালা পাতা সরিয়ে ফেলুন', en: 'Remove the spotted leaves' }, { bn: 'গাছ ঘন হলে একটু পাতলা করে দিন, বাতাস চলুক', en: 'Thin crowded plants so air can move' }, { bn: 'দুই দিন পর আবার ছবি তুলুন', en: 'Take another photo in two days' }],
  default: [{ bn: 'পাতার ওপর আর নিচ দুই দিকের পরিষ্কার ছবি তুলুন', en: 'Photograph both sides of the leaf clearly' }, { bn: 'জমিতে পানি জমে আছে কিনা দেখুন', en: 'Check for standing water' }, { bn: 'বুঝতে না পারলে কৃষি কর্মকর্তাকে পাঠান', en: 'If unsure, send it to your officer' }],
};

export default function CropDoctor() {
  const { s, dispatch, T, L, toast, farmer, chosen, today } = useStore();
  const lang = s.lang;
  const [img, setImg] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const fileRef = useRef();
  const camRef = useRef();
  const reqId = `CD-${farmer.id}`;
  const sent = s.requests.find((r) => r.id === reqId);
  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr({ bn: 'শুধু ছবি দেওয়া যাবে (jpg, png)।', en: 'Please choose a photo (jpg or png).' }); return; }
    if (f.size > 12 * 1024 * 1024) { setErr({ bn: 'ছবিটা খুব বড় (১২ মেগাবাইটের বেশি)। ছোট ছবি দিন।', en: 'That photo is too large (over 12 MB). Try a smaller one.' }); return; }
    setErr(null);
    const reader = new FileReader();
    reader.onload = () => { setImg(reader.result); setRes(null); };
    reader.readAsDataURL(f);
  };
  const analyse = () => setRes({ top: SAMPLE[chosen.crop.id] ?? [{ k: 'unclear', p: 0.48 }, { k: 'nutrient', p: 0.31 }, { k: 'pest', p: 0.21 }] });
  const send = () => {
    dispatch({ type: 'addRequest', req: {
      id: reqId, farmerId: farmer.id, union: farmer.union, village: farmer.village, villageBn: farmer.villageBn, lat: farmer.lat, lon: farmer.lon,
      crop: chosen.crop.id, symptom: 'leaf_spot', type: 'crop_doctor', text: { bn: 'পাতায় দাগ দেখছি, ছবি পাঠালাম। ফলাফল নিশ্চিত না।', en: 'I am seeing spots on the leaves and sent a photo. The result was not certain.' },
      ai: res.top, image: img, created: today, status: 'open', priority: 'Medium', mine: true } });
    toast('ছবি কৃষি কর্মকর্তার কাছে পাঠানো হয়েছে', 'Photo sent to your officer');
  };
  const low = res && res.top[0].p < THRESHOLD;
  const steps = res ? (FIRST_STEPS[res.top[0].k] ?? FIRST_STEPS.default) : [];
  return (
    <div>
      <PageHeader eyebrow={T('ফসলের ডাক্তার', 'Crop doctor')} title={T('পাতার ছবি দেখে প্রাথমিক ধারণা', 'A first look from a leaf photo')}
        subtitle={T('এটা নিশ্চিত রোগ নির্ণয় নয়। সন্দেহ থাকলে ছবিটা কৃষি কর্মকর্তার কাছে পাঠিয়ে দিন — সেটাই আসল কাজ।', 'This is not a diagnosis. If you are unsure, send the photo to your officer — that is the important part.')}
        tags={['DEMO']} />
      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5 sm:p-6">
          <div className="grid min-h-72 place-items-center rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/60 p-6 text-center">
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            {img ? (
              <div className="w-full">
                <img src={img} alt={T('আপনার তোলা পাতার ছবি', 'Your leaf photo')} className="mx-auto max-h-64 rounded-xl object-contain" />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {!res && <Button onClick={analyse}><ScanLine size={17} />{T('ছবিটা দেখুন', 'Check this photo')}</Button>}
                  <Button variant="secondary" onClick={() => { setImg(null); setRes(null); }}><X size={16} />{T('ছবি বাদ দিন', 'Remove photo')}</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-primary-700 shadow-sm"><Camera size={30} /></div>
                <h2 className="mt-4 text-[21px] font-bold">{T(`${bnOf(chosen.crop.name.bn)} পাতার পরিষ্কার একটা ছবি দিন`, `Add a clear photo of a ${chosen.crop.name.en.toLowerCase()} leaf`)}</h2>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-7 text-muted">{T('দিনের আলোয়, কাছ থেকে। দাগ থাকলে দাগটা যেন ছবিতে স্পষ্ট বোঝা যায়।', 'In daylight, up close, with any spots clearly visible.')}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => camRef.current?.click()}><Camera size={17} />{T('ছবি তুলুন', 'Take a photo')}</Button>
                  <Button variant="secondary" onClick={() => fileRef.current?.click()}><ImagePlus size={17} />{T('গ্যালারি থেকে দিন', 'Choose from gallery')}</Button>
                </div>
                <button type="button" onClick={analyse} className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-primary-700 hover:underline"><Sparkles size={15} />{T('নমুনা ছবি দিয়ে দেখুন', 'Try it with a sample')}</button>
              </div>
            )}
          </div>
          {err && <Note tone="warn" className="mt-3">{L(err)}</Note>}
          <p className="mt-3 text-[13px] leading-5 text-muted">{T('এই সংস্করণে আসল AI মডেল যুক্ত নেই, তাই ফলাফল নমুনা। মডেল যুক্ত করার নিয়ম README ফাইলে আছে।', 'No trained model is connected in this version, so the result is a sample. The README explains how to add one.')}</p>
        </Card>

        <Card className="p-5 sm:p-6">
          {!res ? (
            <div className="grid h-full min-h-72 place-items-center text-center">
              <div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700"><ScanLine size={26} /></div><div className="mt-3 text-[17px] font-bold">{T('ফলাফল এখানে আসবে', 'The result will show here')}</div><p className="mt-1 text-[14.5px] text-muted">{T('কী কী হতে পারে, কতটা নিশ্চিত, আর এখনই কী করবেন।', 'What it might be, how sure we are, and what to do now.')}</p></div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[14px] font-semibold text-violet-700">{T('নমুনা ফলাফল', 'Sample result')}</p><h2 className="mt-0.5 text-[22px] font-bold">{L(DISEASES[res.top[0].k])}</h2></div>
                <Tags list={['DEMO']} />
              </div>
              <div className="mt-4 space-y-3">
                {res.top.map((t, i) => (
                  <div key={t.k}>
                    <div className="flex justify-between gap-3 text-[14.5px]"><span className={i === 0 ? 'font-semibold' : 'text-muted'}>{L(DISEASES[t.k])}</span><b className="tabular">{num(t.p * 100, lang)}%</b></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/[.06]"><div className={`h-full rounded-full ${i === 0 ? 'bg-violet-600' : 'bg-violet-300'}`} style={{ width: `${t.p * 100}%` }} /></div>
                  </div>
                ))}
              </div>
              {low ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 font-bold text-amber-900"><ShieldAlert size={18} />{T('নিশ্চিত হওয়া যাচ্ছে না', 'We cannot be sure')}</div>
                  <p className="mt-1.5 text-[14px] leading-6 text-amber-900/85">{T('সম্ভাবনা ৭০ শতাংশের কম, তাই এটাকে নিশ্চিত রোগ ধরবেন না। নিচের বোতাম চেপে ছবিটা কৃষি কর্মকর্তার কাছে পাঠান।', 'The top match is under 70%, so do not treat it as certain. Use the button below to send the photo to your officer.')}</p>
                </div>
              ) : <Note tone="ok" className="mt-5">{T('মোটামুটি নিশ্চিত, তবুও কোনো ওষুধ দেওয়ার আগে কৃষি কর্মকর্তার পরামর্শ নিন।', 'Fairly sure, but ask your officer before using any chemical.')}</Note>}
              <h3 className="mt-5 text-[16px] font-bold">{T('এখনই যা করতে পারেন (ওষুধ ছাড়া)', 'What you can do now, without chemicals')}</h3>
              <ul className="mt-2 space-y-2 text-[14.5px] leading-6">{steps.map((x, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={17} className="mt-1 shrink-0 text-primary-600" />{L(x)}</li>)}</ul>
              <Button disabled={!!sent} onClick={send} className="mt-6 w-full py-3"><Send size={16} />{sent ? T('কৃষি কর্মকর্তার কাছে পাঠানো হয়েছে', 'Sent to your officer') : T('কৃষি কর্মকর্তাকে পাঠান', 'Send to my officer')}</Button>
              <p className="mt-2 text-center text-[13px] text-muted">{T('ছবির সঙ্গে আপনার জমির জায়গা আর এই ফলাফলও যাবে।', 'Your field’s location and this result go with the photo.')}</p>
              {sent && <div className="mt-2 text-center"><Badge tone={sent.status === 'open' ? 'amber' : 'green'}>{sent.status === 'open' ? T('উত্তরের অপেক্ষায়', 'Waiting for a reply') : T('উত্তর এসেছে, সাহায্য পাতায় দেখুন', 'Answered — see the Help page')}</Badge></div>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
