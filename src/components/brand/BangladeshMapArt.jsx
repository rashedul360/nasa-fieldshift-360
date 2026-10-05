export default function BangladeshMapArt({ className = "", pin = true }) {
  return (
    <svg viewBox="0 0 320 420" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bdFillFS" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bfe8d8" />
          <stop offset="100%" stopColor="#dff3eb" />
        </linearGradient>
      </defs>
      <path
        d="M153 17c18 8 24 24 30 39 6 15 13 28 27 36 17 10 19 27 10 43-8 14-5 27 5 39 12 15 12 29-2 43-9 9-8 21 1 31 11 13 14 27 4 41-9 13-11 26-2 39 10 15 7 32-6 43-12 10-21 25-18 41 3 17-8 31-24 32-14 1-24-8-28-21-5-15-15-25-29-30-17-6-24-22-16-36 7-12 3-23-8-32-14-11-18-26-8-41 8-13 7-27-4-39-12-13-11-30 3-42 12-10 17-25 9-39-9-16-3-33 13-42 13-7 22-19 24-34 2-17 12-30 27-34 12-3 21 2 27 11z"
        fill="url(#bdFillFS)"
        stroke="#8acfb3"
        strokeWidth="3"
      />
      {pin && <>
        {/* approximate position of Rajshahi / Godagari in the north-west */}
        <circle cx="112" cy="132" r="7" fill="#c9932b" opacity=".9" />
        <circle cx="112" cy="132" r="17" fill="none" stroke="#e9c46a" strokeWidth="2" opacity=".75" />
      </>}
      <path d="M58 86c36 15 56 13 85 3M75 122c30 12 47 9 72 1M89 286c36-10 62-5 91 9" fill="none" stroke="#ffffff" strokeWidth="3" opacity=".55" strokeLinecap="round" />
    </svg>
  );
}
