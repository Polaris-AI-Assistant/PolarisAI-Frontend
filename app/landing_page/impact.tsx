'use client'
import { useEffect, useState, useRef, useCallback } from "react";
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

// ─── EASING ───────────────────────────────────────────────────────────────────
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }

// ─── CIRCULAR GAUGE ──────────────────────────────────────────────────────────
function CircularGauge({ value = 68, duration = 2300, size = 240, triggered = false }: {
  value?: number; duration?: number; size?: number; triggered?: boolean;
}) {
  const [animVal, setAnimVal] = useState(0);
  const raf = useRef<number | null>(null);
  const t0 = useRef<number | null>(null);

  const STICKS = 80;
  const GAP = 30;
  const START = -90 + GAP / 2;
  const SWEEP = 360 - GAP;
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 4;
  const stickLen = size * 0.12;
  const innerR = outerR - stickLen;
  const sw = size * 0.016;

  useEffect(() => {
    if (!triggered) return;
    t0.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    const go = (ts: number) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      const e = easeOutCubic(p);
      setAnimVal(e * value);
      if (p < 1) raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration, triggered]);

  const filled = (animVal / 100) * STICKS;

  function stickColor(i: number): string {
    const t = i / STICKS;
    const stops: [number, [number, number, number]][] = [
      [0.00, [0, 230, 255]],
      [0.20, [0, 180, 255]],
      [0.45, [0, 100, 220]],
      [0.65, [10, 60, 180]],
      [0.80, [20, 90, 210]],
      [1.00, [0, 200, 255]],
    ];
    for (let j = 0; j < stops.length - 1; j++) {
      const [t0c, c0] = stops[j], [t1, c1] = stops[j + 1];
      if (t >= t0c && t <= t1) {
        const f = (t - t0c) / (t1 - t0c);
        return `rgb(${Math.round(c0[0] + f * (c1[0] - c0[0]))},${Math.round(c0[1] + f * (c1[1] - c0[1]))},${Math.round(c0[2] + f * (c1[2] - c0[2]))})`;
      }
    }
    return "rgb(0,220,255)";
  }

  const leadIdx = Math.min(Math.floor(filled), STICKS - 1);
  const leadFrac = leadIdx / (STICKS - 1);
  const leadDeg = START + leadFrac * SWEEP;
  const leadRad = (leadDeg * Math.PI) / 180;
  const dotR = outerR - stickLen * 0.45;
  const dotX = cx + dotR * Math.cos(leadRad);
  const dotY = cy + dotR * Math.sin(leadRad);

  const sticks = Array.from({ length: STICKS }, (_, i) => {
    const frac = i / (STICKS - 1);
    const deg = START + frac * SWEEP;
    const rad = (deg * Math.PI) / 180;
    const midR = (outerR + innerR) / 2;
    return {
      i, deg,
      x: cx + midR * Math.cos(rad),
      y: cy + midR * Math.sin(rad),
      rot: deg + 90,
      filled: i < filled,
      leading: i === Math.floor(filled) - 1 || i === Math.floor(filled),
    };
  });

  const numSize = size * 0.21;
  const lblSize = size * 0.068;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ userSelect: "none", overflow: "visible" }}>
      <defs>
        <filter id="cg-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="cg-dot" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {sticks.map(({ i, x, y, rot, filled: f, leading }) => (
        <rect
          key={i}
          x={x - sw / 2} y={y - stickLen / 2}
          width={sw} height={stickLen}
          rx={sw / 2} ry={sw / 2}
          transform={`rotate(${rot},${x},${y})`}
          fill={f ? stickColor(i) : "#0d1a24"}
          opacity={f ? 1 : 0.5}
          filter={leading && f ? "url(#cg-glow)" : undefined}
        />
      ))}

      {filled > 0 && (
        <>
          <circle cx={dotX} cy={dotY} r={size * 0.038} fill="rgba(0,220,255,0.25)" filter="url(#cg-dot)" />
          <circle cx={dotX} cy={dotY} r={size * 0.018} fill="white" filter="url(#cg-dot)" />
        </>
      )}

      <text x={cx} y={cy - numSize * 0.08} textAnchor="middle" dominantBaseline="middle"
        fontSize={numSize} fontWeight="700" fill="white" letterSpacing="-0.03em"
        fontFamily="'SF Pro Display','Helvetica Neue',Arial,sans-serif">
        {Math.round(animVal)}%
      </text>
      <text x={cx} y={cy + numSize * 0.58} textAnchor="middle" dominantBaseline="middle"
        fontSize={lblSize} fontWeight="400" fill="rgba(255,255,255,0.42)"
        fontFamily="'SF Pro Display','Helvetica Neue',Arial,sans-serif">
        time saved
      </text>
    </svg>
  );
}

// ─── APP ICONS ────────────────────────────────────────────────────────────────
function GmailIcon({ size = 38 }: { size?: number }) {
  return (
    <img src="/gmail.png" alt="Gmail" width={size} height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
  );
}
function CalendarIcon({ size = 38 }: { size?: number }) {
  return (
    <img src="/Google_Calendar_icon_(2020).svg.png" alt="Calendar" width={size} height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
  );
}
function DocsIcon({ size = 38 }: { size?: number }) {
  return (
    <img src="/Google_Docs_logo_(2014-2020).svg.png" alt="Docs" width={size} height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
  );
}
function GitHubIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="white" />
      <path fill="#24292e" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

// ─── WORKFLOW BAR CHART ───────────────────────────────────────────────────────
function WorkflowDashBars({ rawProgress }: { rawProgress: number }) {
  const cols = [
    { name: 'Gmail',    icon: <GmailIcon size={28} />,    value: 86, gradient: ['#1082d0', '#0b2a6d'], delay: 0.00 },
    { name: 'Calendar', icon: <CalendarIcon size={28} />, value: 64, gradient: ['#1898cc', '#0b3f84'], delay: 0.07 },
    { name: 'Docs',     icon: <DocsIcon size={28} />,     value: 42, gradient: ['#177fbe', '#0c487e'], delay: 0.14 },
    { name: 'GitHub',   icon: <GitHubIcon size={38} />,   value: 22, gradient: ['#1bc8b4', '#0a7d77'], delay: 0.21 },
  ];

  const MAX_BAR_HEIGHT = 155;
  const ICON_AREA = 54;
  const maxVal = 86;

  return (
    <div style={{ width: '100%', flex: 1, position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 8,
        height: MAX_BAR_HEIGHT + ICON_AREA,
      }}>
        {cols.map((c) => {
          // Staggered: each bar starts after its delay offset
          const p = Math.max(0, Math.min(1, (rawProgress - c.delay) / (1 - c.delay)));
          const ep = easeOutCubic(p);
          const barH = (c.value / maxVal) * MAX_BAR_HEIGHT * ep;
          const displayVal = Math.round(c.value * ep);

          return (
            <div key={c.name} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                fontSize: 15,
                marginBottom: 8,
                fontFamily: "'SF Pro Display','Helvetica Neue',Arial,sans-serif",
                letterSpacing: '-0.02em',
                minHeight: 20,
              }}>
                {p > 0 ? displayVal : ''}
              </div>
              <div style={{
                width: '50%',
                height: barH,
                borderRadius: '6px 6px 4px 4px',
                background: `linear-gradient(180deg, ${c.gradient[0]} 0%, ${c.gradient[1]} 100%)`,
                boxShadow: `0 3px 16px ${c.gradient[1]}44`,
                transition: 'none',
                minHeight: p > 0 ? 4 : 0,
              }} />
              <div style={{ height: ICON_AREA, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10, gap: 5 }}>
                {c.icon}
                <span style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: "'SF Pro Display','Helvetica Neue',Arial,sans-serif",
                }}>
                  {c.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        bottom: ICON_AREA,
        height: '1.5px',
        background: '#3a4a56',
      }} />
    </div>
  );
}

// ─── GROWTH CHART ─────────────────────────────────────────────────────────────
function GrowthChart({ rawProgress }: { rawProgress: number }) {
  const W = 330, H = 200;
  const pad = { l: 40, r: 20, t: 20, b: 36 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const dataPoints: [number, number][] = [
    [0.00, 1.0], [0.12, 1.1], [0.25, 1.8], [0.38, 2.1],
    [0.52, 2.8], [0.65, 3.1], [0.78, 3.8], [0.90, 4.1], [1.00, 4.3],
  ];

  const yMin = 0, yMax = 5;
  const toSVG = ([xf, yv]: [number, number]): [number, number] => [
    pad.l + xf * iW,
    pad.t + iH - ((yv - yMin) / (yMax - yMin)) * iH,
  ];

  // Use rawProgress directly so line draws left-to-right in sync with real time
  const cutX = pad.l + rawProgress * iW;
  const visPts: [number, number][] = [];
  for (let i = 0; i < dataPoints.length; i++) {
    const sv = toSVG(dataPoints[i]);
    if (sv[0] <= cutX) {
      visPts.push(sv);
    } else {
      if (i > 0) {
        const prev = toSVG(dataPoints[i - 1]);
        const t = (cutX - prev[0]) / (sv[0] - prev[0]);
        visPts.push([cutX, prev[1] + t * (sv[1] - prev[1])]);
      }
      break;
    }
  }
  if (visPts.length === 0 && rawProgress > 0) visPts.push(toSVG(dataPoints[0]));

  const pathD = (points: [number, number][]): string => {
    if (points.length < 2) return "";
    let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1], c = points[i];
      const cpx = (p[0] + c[0]) / 2;
      d += ` C ${cpx.toFixed(2)} ${p[1].toFixed(2)}, ${cpx.toFixed(2)} ${c[1].toFixed(2)}, ${c[0].toFixed(2)} ${c[1].toFixed(2)}`;
    }
    return d;
  };

  const line = pathD(visPts);
  const last = visPts[visPts.length - 1];
  const bottomY = pad.t + iH;
  const area = last
    ? `${line} L ${last[0].toFixed(2)} ${bottomY.toFixed(2)} L ${pad.l} ${bottomY.toFixed(2)} Z`
    : "";

  const yLabels = [0, 1, 2, 3, 4, 5];
  const xLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];

  const milestones: { xf: number; yv: number; label: string; dx: number; dy: number; anchor: string }[] = [
    { xf: 0.00, yv: 1.0, label: "",                  dx: 10,  dy: 0,   anchor: "start" },
    { xf: 0.33, yv: 1.9, label: "Meeting\nprepared", dx: -8,  dy: -38, anchor: "middle" },
    { xf: 0.65, yv: 3.1, label: "Context\nretrieved",dx: -8,  dy: -38, anchor: "end" },
    { xf: 1.00, yv: 4.3, label: "Task\nscheduled",   dx: -8,  dy: -38, anchor: "end" },
  ];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartLine2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3366ee" />
          <stop offset="50%" stopColor="#00c8e0" />
          <stop offset="100%" stopColor="#00e8b0" />
        </linearGradient>
        <linearGradient id="chartArea2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c8d4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00c8d4" stopOpacity="0.01" />
        </linearGradient>
        <filter id="lineGlow2" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="dotGlow2" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {yLabels.map((v) => {
        const y = pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={pad.l + iW} y2={y}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={pad.l - 6} y={y} textAnchor="end" dominantBaseline="middle"
              fontSize={9} fill="rgba(255,255,255,0.35)"
              fontFamily="'SF Pro Display','Helvetica Neue',Arial,sans-serif">
              {v === 0 ? "0" : `${v}x`}
            </text>
          </g>
        );
      })}

      {xLabels.map((lbl, i) => {
        const x = pad.l + (i / (xLabels.length - 1)) * iW;
        return (
          <text key={lbl} x={x} y={pad.t + iH + 14} textAnchor="middle"
            fontSize={9} fill="rgba(255,255,255,0.35)"
            fontFamily="'SF Pro Display','Helvetica Neue',Arial,sans-serif">
            {lbl}
          </text>
        );
      })}

      {area && <path d={area} fill="url(#chartArea2)" />}

      {line && (
        <path d={line} fill="none" stroke="url(#chartLine2)" strokeWidth="2.2"
          strokeLinecap="round" filter="url(#lineGlow2)" />
      )}

      {milestones.map((m, i) => {
        const [mx, my] = toSVG([m.xf, m.yv]);
        if (rawProgress < m.xf - 0.02 && i > 0) return null;
        const lines = m.label.split("\n");
        const hasLabel = m.label.trim().length > 0;
        const dotColor = i === 0 ? "#00b4ff" : "#00e0b0";
        return (
          <g key={i}>
            <line x1={mx} y1={my} x2={mx} y2={pad.t + iH}
              stroke="rgba(0,200,180,0.28)" strokeWidth="1" strokeDasharray="4,3" />
            <circle cx={mx} cy={my} r={7} fill={dotColor} opacity={0.2} filter="url(#dotGlow2)" />
            <circle cx={mx} cy={my} r={4.5} fill={dotColor} filter="url(#dotGlow2)" />
            <circle cx={mx} cy={my} r={2} fill="white" />
            {hasLabel && (
              <g transform={`translate(${mx + m.dx},${my + m.dy})`}>
                {lines.map((ln, li) => (
                  <text key={li} x={0} y={li * 13} fill="#00c8e0" fontSize={9.5}
                    textAnchor={m.anchor as any}
                    fontFamily="'SF Pro Display','Helvetica Neue',Arial,sans-serif"
                    fontWeight="500">
                    {ln}
                  </text>
                ))}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── BADGE ICON ───────────────────────────────────────────────────────────────
function BadgeIcon({ type }: { type: "star" | "bolt" | "trend" }) {
  const colors: Record<string, { bg: string; border: string; stroke: string }> = {
    star:  { bg: "rgba(0,160,255,0.1)",  border: "rgba(0,160,255,0.3)",  stroke: "#00a0ff" },
    bolt:  { bg: "rgba(0,210,150,0.1)",  border: "rgba(0,210,150,0.3)",  stroke: "#00d296" },
    trend: { bg: "rgba(0,190,255,0.1)",  border: "rgba(0,190,255,0.3)",  stroke: "#00beff" },
  };
  const c = colors[type];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      background: c.bg, border: `1.5px solid ${c.border}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {type === "star" && (
        <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 1L7.9 4.5H11.5L8.8 6.8L9.8 10.5L6.5 8.5L3.2 10.5L4.2 6.8L1.5 4.5H5.1L6.5 1Z"
            stroke={c.stroke} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
        </svg>
      )}
      {type === "bolt" && (
        <svg width="12" height="14" viewBox="0 0 11 14" fill="none">
          <path d="M7 1L2 8H6L4 13L9 6H5L7 1Z" stroke={c.stroke} strokeWidth="1.2"
            fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )}
      {type === "trend" && (
        <svg width="14" height="12" viewBox="0 0 13 11" fill="none">
          <path d="M1 9L5 5.5L8 7.5L12 2" stroke={c.stroke} strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 2H12V4.5" stroke={c.stroke} strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ─── COLUMN WRAPPER (entrance animation) ─────────────────────────────────────
function AnimatedCol({
  children,
  visible,
  delay,
  style,
}: {
  children: React.ReactNode;
  visible: boolean;
  delay: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(20px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PolarisImpactSection() {
  // rawProgress: linear 0→1 over DURATION (used for line chart draw & bar stagger)
  const [rawProgress, setRawProgress] = useState(0);
  // smoothProgress: eased 0→1 (used for gauge, counters)
  const [smoothProgress, setSmoothProgress] = useState(0);
  // whether IntersectionObserver has fired
  const [triggered, setTriggered] = useState(false);

  const raf = useRef<number | null>(null);
  const t0 = useRef<number | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const DURATION = 2600;

  const startAnimation = useCallback(() => {
    if (t0.current !== null) return; // already running
    setTriggered(true);
    t0.current = null;

    const go = (ts: number) => {
      if (!t0.current) t0.current = ts;
      const raw = Math.min((ts - t0.current) / DURATION, 1);
      const smooth = easeOutCubic(raw);
      setRawProgress(raw);
      setSmoothProgress(smooth);
      if (raw < 1) raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
  }, []);

  // Intersection Observer — fire once when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    // Fallback: if already visible (e.g. section is above fold)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      startAnimation();
      observer.disconnect();
    }

    return () => {
      observer.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [startAnimation]);

  const wfCount = Math.round(smoothProgress * 214);
  const speed = (smoothProgress * 4.2).toFixed(1);

  const ff = spaceGrotesk.style.fontFamily;

  return (
    <div
      ref={sectionRef}
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#040608",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: ff,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "24px 40px",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 28,
          opacity: triggered ? 1 : 0,
          transform: triggered ? "translateY(0px)" : "translateY(16px)",
          transition: "opacity 0.6s ease 0s, transform 0.6s ease 0s",
        }}
      >
        <h1 style={{
          margin: 0,
          fontSize: "clamp(30px, 3.1vw, 50px)",
          fontWeight: 800,
          color: "white",
          lineHeight: 1.12,
          letterSpacing: "-0.028em",
          fontFamily: ff,
        }}>
          Your workflow, optimized by{" "}
          <span style={{
            background: "linear-gradient(90deg, #00cfff 0%, #009fee 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Polaris.</span>
        </h1>
        <p style={{
          margin: "10px auto 0",
          maxWidth: 500,
          fontSize: "clamp(12px, 0.95vw, 15px)",
          color: "rgba(255,255,255,0.40)",
          lineHeight: 1.5,
          fontFamily: ff,
        }}>
          Polaris continuously connects context, automates repetitive work,<br />
          and helps you move faster across every app you use.
        </p>
      </div>

      {/* ── 3 COLUMNS ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0 64px",
        width: "100%",
        maxWidth: 1080,
        alignItems: "start",
      }}>

        {/* ── COLUMN 1: Gauge ── */}
        <AnimatedCol visible={triggered} delay={0.08}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <BadgeIcon type="star" />
            <span style={{ color: "rgba(255,255,255,0.80)", fontSize: 15, fontWeight: 500, fontFamily: ff }}>
              Busywork eliminated
            </span>
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 28, marginBottom: 40 }}>
            <CircularGauge value={68} duration={2300} size={240} triggered={triggered} />
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.36)", lineHeight: 1.45, fontFamily: ff }}>
            Less time spent switching between<br />apps and searching for context.
          </p>
        </AnimatedCol>

        {/* ── COLUMN 2: Bar Chart ── */}
        <AnimatedCol visible={triggered} delay={0.18}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <BadgeIcon type="bolt" />
            <span style={{ color: "rgba(255,255,255,0.80)", fontSize: 15, fontWeight: 500, fontFamily: ff }}>
              Work completed automatically
            </span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontSize: "clamp(40px, 3.5vw, 56px)",
              fontWeight: 700,
              background: "linear-gradient(90deg, #00cfff 0%, #00e8a0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.035em",
              fontFamily: ff,
              lineHeight: 1,
              display: "inline-block",
            }}>
              {wfCount}
            </span>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "rgba(255,255,255,0.36)", fontFamily: ff }}>
            workflows automated
          </p>
          <WorkflowDashBars rawProgress={rawProgress} />
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.36)", lineHeight: 1.45, fontFamily: ff }}>
            Polaris coordinates actions across<br />your apps in real time.
          </p>
        </AnimatedCol>

        {/* ── COLUMN 3: Growth Chart ── */}
        <AnimatedCol visible={triggered} delay={0.28}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <BadgeIcon type="trend" />
            <span style={{ color: "rgba(255,255,255,0.80)", fontSize: 15, fontWeight: 500, fontFamily: ff }}>
              Faster execution with context
            </span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{
              fontSize: "clamp(40px, 3.5vw, 56px)",
              fontWeight: 700,
              background: "linear-gradient(90deg, #00cfff 0%, #00e8a0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.035em",
              fontFamily: ff,
              lineHeight: 1,
              display: "inline-block",
            }}>
              {speed}×
            </span>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "rgba(255,255,255,0.36)", fontFamily: ff }}>
            faster task completion
          </p>
          <div style={{ width: "100%", marginBottom: 14, marginTop: 10 }}>
            <GrowthChart rawProgress={rawProgress} />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.36)", lineHeight: 1.45, fontFamily: ff }}>
            Polaris understands your workflow<br />so work keeps moving.
          </p>
        </AnimatedCol>

      </div>
    </div>
  );
}