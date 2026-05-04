/* global React */
const { useState } = React;

/* ============================================================
   Shared helpers
   ============================================================ */
const C = {
  ink: '#1A1714',
  paper: '#FAF7F2',
  paperDeep: '#F2ECE2',
  rule: '#E6DFD2',
  accent: 'oklch(64% 0.17 35)',     // warm terracotta
  accentDeep: 'oklch(52% 0.17 35)',
  sage: 'oklch(64% 0.13 155)',
  ink2: '#3A332D',
  muted: '#8A8175',
};

/* ============================================================
   1. Receipt Fold — a receipt that "shares" by folding into halves
   ============================================================ */
function MarkReceiptFold({ size = 96, mono = false }) {
  const ink = mono ? C.ink : C.ink;
  const a = mono ? C.ink : C.accent;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {/* receipt body */}
      <path
        d="M22 10 L22 78 L28 74 L34 78 L40 74 L46 78 L52 74 L58 78 L64 74 L70 78 L70 10 Z"
        fill={C.paper}
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* fold/divider line — the "share" cut */}
      <path
        d="M46 6 L46 82"
        stroke={a}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
      {/* lines on receipt */}
      <path d="M28 24 L40 24 M52 24 L64 24" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M28 34 L42 34 M52 34 L62 34" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M28 44 L38 44 M52 44 L64 44" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      {/* total */}
      <path d="M28 58 L42 58 M52 58 L64 58" stroke={a} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ============================================================
   2. Split Plate — a circle divided, half plate / half pie chart
   ============================================================ */
function MarkSplitPlate({ size = 96, mono = false }) {
  const a = mono ? C.ink : C.accent;
  const b = mono ? '#fff' : C.paper;
  const ink = C.ink;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {/* plate base */}
      <circle cx="48" cy="48" r="36" fill={b} stroke={ink} strokeWidth="3" />
      {/* filled wedge — one person's share */}
      <path
        d="M48 48 L48 12 A36 36 0 0 1 84 48 Z"
        fill={a}
      />
      {/* dividing rule */}
      <path d="M48 12 L48 84" stroke={ink} strokeWidth="3" />
      <path d="M12 48 L84 48" stroke={ink} strokeWidth="3" />
      {/* inner ring (rim) */}
      <circle cx="48" cy="48" r="28" fill="none" stroke={ink} strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

/* ============================================================
   3. ƒ§ Ligature — typographic mark
   ============================================================ */
function MarkLigature({ size = 96, mono = false }) {
  const a = mono ? C.ink : C.accent;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <rect x="6" y="6" width="84" height="84" rx="20" fill={a} />
      <text
        x="48"
        y="68"
        textAnchor="middle"
        fontFamily="'Instrument Serif', Georgia, serif"
        fontSize="64"
        fontStyle="italic"
        fill={C.paper}
        fontWeight="400"
      >
        ƒ/s
      </text>
    </svg>
  );
}

/* ============================================================
   4. QR Receipt — pixel grid with a torn receipt edge
   ============================================================ */
function MarkQRReceipt({ size = 96, mono = false }) {
  const a = mono ? C.ink : C.accent;
  const ink = C.ink;
  // 7x7 QR-ish pattern
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,2,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {/* receipt backing */}
      <path
        d="M14 8 L82 8 L82 76 L76 80 L70 76 L64 80 L58 76 L52 80 L46 76 L40 80 L34 76 L28 80 L22 76 L14 80 Z"
        fill={C.paper}
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* QR-ish finder pattern, top-left */}
      {pattern.map((row, y) =>
        row.map((v, x) => {
          if (v === 0) return null;
          const fill = v === 2 ? a : ink;
          return (
            <rect
              key={`${x}-${y}`}
              x={22 + x * 6}
              y={16 + y * 6}
              width="6"
              height="6"
              fill={fill}
            />
          );
        })
      )}
      {/* a couple stray pixels */}
      <rect x="70" y="22" width="6" height="6" fill={ink} />
      <rect x="64" y="34" width="6" height="6" fill={a} />
      <rect x="70" y="46" width="6" height="6" fill={ink} />
      <rect x="64" y="58" width="6" height="6" fill={ink} />
      <rect x="22" y="64" width="6" height="6" fill={ink} />
      <rect x="34" y="64" width="6" height="6" fill={a} />
      <rect x="46" y="64" width="6" height="6" fill={ink} />
    </svg>
  );
}

/* ============================================================
   5. Equal Share — proportional bars/stack
   ============================================================ */
function MarkEqualShare({ size = 96, mono = false }) {
  const a = mono ? C.ink : C.accent;
  const sage = mono ? C.ink : C.sage;
  const ink = C.ink;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {/* four stacked bars representing items split among guests */}
      <rect x="14" y="20" width="68" height="10" rx="3" fill={ink} />
      <rect x="14" y="20" width="44" height="10" rx="3" fill={a} />

      <rect x="14" y="34" width="68" height="10" rx="3" fill={ink} />
      <rect x="14" y="34" width="20" height="10" rx="3" fill={sage} />

      <rect x="14" y="48" width="68" height="10" rx="3" fill={ink} />
      <rect x="14" y="48" width="56" height="10" rx="3" fill={a} />

      {/* divider line + total */}
      <path d="M14 68 L82 68" stroke={ink} strokeWidth="2" strokeDasharray="2 3" />
      <rect x="14" y="74" width="68" height="10" rx="3" fill={ink} />
    </svg>
  );
}

/* ============================================================
   6. Slash Wordmark — the slash IS the mark
   ============================================================ */
function MarkSlash({ size = 96, mono = false }) {
  const a = mono ? C.ink : C.accent;
  const ink = C.ink;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="42" fill="none" stroke={ink} strokeWidth="3" />
      {/* big slash */}
      <path d="M30 76 L66 20" stroke={a} strokeWidth="10" strokeLinecap="round" />
      {/* F */}
      <path d="M22 32 L34 32 M22 32 L22 50 M22 40 L31 40" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      {/* S */}
      <path
        d="M74 50 Q62 50 62 56 Q62 62 70 62 Q78 62 78 68 Q78 74 66 74"
        stroke={ink}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   Wordmarks
   ============================================================ */
function WordmarkSans({ size = 28, color = C.ink }) {
  return (
    <span
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.02em',
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      Fare<span style={{ fontWeight: 400, opacity: 0.55 }}> </span>Share
    </span>
  );
}

function WordmarkSerif({ size = 32, color = C.ink }) {
  return (
    <span
      style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontWeight: 400,
        fontSize: size,
        fontStyle: 'italic',
        letterSpacing: '-0.01em',
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      Fare Share
    </span>
  );
}

function WordmarkSlash({ size = 28, color = C.ink, accent = C.accent }) {
  return (
    <span
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.02em',
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      Fare<span style={{ color: accent, fontWeight: 500, margin: '0 0.1em' }}>/</span>Share
    </span>
  );
}

function WordmarkMono({ size = 22, color = C.ink }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '-0.04em',
        color,
        lineHeight: 1,
        textTransform: 'lowercase',
        whiteSpace: 'nowrap',
      }}
    >
      fare_share
    </span>
  );
}

/* ============================================================
   Lockup wrapper — mark + wordmark, side by side
   ============================================================ */
function Lockup({ children, wordmark = 'sans', size = 64, color = C.ink, accent = C.accent }) {
  let W;
  if (wordmark === 'serif') W = <WordmarkSerif size={size * 0.55} color={color} />;
  else if (wordmark === 'slash') W = <WordmarkSlash size={size * 0.42} color={color} accent={accent} />;
  else if (wordmark === 'mono') W = <WordmarkMono size={size * 0.34} color={color} />;
  else W = <WordmarkSans size={size * 0.42} color={color} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.22 }}>
      {children}
      {W}
    </div>
  );
}

/* ============================================================
   Concept Card — title, primary lockup, three contexts
   ============================================================ */
function ConceptCard({ index, title, blurb, Mark, wordmark = 'sans', accent = C.accent }) {
  return (
    <div
      style={{
        width: 920,
        background: C.paper,
        border: `1px solid ${C.rule}`,
        borderRadius: 4,
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${C.rule}`, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.muted, letterSpacing: '0.08em' }}>
            0{index} / 06
          </span>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: C.ink }}>{title}</h3>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Concept
        </span>
      </div>

      {/* hero lockup */}
      <div
        style={{
          background: C.paperDeep,
          padding: '64px 48px',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 220,
        }}
      >
        <Lockup wordmark={wordmark} size={120} accent={accent}>
          <Mark size={120} />
        </Lockup>
      </div>

      {/* contexts row: app icon, monochrome lockup, business card / pill */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* App icon */}
        <ContextTile label="App icon">
          <div
            style={{
              width: 124,
              height: 124,
              borderRadius: 28,
              background: '#fff',
              boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(20,15,10,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Mark size={92} />
          </div>
        </ContextTile>

        {/* Monochrome */}
        <ContextTile label="Monochrome">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 124 }}>
            <Lockup wordmark={wordmark} size={64} color={C.ink} accent={C.ink}>
              <Mark size={64} mono />
            </Lockup>
          </div>
        </ContextTile>

        {/* Reverse / dark */}
        <ContextTile label="Reverse">
          <div
            style={{
              background: C.ink,
              borderRadius: 2,
              height: 124,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lockup wordmark={wordmark} size={64} color={C.paper} accent={accent}>
              <Mark size={64} />
            </Lockup>
          </div>
        </ContextTile>
      </div>

      {/* footer note */}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: C.ink2, maxWidth: 720 }}>
        {blurb}
      </p>
    </div>
  );
}

function ContextTile({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          background: C.paperDeep,
          borderRadius: 2,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: C.muted,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* expose */
Object.assign(window, {
  MarkReceiptFold,
  MarkSplitPlate,
  MarkLigature,
  MarkQRReceipt,
  MarkEqualShare,
  MarkSlash,
  ConceptCard,
  Lockup,
  WordmarkSans,
  WordmarkSerif,
  WordmarkSlash,
  WordmarkMono,
  C,
});
