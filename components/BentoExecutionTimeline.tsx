"use client";

import React, { useState, useEffect, useRef } from "react";

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12l7-8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
    <ellipse cx="8" cy="4" rx="5" ry="2" stroke="#10b981" strokeWidth="1.5" />
    <path d="M3 4v4C3 9.6 5.2 11 8 11s5-1.4 5-3V4" stroke="#10b981" strokeWidth="1.5" />
    <path d="M3 8v3c0 1.6 2.2 3 5 3s5-1.4 5-3v-3" stroke="#10b981" strokeWidth="1.5" />
  </svg>
);

const DocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1" width="12" height="14" rx="2" stroke="#10b981" strokeWidth="1.5" />
    <path d="M5 5h6M5 9h4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 2C5.2 2 3 4.2 3 7c0 1.7.8 3.2 2.1 4.2L5 13.5l2.5-1.1c.2.1.3.1.5.1 2.8 0 5-2.2 5-5S10.8 2 8 2z"
      stroke="#10b981"
      strokeWidth="1.5"
    />
  </svg>
);

interface Step {
  id: string;
  icon?: React.ReactNode;
  appLogo?: string;
  content: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "memory",
    icon: <DatabaseIcon />,
    content: <>Retrieved <span className="text-green-400 font-medium">2 relevant memories</span></>,
  },
  {
    id: "artifact",
    icon: <DocIcon />,
    content: <span className="text-neutral-500">No artifact references found</span>,
  },
  {
    id: "analyze",
    icon: <BrainIcon />,
    content: <>Analyzing: <span className="text-green-400 font-medium">"create Google Docs on ML and send to john@gmail.com"</span></>,
  },
  {
    id: "docs_agent_added",
    appLogo: "/Google_Docs_logo_(2014-2020).svg.png",
    content: <>Agent <span className="text-green-400 font-medium">Google Docs</span> added to pipeline</>,
  },
  {
    id: "docs_creating",
    appLogo: "/Google_Docs_logo_(2014-2020).svg.png",
    content: <>Creating document: <span className="text-green-400 font-medium">"Machine Learning Guide"</span></>,
  },
  {
    id: "docs_content_added",
    appLogo: "/Google_Docs_logo_(2014-2020).svg.png",
    content: <>Added <span className="text-green-400 font-medium">ML content & formatting</span> <span className="text-neutral-500">to document</span></>,
  },
  {
    id: "gmail_agent_added",
    appLogo: "/gmail.png",
    content: <>Agent <span className="text-green-400 font-medium">Gmail</span> added to pipeline</>,
  },
  {
    id: "gmail_composing",
    appLogo: "/gmail.png",
    content: <>Composing email to <span className="text-green-400 font-medium">john@gmail.com</span></>,
  },
  {
    id: "gmail_sent",
    appLogo: "/gmail.png",
    content: <><span className="text-green-400 font-medium">Document sent</span> <span className="text-neutral-500">successfully</span></>,
  },
  {
    id: "task_complete",
    icon: <CheckIcon />,
    content: <><span className="text-green-400 font-medium">Task completed</span> <span className="text-neutral-500">successfully</span></>,
  },
];

const MAX_VISIBLE = 3;
const STEP_INTERVAL = 1800;
const FADE_DURATION = 550;
const RESTART_PAUSE = 2400;

type ItemState = "entering" | "visible" | "fading";

interface RenderedStep {
  key: string;
  step: Step;
  state: ItemState;
}

interface BentoExecutionTimelineProps {
  className?: string;
}

export const BentoExecutionTimeline: React.FC<BentoExecutionTimelineProps> = ({
  className = "",
}) => {
  const [items, setItems] = useState<RenderedStep[]>([]);
  const stepIdxRef = useRef(0);
  const keyRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunning = useRef(false);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const pushStep = () => {
    const step = STEPS[stepIdxRef.current % STEPS.length];
    const key = `step-${keyRef.current++}`;

    setItems((prev) => {
      const updated = prev.map((it, i) =>
        i === 0 && prev.length >= MAX_VISIBLE ? { ...it, state: "fading" as ItemState } : it
      );
      return [...updated, { key, step, state: "entering" as ItemState }];
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setItems((prev) =>
          prev.map((it) => (it.key === key ? { ...it, state: "visible" as ItemState } : it))
        );
      });
    });

    setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.state !== "fading"));
    }, FADE_DURATION + 50);

    stepIdxRef.current++;
  };

  const scheduleNext = (delay: number, onFire: () => void) => {
    clearTimer();
    timeoutRef.current = setTimeout(onFire, delay);
  };

  const runCycle = () => {
    if (stepIdxRef.current >= STEPS.length) {
      scheduleNext(RESTART_PAUSE, () => {
        setItems((prev) => prev.map((it) => ({ ...it, state: "fading" as ItemState })));
        setTimeout(() => {
          setItems([]);
          stepIdxRef.current = 0;
          pushStep();
          scheduleNext(STEP_INTERVAL, runCycle);
        }, FADE_DURATION + 100);
      });
      return;
    }
    pushStep();
    scheduleNext(STEP_INTERVAL, runCycle);
  };

  useEffect(() => {
    if (isRunning.current) return;
    isRunning.current = true;
    pushStep();
    scheduleNext(STEP_INTERVAL, runCycle);
    return () => {
      clearTimer();
      isRunning.current = false;
    };
  }, []);

  const displayItems = items.slice(-MAX_VISIBLE);

  return (
    <div className={`flex flex-col relative pl-4 overflow-hidden scrollbar-hide max-h-full ${className}`} style={{ overflowY: 'hidden', overflowX: 'hidden' }}>
      {displayItems.map((item, i) => {
        const isLast = i === displayItems.length - 1;

        return (
          <div
            key={item.key}
            style={{
              transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
              opacity: item.state === "visible" ? 1 : 0,
              transform:
                item.state === "entering"
                  ? "translateY(20px)"
                  : item.state === "fading"
                  ? "translateY(-16px)"
                  : "translateY(0)",
            }}
            className="flex items-start gap-3 py-2.5 relative"
          >
            {/* Connector line to next step */}
            {!isLast && item.state === "visible" && (
              <div
                className="absolute left-2.25 top-8 -bottom-2.5 w-px"
                style={{ background: "linear-gradient(to bottom, #166534, transparent)" }}
              />
            )}

            {/* Colored icon only */}
            {item.step.appLogo ? (
              <img
                src={item.step.appLogo}
                alt="app-logo"
                className="mt-0.5 shrink-0 w-5 h-5 object-contain"
              />
            ) : (
              <div className="mt-0.5 shrink-0 text-green-400 flex items-center justify-center w-5 h-5">
                {item.step.icon}
              </div>
            )}

            {/* Text */}
            <div className="text-[13px] text-neutral-300 leading-relaxed pt-0.5">
              {item.step.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BentoExecutionTimeline;