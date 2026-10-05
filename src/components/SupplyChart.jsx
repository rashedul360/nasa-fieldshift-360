import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, Cell, CartesianGrid } from 'recharts';
import { weekStart, HIGH_FACTOR } from '../engine/glut.js';
import { fmtDate, num } from '../engine/dates.js';
import { useStore } from '../store.jsx';

// bins: Map(week -> tonnes); mine: Map(week -> tonnes) (optional, drawn in gold on top)
export default function SupplyChart({ bins, mine, normal, dip, highlight = [], height = 200, color = '#1b9872' }) {
  const { s, T } = useStore();
  const lang = s.lang;
  const weeks = [...bins.keys(), ...(mine ? [...mine.keys()] : [])];
  if (!weeks.length) return <div className="text-sm text-ink/50 p-4">{T('এই ফসলের কোনো পরিকল্পনা নেই', 'No plans for this crop')}</div>;
  const lo = Math.min(...weeks) - 1, hi = Math.max(...weeks) + 1;
  const data = [];
  for (let w = lo; w <= hi; w++) {
    data.push({ w, label: fmtDate(weekStart(w), lang), others: +(bins.get(w) || 0).toFixed(2), mine: mine ? +(mine.get(w) || 0).toFixed(2) : 0 });
  }
  const labelOf = (w) => fmtDate(weekStart(w), lang);
  const yMax = Math.max(...data.map((d) => d.others + d.mine), normal * HIGH_FACTOR) * 1.15;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef0ec" />
          {dip && <ReferenceArea x1={labelOf(Math.max(dip[0], lo))} x2={labelOf(Math.min(dip[1], hi))} fill="#c9932b" fillOpacity={0.12} />}
          <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#5d6a63' }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: '#cfd6d1' }} />
          <YAxis tick={{ fontSize: 10.5, fill: '#5d6a63' }} domain={[0, yMax]} tickFormatter={(v) => num(v, lang, { dp: 1 })} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v, n) => [`${num(v, lang, { dp: 1 })} ${T('টন', 't')}`, n === 'mine' ? T('আপনার জমি', 'Your plot') : T('ইউনিয়নের অন্যরা', 'Rest of union')]}
            labelFormatter={(l) => `${T('সপ্তাহ শুরু', 'Week of')} ${l}`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <ReferenceLine y={normal * HIGH_FACTOR} stroke="#b42318" strokeDasharray="5 4" label={{ value: T('অতিরিক্ত সরবরাহের সীমা', 'Oversupply line'), position: 'insideTopRight', fontSize: 10.5, fill: '#b42318' }} />
          <Bar dataKey="others" stackId="a" fill={color} radius={mine ? [0, 0, 0, 0] : [4, 4, 0, 0]}>
            {data.map((d) => <Cell key={d.w} fill={color} fillOpacity={highlight.length && !highlight.includes(d.w) ? 0.45 : 0.9} />)}
          </Bar>
          {mine && <Bar dataKey="mine" stackId="a" fill="#c9932b" radius={[4, 4, 0, 0]} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
