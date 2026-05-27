function EnergyLines() {
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <defs>

        {/* Red gradient for lines */}
        <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#cc0000" stopOpacity="0" />
          <stop offset="50%"  stopColor="#ff3333" stopOpacity="1" />
          <stop offset="100%" stopColor="#cc0000" stopOpacity="0" />
        </linearGradient>

        {/* Vertical gradient */}
        <linearGradient id="lineGlowV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#cc0000" stopOpacity="0" />
          <stop offset="50%"  stopColor="#ff3333" stopOpacity="1" />
          <stop offset="100%" stopColor="#cc0000" stopOpacity="0" />
        </linearGradient>

        {/* Traveling dot animation along lines */}
        <filter id="redGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

      </defs>

      {/* ── LEFT LINE — sidebar to orb ── */}
      <line x1="290" y1="220" x2="720" y2="140"
        stroke="url(#lineGlow)" strokeWidth="1.5" opacity="0.5" />

      {/* ── RIGHT LINE — right panel to orb ── */}
      <line x1="1060" y1="220" x2="820" y2="140"
        stroke="url(#lineGlow)" strokeWidth="1.5" opacity="0.5" />

      {/* ── VERTICAL LINE — orb down ── */}
      <line x1="760" y1="280" x2="760" y2="520"
        stroke="url(#lineGlowV)" strokeWidth="1.5" opacity="0.5" />

      {/* ── EXTRA CORNER LINES — adds depth ── */}
      <line x1="290" y1="400" x2="500" y2="300"
        stroke="url(#lineGlow)" strokeWidth="1" opacity="0.2" />
      <line x1="1060" y1="400" x2="900" y2="320"
        stroke="url(#lineGlow)" strokeWidth="1" opacity="0.2" />

      {/* ── NODE DOTS — junction points ── */}
      <circle cx="720" cy="140" r="4" fill="#ff2222" filter="url(#redGlow)" opacity="0.9">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
      </circle>

      <circle cx="820" cy="140" r="4" fill="#ff2222" filter="url(#redGlow)" opacity="0.9">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;5;3" dur="2.4s" repeatCount="indefinite" />
      </circle>

      <circle cx="760" cy="520" r="4" fill="#ff2222" filter="url(#redGlow)" opacity="0.9">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* ── TRAVELING DOT — left line ── */}
      <circle r="3" fill="#ff4444" filter="url(#redGlow)" opacity="0.9">
        <animateMotion dur="3s" repeatCount="indefinite">
          <mpath xlinkHref="#leftPath" />
        </animateMotion>
      </circle>
      <path id="leftPath" d="M290,220 L720,140" fill="none" />

      {/* ── TRAVELING DOT — right line ── */}
      <circle r="3" fill="#ff4444" filter="url(#redGlow)" opacity="0.9">
        <animateMotion dur="3.5s" repeatCount="indefinite">
          <mpath xlinkHref="#rightPath" />
        </animateMotion>
      </circle>
      <path id="rightPath" d="M1060,220 L820,140" fill="none" />

      {/* ── TRAVELING DOT — vertical line ── */}
      <circle r="3" fill="#ff4444" filter="url(#redGlow)" opacity="0.9">
        <animateMotion dur="2.5s" repeatCount="indefinite">
          <mpath xlinkHref="#vertPath" />
        </animateMotion>
      </circle>
      <path id="vertPath" d="M760,280 L760,520" fill="none" />

    </svg>
  );
}

export default EnergyLines;