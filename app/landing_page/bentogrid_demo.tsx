"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Space_Grotesk } from 'next/font/google';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "@/components/ui/cobe-globe";
import ScrambleHover from "@/components/ui/scramble";
import { Mail, Check, X, AlertCircle } from "lucide-react";
import { PreviewContentRenderer, CollapsibleConfirmedAction } from "@/components/MainAgentContent";
import { BentoCollapsibleConfirmedAction } from "@/components/BentoCollapsibleConfirmedAction";
import { BentoExecutionTimeline } from "@/components/BentoExecutionTimeline";

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

// ─────────────────────────────────────────────────────────────────────────────
// BentoGridShowcase (layout engine — untouched from original)
// ─────────────────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 90, damping: 14 },
  },
};

interface BentoGridShowcaseProps {
  integration: React.ReactNode;
  trackers: React.ReactNode;
  statistic: React.ReactNode;
  focus: React.ReactNode;
  productivity: React.ReactNode;
  className?: string;
}

export const BentoGridShowcase = ({
  integration,
  trackers,
  statistic,
  focus,
  productivity,
  className,
}: BentoGridShowcaseProps) => (
  <motion.section
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className={cn(
      "grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-[320px_530px]",
      className
    )}
  >
    <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-2 min-h-0 h-full">{integration}</motion.div>
    <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 min-h-0">{trackers}</motion.div>
    <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 min-h-0">{statistic}</motion.div>
    <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 min-h-0">{focus}</motion.div>
    <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1 min-h-0">{productivity}</motion.div>
  </motion.section>
);

// ─────────────────────────────────────────────────────────────────────────────
// SLOT 1 — Multi-Agent Orchestration (tall, row-span-3)
// Canvas node graph: Polaris center → 6 agent satellites
// ─────────────────────────────────────────────────────────────────────────────
const AGENT_NODES = [
  { label: "Gmail",    color: "#4ade80" },
  { label: "GitHub",   color: "#a78bfa" },
  { label: "Calendar", color: "#60a5fa" },
  { label: "Docs",     color: "#34d399" },
  { label: "Sheets",   color: "#86efac" },
  { label: "Teams",    color: "#818cf8" },
];

function AgentGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let t = 0;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H * 0.48;
      const R = Math.min(W, H) * 0.33;

      const nodes = AGENT_NODES.map((a, i) => {
        const angle = (i / AGENT_NODES.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...a,
          x: cx + R * Math.cos(angle),
          y: cy + R * Math.sin(angle),
        };
      });

      // Subtle background glow behind center
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
      grd.addColorStop(0, "rgba(59,130,246,0.07)");
      grd.addColorStop(1, "rgba(59,130,246,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Draw static edge lines
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = "rgba(59,130,246,0.10)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Animated traveling dots — one per node, offset by index
      nodes.forEach((n, i) => {
        const phase = ((t * 0.55 + i * (1 / AGENT_NODES.length)) % 1);
        const px = cx + (n.x - cx) * phase;
        const py = cy + (n.y - cy) * phase;
        const alpha = phase < 0.85 ? 1 : 1 - (phase - 0.85) / 0.15;

        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${0.85 * alpha})`;
        ctx.fill();

        // Tiny glow around the dot
        const gd = ctx.createRadialGradient(px, py, 0, px, py, 7);
        gd.addColorStop(0, `rgba(59,130,246,${0.18 * alpha})`);
        gd.addColorStop(1, "rgba(59,130,246,0)");
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = gd;
        ctx.fill();
      });

      // Outer pulse rings on center node
      for (let k = 0; k < 3; k++) {
        const pulse = ((t * 0.45 + k * 0.33) % 1);
        ctx.beginPath();
        ctx.arc(cx, cy, 26 + pulse * 40, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Agent satellite nodes
      nodes.forEach((n) => {
        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, 24, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(15,20,30,0.95)";
        ctx.fill();
        ctx.strokeStyle = "rgba(59,130,246,0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 10px 'DM Sans', ui-sans-serif, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x, n.y);
      });

      // Center "Polaris" node
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#1d4ed8";
      ctx.fill();
      ctx.strokeStyle = "rgba(96,165,250,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "600 11px 'DM Sans', ui-sans-serif, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Polaris", cx, cy);

      t += 0.008;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

function IntegrationCard() {
  return (
    <Card className="flex h-full flex-col overflow-hidden backdrop-blur-md border-[rgba(255,255,255,0.08)]" style={{ background: "rgba(10,12,20,0.6)" }}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className="bg-blue-950 text-blue-400 border-blue-800 text-[10px] font-mono tracking-widest hover:bg-blue-950">
            MULTI-AGENT
          </Badge>
        </div>
        <CardTitle className={`${spaceGrotesk.className} text-xl md:text-2xl font-bold text-white leading-snug`}>
          13 specialized agents.<br />One conversation.
        </CardTitle>
        <CardDescription className="text-gray-300 leading-relaxed">
          Routes your intent to the right agent — or many at once — executing in parallel without switching a single tab.
        </CardDescription>
      </CardHeader>

      {/* Globe + Scramble box fills remaining space */}
      <CardContent className="flex-1 p-0 min-h-0 overflow-hidden relative">
        {/* Absolute positioned container for globe and scramble - centered at bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 shrink-0 overflow-visible"
          style={{ width: "480px", height: "480px", zIndex: 50, pointerEvents: "none" }}
        >
          <div className="w-full h-full" style={{ position: "relative" }}>
            {/* 1. Scramble / Hello box — LOWER z-index so globe sits above it */}
            <ScrambleBox />

            {/* 2. Globe — HIGHER z-index so it renders above the scramble box */}
            <div style={{ pointerEvents: "auto", zIndex: 20, width: "100%", height: "100%" }}>
              <Globe
                markers={[]}
                arcs={[]}
                markerColor={[0.3, 0.45, 0.85]}
                baseColor={[0.2, 0.2, 0.2]}
                arcColor={[0.3, 0.45, 0.85]}
                glowColor={[0.94, 0.93, 0.91]}
                dark={1}
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Tag strip */}
      <div className="px-5 pb-5 pt-2 shrink-0 flex gap-2">
          {["Parallel", "Sequential", "Automated"].map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full font-medium text-blue-400"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.18)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT 2 — Integrations Feed (top-middle)
// Integration list displays scrolling logos
// ─────────────────────────────────────────────────────────────────────────────

function TrackersCard() {
  return (
    <Card className="h-full flex flex-col backdrop-blur-md border-[rgba(255,255,255,0.08)] overflow-hidden" style={{ background: "rgba(10,12,20,0.6)" }}>
      <CardContent className="flex-1 flex flex-col justify-between p-5 min-h-0 gap-4">
        {/* Top row: headline + description */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span
                className="inline-block text-[10px] font-mono tracking-widest px-2.5 py-1 rounded-full mb-2"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: "#60a5fa",
                }}
              >
                INTEGRATIONS
              </span>
              <h3 className={`${spaceGrotesk.className} text-xl font-bold text-white leading-snug`}>
                Every tool you already use.<br />Now unified.
              </h3>
              <p className="text-gray-300 mt-1">
                Google Workspace · Microsoft 365 · GitHub · Search · Maps · Weather · Flights
              </p>
            </div>
          </div>
        </div>

        {/* Integration scroll strip */}
        <div className="relative overflow-hidden h-16" style={{ width: "100%", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
          <motion.div
            className="flex gap-4 w-max items-center"
            animate={{ x: [0, -50 * INTEGRATIONS.length] }}
            transition={{
              duration: 28,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {[...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS].map((item, i) => (
              <Image
                key={`${item.name}-${i}`}
                src={item.logo}
                alt={item.name}
                width={40}
                height={40}
                className="object-contain shrink-0"
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom stat row */}
        <div className="flex items-center gap-6">
          {[
            { value: "13", label: "integrations" },
            { value: "50+", label: "languages"    },
            { value: "13",  label: "agents"       },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-bold text-white leading-none">{s.value}</span>
              <span className="text-[11px] text-gray-400 font-mono">{s.label}</span>
            </div>
          ))}
          <span
            className="ml-auto text-[10px] font-mono px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(59,130,246,0.07)",
              border: "1px solid rgba(59,130,246,0.18)",
              color: "#3b82f6",
            }}
          >
            growing →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT 3 — Real-Time Execution (top-right)
// Live execution timeline with actual agent thinking approach
// ─────────────────────────────────────────────────────────────────────────────

function StatisticCard() {
  const [showTimeline, setShowTimeline] = useState(true);

  return (
    <Card className="h-full flex flex-col backdrop-blur-md border-[rgba(255,255,255,0.08)] overflow-hidden" style={{ background: "rgba(10,12,20,0.6)" }}>
      <CardHeader className="pb-3 shrink-0">
        <Badge className="w-fit text-blue-400 border-blue-900 text-[10px] font-mono tracking-widest mb-2" style={{ background: "rgba(30,58,138,0.4)" }}>
          REAL-TIME EXECUTION
        </Badge>
        <CardTitle className={`${spaceGrotesk.className} text-lg font-bold text-white leading-snug`}>
          Thinking Approach
        </CardTitle>
        <CardDescription className="text-gray-300">
          See how Polaris processes your intent step-by-step
        </CardDescription>
      </CardHeader>

      {/* Execution Timeline Container */}
      <CardContent className="flex-1 px-4 pb-4 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <BentoExecutionTimeline
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT 4 — Smart Scheduling (middle-middle)
// Calendar event list + file chips (combined)
// ─────────────────────────────────────────────────────────────────────────────
const SCHEDULE_EVENTS = [
  { time: "MON  10:00", label: "Team Standup",      recur: true  },
  { time: "WED  14:30", label: "1:1 with Sarah",    recur: false },
  { time: "FRI  17:00", label: "Weekly Report",     recur: true  },
];

function FocusCard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3500);
    return () => clearInterval(id);
  }, []);

  // Cycle a "Reminder sent ✓" badge on the first recurring event
  const showBadge = tick % 2 === 0;

  return (
    <Card className="h-full flex flex-col backdrop-blur-md border-[rgba(255,255,255,0.08)] overflow-hidden" style={{ background: "rgba(10,12,20,0.6)" }}>
      <CardHeader className="pb-2 shrink-0">
        <Badge className="w-fit text-indigo-400 border-indigo-900 text-[10px] font-mono tracking-widest mb-1" style={{ background: "rgba(55,48,163,0.4)" }}>
          SCHEDULING
        </Badge>
        <CardTitle className={`${spaceGrotesk.className} text-lg font-bold text-white leading-snug`}>
          Set it. Forget it.
        </CardTitle>
        <CardDescription className="text-gray-300">
          Cron-based, timezone-aware. One-time or recurring — handled automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 px-5 pb-4 min-h-0 overflow-hidden">
        {SCHEDULE_EVENTS.map((ev, i) => (
          <div
            key={ev.label}
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="text-xs font-medium text-blue-400"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  color: "#60a5fa",
                  border: "1px solid rgba(59,130,246,0.15)",
                  letterSpacing: "0.04em",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  display: "inline-block",
                }}
              >
                {ev.time}
              </span>
              <span className="text-sm text-gray-200">{ev.label}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {ev.recur && (
              <span className="text-xs text-gray-400" title="Recurring">↻</span>
              )}
              {i === 0 && (
                <AnimatePresence mode="wait">
                  {showBadge && (
                    <motion.span
                      key="badge"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.3 }}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(16,185,129,0.1)",
                        color: "#34d399",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      Sent ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Bento Confirmation Bar (duplicated for independent customization)
// ─────────────────────────────────────────────────────────────────────────────
interface BentoConfirmationBarProps {
  onConfirm: () => void;
  onSkip: () => void;
  isConfirming?: boolean;
}

function BentoConfirmationBar({
  onConfirm,
  onSkip,
  isConfirming = false,
}: BentoConfirmationBarProps) {
  return (
    <div className="rounded-xl bg-[#141414]/90 border border-white/6 px-5 py-3.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/90">Ready to send</p>
          <p className="text-xs text-white/40">Confirm to proceed</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSkip}
          disabled={isConfirming}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#252525] hover:bg-[#303030] border border-white/6 disabled:opacity-50 disabled:cursor-not-allowed text-white/70 text-sm font-medium transition-all duration-200"
        >
          <X className="w-3.5 h-3.5" />
          Skip
        </button>
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200"
        >
          <Check className="w-3.5 h-3.5" />
          {isConfirming ? 'Processing...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT 5 — Confirmation Flow (middle-right)
// Interactive action preview card
// ─────────────────────────────────────────────────────────────────────────────
type ConfirmState = "idle" | "confirmed" | "cancelled";

// Email preview component using custom bento components
function EmailPreview() {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsConfirming(false);
  };

  const handleSkip = () => {};

  const previewContent = `**Subject**: Meeting Follow-up

**Email Body**:
Thank you for the productive discussion today. Looking forward to connecting next week.

Best regards`;

  return (
    <div className="w-full h-full flex flex-col gap-0 min-h-0" style={{ overflow: "hidden" }}>
      {/* Collapsible preview — grows/shrinks with content, no forced flex expansion */}
      <div className="min-h-0 overflow-y-auto">
        <BentoCollapsibleConfirmedAction
          content={previewContent}
          actionType="send_email"
          agentName="gmail"
          description="Send an email"
          recipientEmail="john.doe@example.com"
          autoToggle={true}
          autoToggleInterval={4000}
        />
      </div>
      
      <div className="shrink-0 pt-3">
        <BentoConfirmationBar
          onConfirm={handleConfirm}
          onSkip={handleSkip}
          isConfirming={isConfirming}
        />
      </div>
    </div>
  );
}

function ProductivityCard() {
  return (
    <Card className="h-full flex flex-col backdrop-blur-md border-[rgba(255,255,255,0.08)] overflow-hidden" style={{ background: "rgba(10,12,20,0.6)" }}>
      <CardHeader className="pb-3 shrink-0">
        <Badge className="w-fit text-orange-400 border-orange-900 text-[10px] font-mono tracking-widest mb-1" style={{ background: "rgba(120,53,15,0.4)" }}>
          CONTROL
        </Badge>
        <CardTitle className={`${spaceGrotesk.className} text-lg font-bold text-white leading-snug`}>
          Powerful, but never reckless.
        </CardTitle>
        <CardDescription className="text-gray-300">
          Preview every sensitive action before it executes.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 px-4 pb-4 min-h-0 overflow-hidden">
        <EmailPreview />
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT 6 — Cross-Platform + Languages (wide bottom, col-span-2)
// Infinite scroll integration strip + language pills
// ─────────────────────────────────────────────────────────────────────────────
const INTEGRATIONS = [
  { name: "Gmail", logo: "/gmail.png" },
  { name: "Google Docs", logo: "/Google_Docs_logo_(2014-2020).svg.png" },
  { name: "Google Sheets", logo: "/Google_Sheets_logo_(2014-2020).svg.png" },
  { name: "Google Calendar", logo: "/Google_Calendar_icon_(2020).svg.png" },
  { name: "Google Forms", logo: "/Google_Forms_2020_Logo.svg.png" },
  { name: "GitHub", logo: "/git3.png" },
  { name: "Outlook", logo: "/microsoft-outlook.png" },
  { name: "Microsoft Word", logo: "/Microsoft_Office_Word_(2025–present).svg.png" },
  { name: "Excel", logo: "/microsoft-excel.png" },
  { name: "Teams", logo: "/Microsoft_Office_Teams_(2025–present).svg.png" },
  { name: "OneDrive", logo: "/microsoft-onedrive.png" },
  { name: "Google Maps", logo: "/Google_Drive.png" },
];

const LANGUAGES = ["English", "हिंदी", "العربية", "Español", "中文", "Français", "Deutsch", "日本語", "Português", "Русский"];

const GLOBE_MARKERS = [
  { id: "sf", location: [37.7595, -122.4367] as [number, number], label: "San Francisco" },
  { id: "nyc", location: [40.7128, -74.006] as [number, number], label: "New York" },
  { id: "london", location: [51.5074, -0.1278] as [number, number], label: "London" },
  { id: "tokyo", location: [35.6762, 139.6503] as [number, number], label: "Tokyo" },
];

const GLOBE_ARCS = [
  {
    id: "sf-tokyo",
    from: [37.7595, -122.4367] as [number, number],
    to: [35.6762, 139.6503] as [number, number],
    label: "",
  },
];

const HELLOS = [
  "Hello!",
  "¡Hola!",
  "Bonjour!",
  "Hallo!",
  "Ciao!",
  "Olá!",
  "Привет!",
  "你好!",
  "مرحبا!",
  "नमस्ते!",
  "שלום!",
  "Hej!",
  "Selam!",
  "Sawasdee!",
  "Salam!",
];

// Extracted scramble component to prevent parent re-renders
function ScrambleBox() {
  const [helloIdx, setHelloIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleScrambleEnter = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setHelloIdx((prev) => (prev + 1) % HELLOS.length);
    }, 120);
  }, []);

  const handleScrambleLeave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setHelloIdx(0);
  }, []);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 w-80 h-24"
      style={{
        top: "-12px",
        pointerEvents: "auto",
        zIndex: 5,
      }}
      onMouseEnter={handleScrambleEnter}
      onMouseLeave={handleScrambleLeave}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl p-3 text-center"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          pointerEvents: "none",
          minWidth: "200px",
          zIndex: 5,
        }}
      >
        <div className={`${spaceGrotesk.className} text-5xl font-bold text-white`}>
          {HELLOS[helloIdx]}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE DEMO
// ─────────────────────────────────────────────────────────────────────────────
export default function BentoGridShowcaseDemo() {
  return (
    <div
      className="w-full min-h-screen p-6 md:p-12"
      style={{ background: "#000000" }}
    >
      {/* Section header */}
      <div className="mb-10 max-w-7xl mx-auto text-center">
        <span
          className={`${spaceGrotesk.className} inline-block text-[11px] font-bold tracking-widest px-3 py-1.5 rounded-full mb-4`}
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.22)",
            color: "#3b82f6",
          }}
        >
          CAPABILITIES
        </span>
        <h2
          className={`${spaceGrotesk.className} text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4`}
        >
          Everything you need. Nothing you don't.
        </h2>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
          A platform built from the ground up for professionals who can't afford to waste time.
        </p>
      </div>

      <BentoGridShowcase
        integration={<IntegrationCard />}
        trackers={<TrackersCard />}
        statistic={<StatisticCard />}
        focus={<FocusCard />}
        productivity={<ProductivityCard />}
      />

      {/* Space Grotesk font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}