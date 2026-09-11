const PINS = [
  { id: "p1", top: "28%", left: "18%", delay: "0s" },
  { id: "p2", top: "42%", left: "62%", delay: "0.4s" },
  { id: "p3", top: "64%", left: "36%", delay: "0.8s" },
  { id: "p4", top: "22%", left: "78%", delay: "1.1s" },
];

export default function GarageMapVisual() {
  return (
    <div className="hero-map absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full scale-[1.12]"
        viewBox="0 0 500 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <rect width="500" height="400" fill="#E8EEF6" />
        <path d="M0 78h500M0 168h500M0 248h500M0 328h500" stroke="#F5F7FB" strokeWidth="18" />
        <path d="M72 0v400M168 0v400M268 0v400M372 0v400" stroke="#F5F7FB" strokeWidth="16" />
        <rect x="88" y="94" width="64" height="58" rx="8" fill="#fff" fillOpacity="0.72" />
        <rect x="184" y="94" width="68" height="58" rx="8" fill="#fff" fillOpacity="0.58" />
        <rect x="284" y="94" width="72" height="58" rx="8" fill="#fff" fillOpacity="0.7" />
        <rect x="88" y="184" width="64" height="48" rx="8" fill="#fff" fillOpacity="0.62" />
        <rect x="184" y="184" width="68" height="48" rx="8" fill="#D7E4F7" />
        <rect x="284" y="184" width="72" height="48" rx="8" fill="#fff" fillOpacity="0.66" />
        <rect x="88" y="264" width="64" height="48" rx="8" fill="#fff" fillOpacity="0.7" />
        <rect x="184" y="264" width="68" height="48" rx="8" fill="#fff" fillOpacity="0.52" />
        <rect x="284" y="264" width="72" height="48" rx="8" fill="#fff" fillOpacity="0.68" />
        <rect x="388" y="94" width="48" height="218" rx="10" fill="#C5D6EE" fillOpacity="0.55" />
        <path
          d="M90 112 C170 148 250 176 310 204"
          stroke="#2563EB"
          strokeWidth="2"
          strokeDasharray="6 8"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>

      {PINS.map((pin) => (
        <div
          key={pin.id}
          className="hero-pin absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ top: pin.top, left: pin.left }}
        >
          <span
            className="garage-map-pin-ring absolute top-[18px] left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-brand-blue/35"
            style={{ animationDelay: pin.delay }}
          />
          <span className="relative block h-7 w-5">
            <span className="absolute top-0 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-brand-blue shadow-md" />
            <span className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-brand-blue" />
          </span>
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,247,251,0.82)_0%,rgba(245,247,251,0.28)_42%,rgba(245,247,251,0.72)_100%)]" />
    </div>
  );
}
