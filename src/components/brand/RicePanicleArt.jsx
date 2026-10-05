export default function RicePanicleArt({ className = "" }) {
  const grains = [
    [36, 25, -25],[52, 36, -12],[26, 43, -30],[61, 53, -8],[34, 61, -24],[68, 70, -6],
    [40, 80, -18],[72, 88, -4],[46, 98, -16],[74, 106, 0],[51, 117, -12],[70, 127, 8]
  ];
  return (
    <svg viewBox="0 0 120 180" className={className} aria-hidden="true">
      <path d="M27 168C45 124 57 83 57 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M59 58c20 21 34 42 39 69M55 86c-12 20-20 39-22 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".75" />
      {grains.map(([x,y,r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="5" ry="9" transform={`rotate(${r} ${x} ${y})`} fill="currentColor" opacity={i < 4 ? .9 : .72} />
      ))}
      <path d="M56 33c-13 9-22 18-29 30M57 48c13 6 26 16 34 28M53 74c-13 8-24 20-30 32M55 95c16 7 29 18 38 31" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".65" />
    </svg>
  );
}
