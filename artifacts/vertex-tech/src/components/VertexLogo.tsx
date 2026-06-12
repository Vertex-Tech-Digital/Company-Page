export function VertexLogo({ size = 40 }: { size?: number }) {
  const id = "vt-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vertex Tech logo"
    >
      <defs>
        {/* hex background gradient */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f1e3c" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
        {/* stroke gradient blue→cyan */}
        <linearGradient id={id} x1="15" y1="20" x2="85" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38b2f8" />
          <stop offset="50%" stopColor="#4fa3f7" />
          <stop offset="100%" stopColor="#7b6cf6" />
        </linearGradient>
      </defs>

      {/* hexagon background */}
      <path
        d="M50 4 L92 27 L92 73 L50 96 L8 73 L8 27 Z"
        fill={`url(#${id}-bg)`}
        stroke="rgba(59,130,246,0.3)"
        strokeWidth="1.5"
      />

      {/* subtle inner hex bevel */}
      <path
        d="M50 10 L87 30.5 L87 69.5 L50 90 L13 69.5 L13 30.5 Z"
        fill="none"
        stroke="rgba(100,160,255,0.08)"
        strokeWidth="1"
      />

      {/* ── V ── */}
      {/* left arm of V: top-left corner → center bottom */}
      <polyline
        points="22,25 44,68"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* right arm of V: center bottom → upper-mid */}
      <polyline
        points="44,68 56,42"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── T ── (overlapping the V) */}
      {/* horizontal bar of T */}
      <line
        x1="53" y1="27" x2="80" y2="27"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* vertical stem of T */}
      <line
        x1="68" y1="27" x2="68" y2="68"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* ── circuit nodes (dots at endpoints) ── */}
      {/* V top-left */}
      <circle cx="22" cy="25" r="4" fill="#38b2f8" />
      <circle cx="22" cy="25" r="6.5" fill="none" stroke="#38b2f8" strokeWidth="1.2" opacity="0.5" />

      {/* V bottom apex */}
      <circle cx="44" cy="68" r="4" fill="#5ba0f5" />
      <circle cx="44" cy="68" r="6.5" fill="none" stroke="#5ba0f5" strokeWidth="1.2" opacity="0.5" />

      {/* T top-right end */}
      <circle cx="80" cy="27" r="4" fill="#7b6cf6" />
      <circle cx="80" cy="27" r="6.5" fill="none" stroke="#7b6cf6" strokeWidth="1.2" opacity="0.5" />

      {/* T bottom */}
      <circle cx="68" cy="68" r="4" fill="#6580f0" />
      <circle cx="68" cy="68" r="6.5" fill="none" stroke="#6580f0" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}
