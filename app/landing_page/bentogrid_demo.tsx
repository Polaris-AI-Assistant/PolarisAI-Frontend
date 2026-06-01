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
import { Globe } from "@/components/ui/cobe-globe";
import ScrambleHover from "@/components/ui/scramble";
import { Mail, Check, X, Send, MessageSquare, Globe as LucideGlobe, Sparkles, Calendar } from "lucide-react";
import { PreviewContentRenderer, CollapsibleConfirmedAction } from "@/components/MainAgentContent";
import { BentoCollapsibleConfirmedAction } from "@/components/BentoCollapsibleConfirmedAction";
import { BentoExecutionTimeline } from "@/components/BentoExecutionTimeline";

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

const BENTO_CARD_CLASS = "border border-cyan-400/10 bg-[#05070c]/92 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.04)]";
const BENTO_BADGE_STYLE = {
  background: "rgba(10, 18, 32, 0.9)",
  border: "1px solid rgba(34, 211, 238, 0.18)",
};

function SafetyShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.75L14.5 3.75V8.15C14.5 11.7 12.37 14.45 9 16.25C5.63 14.45 3.5 11.7 3.5 8.15V3.75L9 1.75Z"
        stroke="#f4b41a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 5.15L9.85 7.05L11.95 7.25L10.38 8.6L10.85 10.65L9 9.6L7.15 10.65L7.62 8.6L6.05 7.25L8.15 7.05L9 5.15Z"
        fill="#f4b41a"
      />
    </svg>
  );
}

function RealtimeBadgeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M7.1 0.75L2.3 6.4H5.7L4.9 11.25L9.7 5.6H6.3L7.1 0.75Z" fill="currentColor" />
    </svg>
  );
}

function SequenceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.2 4.2H11.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.4 7H10.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <path d="M4.6 9.8H9.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function AutomationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.6L7.9 4.1L10.4 5L7.9 5.9L7 8.4L6.1 5.9L3.6 5L6.1 4.1L7 1.6Z" fill="currentColor" />
      <path d="M10.9 7.6L11.4 9L12.8 9.5L11.4 10L10.9 11.4L10.4 10L9 9.5L10.4 9L10.9 7.6Z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

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
      "grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.04fr)_minmax(0,1.04fr)] md:gap-x-4 md:grid-rows-[316px_390px]",
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
      grd.addColorStop(0, "rgba(59,130,246,0.10)");
      grd.addColorStop(0.45, "rgba(45,212,191,0.08)");
      grd.addColorStop(0.78, "rgba(244,114,182,0.05)");
      grd.addColorStop(1, "rgba(250,128,114,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Draw static edge lines
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = "rgba(45,212,191,0.12)";
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
        gd.addColorStop(0, `rgba(244,114,182,${0.16 * alpha})`);
        gd.addColorStop(1, "rgba(244,114,182,0)");
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
        ctx.strokeStyle = `rgba(244,114,182,${0.12 * (1 - pulse)})`;
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
        ctx.strokeStyle = "rgba(45,212,191,0.22)";
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
      ctx.strokeStyle = "rgba(45,212,191,0.55)";
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
    <Card className={`flex h-full flex-col overflow-hidden ${BENTO_CARD_CLASS}`} style={{ background: "#05070c" }}>
      <CardHeader className="pt-7 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-cyan-300" />
          <span className="text-[12px] font-semibold tracking-[0.16em] text-cyan-300">
            NATURAL LANGUAGE
          </span>
        </div>
        <CardTitle className={`${spaceGrotesk.className} text-xl md:text-3xl font-bold text-white leading-snug`}>
          Talk naturally. In any language.
        </CardTitle>
        <CardDescription className="mt-4 text-gray-300 leading-relaxed">
          
          <p>No commands. No syntax.</p>
          <p>Just natural conversations that turn into actions.</p>
        </CardDescription>
      </CardHeader>

      {/* Globe + Scramble box fills remaining space */}
      <CardContent className="flex-1 p-0 min-h-0 overflow-hidden relative">
        {/* Absolute positioned container for globe and scramble - centered at bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 shrink-0 overflow-visible"
          style={{ width: "390px", height: "390px", zIndex: 50, pointerEvents: "none", bottom: "40px" }}
        >
          <div className="w-full h-full" style={{ position: "relative" }}>
            {/* 1. Scramble / Hello box — LOWER z-index so globe sits above it */}
            <ScrambleBox />

            {/* 2. Globe — HIGHER z-index so it renders above the scramble box */}
            <div style={{ pointerEvents: "auto", zIndex: 20, width: "100%", height: "100%" }}>
              <Globe
                markers={[]}
                arcs={[]}
                markerColor={[0.29, 0.87, 0.5]}
                baseColor={[0.17, 0.36, 0.74]}
                arcColor={[0.96, 0.47, 0.4]}
                glowColor={[0.13, 0.83, 0.93]}
                dark={1}
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Tag strip */}
      <div className="px-5 pb-5 pt-2 shrink-0 flex justify-center">
        <div className="inline-flex items-center justify-center gap-5 text-[15px] font-semibold text-sky-200/95 md:text-[16px]">
          <div className="inline-flex items-center gap-2 whitespace-nowrap">
            <MessageSquare className="h-4.5 w-4.5 text-cyan-300" />
            <span>Natural</span>
          </div>
          <span className="h-4 w-px bg-white/10" />
          <div className="inline-flex items-center gap-2 whitespace-nowrap">
            <LucideGlobe className="h-4.5 w-4.5 text-sky-300" />
            <span>Multilingual</span>
          </div>
          <span className="h-4 w-px bg-white/10" />
          <div className="inline-flex items-center gap-2 whitespace-nowrap">
            <Sparkles className="h-4.5 w-4.5 text-emerald-300" />
            <span>Actionable</span>
          </div>
        </div>
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
    <Card className={`h-full flex flex-col overflow-hidden ${BENTO_CARD_CLASS}`} style={{ background: "#05070c" }}>
      <CardHeader className="pb-4 pt-5 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-sky-400" />
          <span className="text-[12px] font-semibold tracking-[0.16em] text-sky-400">CONTROL</span>
        </div>
        <CardTitle className={`${spaceGrotesk.className} text-[28px] font-semibold text-white leading-[1.12] tracking-[-0.03em]`}>
          Powerful, but never reckless.
        </CardTitle>
        <CardDescription className="text-[16px] text-white/65 mt-3">
          Preview every sensitive action before it executes.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 px-4 pb-4 pt-3 min-h-0 overflow-hidden">
        <EmailPreview />
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
    <Card className={`h-full flex flex-col overflow-hidden ${BENTO_CARD_CLASS}`} style={{ background: "#05070c" }}>
      <CardHeader className="pb-3 shrink-0">
        <div className="mb-2 inline-flex items-center gap-2">
          <span className=" text-cyan-300">
            <RealtimeBadgeIcon />
          </span>
          <span className="text-[12px] font-semibold tracking-[0.16em] text-cyan-300">
            REAL-TIME EXECUTION
          </span>
        </div>
        <CardTitle className={`${spaceGrotesk.className} text-[27px] md:text-[28px] font-semibold text-white leading-[1.08] tracking-[-0.04em]`}>
          Watch every step unfold.
        </CardTitle>
        <CardDescription className="mt-3 text-[16px] text-white/65 leading-relaxed">
          See how Polaris processes your intent step-by-step.
        </CardDescription>
      </CardHeader>

      {/* Execution Timeline Container */}
      <CardContent className="flex-1 px-4 pb-4 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <BentoExecutionTimeline
            className="w-full"
          />
        </div>
        <div className="pt-3 shrink-0">
          <div className="inline-flex items-center gap-2 text-[13px] font-medium text-cyan-300">
            <span>View execution logs</span>
            <span className="text-[16px] leading-none">›</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT 4 — Smart Scheduling (middle-middle)
// Calendar event list + file chips (combined)
// ─────────────────────────────────────────────────────────────────────────────
const SCHEDULE_ITEMS = [
  {
    logo: "/gmail.png",
    label: "Send project update",
    badge: "Daily",
    time: "9:00 AM",
  },
  {
    logo: "/Microsoft_Office_Teams_(2025–present).svg.png",
    label: "Team standup reminder",
    badge: "Weekdays",
    time: "10:00 AM",
  },
  {
    logo: "/Google_Calendar_icon_(2020).svg.png",
    label: "1:1 with Sarah",
    badge: "Wednesdays",
    time: "2:30 PM",
  },
  // {
  //   logo: "/git3.png",
  //   label: "Weekly GitHub review",
  //   badge: "Fridays",
  //   time: "5:00 PM",
  // },
];

function FocusCard() {
  return (
    <Card className={`h-full flex flex-col overflow-hidden ${BENTO_CARD_CLASS}`} style={{ background: "#05070c" }}>
      <CardHeader className="pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-6 h-6 text-blue-400" />
          <span className="text-[12px] font-semibold tracking-[0.16em] text-blue-400">SCHEDULING</span>
        </div>
        <CardTitle className={`${spaceGrotesk.className} text-[28px] font-semibold text-white leading-[1.12] tracking-[-0.03em]`}>
          Set it. Forget it.
        </CardTitle>
        <CardDescription className="text-[16px] text-white/65 mt-3">
          Cron-based, timezone-aware. One-time or recurring — handled automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 px-4 pb-4 pt-1 min-h-0 overflow-hidden">
        {SCHEDULE_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/2 px-4 py-2.5"
            style={{
              minHeight: 46,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-7 w-7 items-center justify-center shrink-0">
                <Image src={item.logo} alt={item.label} width={20} height={20} className="object-contain" />
              </div>
              <span className="text-[13px] font-medium text-white/90 truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="rounded-md border border-white/8 bg-white/3 px-2.5 py-0.5 text-[11px] text-white/55">
                {item.badge}
              </span>
              <span className="min-w-17.5 text-right text-[13px] text-white/70">{item.time}</span>
              <span className="h-2 w-2 rounded-full bg-[#19d9d2]" />
            </div>
          </div>
        ))}
        <div className="pt-1">
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-blue-400">
            View all schedules
            <span className="text-[16px] leading-none">→</span>
          </span>
        </div>
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
    <div className="rounded-xl bg-[#0b0f16]/92 border border-cyan-400/10 px-5 py-3.5 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-6 h-6 rounded-full bg-[#17120b] border border-[#f4b41a]/25 flex items-center justify-center shrink-0">
          <SafetyShieldIcon />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">Safe by design</p>
          <p className="text-xs text-white/40 truncate">You’re always in control.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSkip}
          disabled={isConfirming}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111720] hover:bg-[#16202c] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white/70 text-sm font-medium transition-all duration-200"
        >
          <X className="w-3.5 h-3.5" />
          Skip
        </button>
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200"
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
    <div className="w-full h-full flex flex-col justify-between gap-3 min-h-0" style={{ overflow: "hidden" }}>
      {/* Collapsible preview stays fully visible inside the card */}
      <div className="shrink-0 min-h-0">
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

      <div className="shrink-0 pt-0">
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
    <Card className={`h-full flex flex-col overflow-hidden ${BENTO_CARD_CLASS}`} style={{ background: "#05070c" }}>
      <CardContent className="flex-1 flex flex-col justify-between p-5 min-h-0 gap-5">
        {/* Top row: headline + description */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="mb-2 inline-flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center text-cyan-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
                    <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.9" />
                    <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.8" />
                    <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.7" />
                  </svg>
                </span>
                <span className="text-[12px] font-semibold tracking-[0.16em] text-cyan-300">INTEGRATIONS</span>
              </div>
              <h3 className={`${spaceGrotesk.className} text-[28px] font-bold text-white leading-[1.22] tracking-[-0.03em]`}>
                Every tool you already use.<br />Now unified.
              </h3>
              <p className="text-[14px] leading-6 text-gray-300 mt-2 max-w-105">
                Google Workspace · Microsoft 365 · GitHub · Search · Maps · Weather · Flights
              </p>
            </div>
          </div>
        </div>

        {/* Integration scroll strip */}
        <div className="relative overflow-hidden h-19" style={{ width: "100%", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
          <motion.div
            className="flex gap-3 w-max items-center"
            animate={{ x: [0, -50 * INTEGRATIONS.length] }}
            transition={{
              duration: 28,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {[...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS].map((item, i) => (
              <div key={`${item.name}-${i}`} className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/8 bg-white/3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <Image
                  src={item.logo}
                  alt={item.name}
                  width={28}
                  height={28}
                  className="object-contain shrink-0"
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom stat row */}
        <div className="flex items-center gap-0">
          {[
            { value: "15+", label: "integrations" },
            { value: "50+", label: "languages"    },
            { value: "15+",  label: "agents"       },
          ].map((s, idx) => (
            <React.Fragment key={s.label}>
              <div className="flex flex-1 flex-col items-center justify-center text-center gap-1">
                <span
                  className={`text-[36px] font-bold leading-none tracking-[-0.03em]`}
                  style={
                    idx === 1
                      ? { backgroundImage: 'linear-gradient(90deg,#34d399,#06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
                      : { backgroundImage: 'linear-gradient(90deg,#60a5fa,#06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
                  }
                >
                  {s.value}
                </span>
                <span className="text-[12px] text-white/55 font-medium">
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className="mx-4 h-10 w-px bg-white/10" />
              )}
            </React.Fragment>
          ))}
          <span className="ml-auto text-[12px] font-medium px-0 py-0 rounded-none text-cyan-300">
            Growing ↗
          </span>
        </div>
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
        <div
          className={`${spaceGrotesk.className} text-5xl font-bold`}
          style={{
            backgroundImage: "linear-gradient(90deg, #35dbff 0%, #4cf0ff 18%, #34f7d2 44%, #8cff5e 68%, #ff7a9a 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
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
            background: "rgba(8, 47, 73, 0.55)",
            border: "1px solid rgba(45, 212, 191, 0.22)",
            color: "#2dd4bf",
          }}
        >
          CAPABILITIES
        </span>
        <h2
          className={`${spaceGrotesk.className} text-4xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4`}
        >
          Everything your workflow was missing.
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