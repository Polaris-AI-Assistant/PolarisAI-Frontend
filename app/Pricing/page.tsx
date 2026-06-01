'use client'
import { useState } from "react";

type BillingCycle = "monthly" | "yearly";

const plans = [
  {
    id: "starter",
    name: "Starter",
    tag: "Free forever",
    tagColor: "#4ade80",
    price: { monthly: 0, yearly: 0 },
    priceLabel: { monthly: "₹0", yearly: "₹0" },
    subLabel: "No credit card required",
    credits: "100 credits",
    creditsNote: "one-time on signup",
    cta: "Get started free",
    ctaStyle: "outline",
    features: [
      "Gmail, Calendar & Docs agents",
      "Web search & weather",
      "Maps & location queries",
      "7-day conversation memory",
      "5 scheduled reminders",
      "Basic intent classification",
    ],
    excluded: ["GitHub & Microsoft 365", "PDF / file generation", "Multi-agent parallel workflows"],
  },
  {
    id: "pro",
    name: "Pro",
    tag: "Most popular",
    tagColor: "#38bdf8",
    price: { monthly: 499, yearly: 399 },
    priceLabel: { monthly: "₹499", yearly: "₹399" },
    subLabel: { monthly: "per month", yearly: "per month, billed yearly" },
    credits: "1,500 credits",
    creditsNote: "refreshed monthly",
    cta: "Start Pro trial",
    ctaStyle: "filled",
    featured: true,
    features: [
      "Everything in Starter",
      "GitHub & Microsoft 365 agents",
      "Flights & travel search",
      "PDF / file generation",
      "90-day semantic memory",
      "50 scheduled tasks",
      "Multi-agent workflows",
      "Credit top-ups available",
    ],
    excluded: [],
  },
  {
    id: "power",
    name: "Power",
    tag: "For builders",
    tagColor: "#a78bfa",
    price: { monthly: 999, yearly: 799 },
    priceLabel: { monthly: "₹999", yearly: "₹799" },
    subLabel: { monthly: "per month", yearly: "per month, billed yearly" },
    credits: "4,000 credits",
    creditsNote: "refreshed monthly",
    cta: "Go Power",
    ctaStyle: "outline",
    features: [
      "Everything in Pro",
      "Parallel multi-agent execution",
      "Unlimited memory retention",
      "Unlimited scheduled tasks",
      "Priority queue execution",
      "Early access to new agents",
      "Advanced validation engine",
      "Dedicated response streaming",
    ],
    excluded: [],
  },
];

const creditActions = [
  { action: "Weather / web search", cost: "1–2", complexity: 1 },
  { action: "Send email / calendar event", cost: "3–5", complexity: 2 },
  { action: "Create Doc / Sheet / Form", cost: "5–8", complexity: 3 },
  { action: "GitHub operations", cost: "5–10", complexity: 3 },
  { action: "Multi-agent workflow", cost: "8–15", complexity: 4 },
  { action: "PDF / file generation", cost: "10–15", complexity: 5 },
];

const topups = [
  { credits: "250", price: "₹149", per: "₹0.60/credit" },
  { credits: "750", price: "₹349", per: "₹0.47/credit", savings: "Save 22%" },
  { credits: "2,000", price: "₹799", per: "₹0.40/credit", savings: "Save 33%" },
];

const faqs = [
  {
    q: "Do unused credits roll over?",
    a: "Top-up credits never expire. Monthly plan credits reset at the start of each billing cycle and do not roll over.",
  },
  {
    q: "What happens when I run out of credits?",
    a: "You'll receive a low-credit notification at 20% remaining. When credits hit zero, actions are paused. You can top-up instantly or upgrade your plan.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrades are instant and prorated. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "Which integrations need OAuth setup?",
    a: "Gmail, Calendar, Docs, GitHub, Outlook, and OneDrive require a one-time OAuth connection from the integrations panel.",
  },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 4L10 10M10 4L4 10" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M8 1L3 8H7L6 13L11 6H7L8 1Z" fill={color} />
    </svg>
  );
}

export default function PolarisAIPricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{
      background: "#080808",
      minHeight: "100vh",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      color: "#e8e8e8",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .polaris-pricing ::selection { background: #38bdf820; }

        .grid-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .glow-orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
          filter: blur(120px);
        }

        .content { position: relative; z-index: 1; }

        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em;
          text-transform: uppercase; padding: 4px 12px;
          border-radius: 100px;
        }

        .toggle-wrap {
          display: inline-flex; align-items: center;
          background: #111; border: 0.5px solid #222;
          border-radius: 100px; padding: 4px; gap: 2px;
        }
        .toggle-btn {
          font-family: inherit; font-size: 13px; font-weight: 400;
          border: none; border-radius: 100px;
          padding: 7px 18px; cursor: pointer; transition: all 0.2s;
          position: relative;
        }
        .toggle-btn.active {
          background: #fff; color: #080808; font-weight: 500;
        }
        .toggle-btn.inactive {
          background: transparent; color: #666;
        }
        .toggle-btn.inactive:hover { color: #aaa; }

        .save-badge {
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; padding: 2px 7px; border-radius: 100px;
          background: #4ade8022; color: #4ade80; margin-left: 8px;
        }

        .plan-card {
          border-radius: 16px; padding: 32px 28px;
          display: flex; flex-direction: column; gap: 0;
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .plan-card:hover { transform: translateY(-2px); }

        .plan-card.normal {
          background: #0e0e0e;
          border: 0.5px solid #1e1e1e;
        }
        .plan-card.featured {
          background: #0a1628;
          border: 0.5px solid #38bdf840;
          box-shadow: 0 0 60px #38bdf810, inset 0 0 60px #38bdf805;
        }

        .plan-tag {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 16px;
        }

        .plan-name {
          font-size: 20px; font-weight: 500; color: #fff;
          margin-bottom: 8px;
        }

        .plan-price-wrap {
          display: flex; align-items: baseline; gap: 6px;
          margin-bottom: 4px;
        }
        .plan-price {
          font-family: 'DM Mono', monospace;
          font-size: 40px; font-weight: 500; color: #fff;
          letter-spacing: -0.03em; line-height: 1;
        }
        .plan-price-period {
          font-size: 13px; color: #555; margin-bottom: 20px;
        }

        .credits-chip {
          display: inline-flex; align-items: center; gap: 7px;
          background: #ffffff08; border: 0.5px solid #ffffff12;
          border-radius: 8px; padding: 8px 12px;
          font-size: 13px; margin-bottom: 24px;
        }
        .credits-chip.featured-chip {
          background: #38bdf810; border-color: #38bdf825;
        }
        .credits-main { font-weight: 600; color: #fff; }
        .credits-note { color: #555; font-size: 12px; }

        .plan-divider {
          border: none; border-top: 0.5px solid #1a1a1a;
          margin: 0 0 20px;
        }
        .plan-divider.featured-div { border-color: #38bdf415; }

        .feature-list { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .feature-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13.5px; color: #bbb; line-height: 1.4;
        }
        .feature-item.excluded { color: #333; }

        .cta-btn {
          display: block; width: 100%; padding: 13px;
          font-family: inherit; font-size: 14px; font-weight: 500;
          border-radius: 10px; cursor: pointer; text-align: center;
          transition: all 0.2s; border: none; margin-top: 24px;
          letter-spacing: 0.01em;
        }
        .cta-filled {
          background: #38bdf8; color: #080808;
        }
        .cta-filled:hover { background: #67d0fb; }
        .cta-outline {
          background: transparent; color: #e8e8e8;
          border: 0.5px solid #2a2a2a;
        }
        .cta-outline:hover { border-color: #444; background: #111; }

        .section-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #555; margin-bottom: 10px;
        }
        .section-title {
          font-size: 32px; font-weight: 500; color: #fff;
          line-height: 1.2; margin-bottom: 8px;
        }
        .section-sub {
          font-size: 15px; color: #555; line-height: 1.6;
        }

        .credit-row {
          display: grid; grid-template-columns: 1fr auto;
          align-items: center; gap: 24px;
          padding: 14px 0; border-bottom: 0.5px solid #111;
        }
        .credit-row:last-child { border-bottom: none; }
        .credit-action { font-size: 14px; color: #aaa; }
        .credit-cost {
          font-family: 'DM Mono', monospace; font-size: 13px;
          font-weight: 500; color: #fff; white-space: nowrap;
          background: #151515; border: 0.5px solid #1e1e1e;
          padding: 4px 12px; border-radius: 6px;
        }
        .complexity-dots {
          display: flex; gap: 4px; margin-top: 6px;
        }
        .dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #1e1e1e;
        }
        .dot.filled { background: #38bdf8; }

        .topup-card {
          background: #0e0e0e; border: 0.5px solid #1a1a1a;
          border-radius: 12px; padding: 22px 24px;
          display: flex; align-items: center; justify-content: space-between;
          transition: border-color 0.2s;
        }
        .topup-card:hover { border-color: #2a2a2a; }
        .topup-credits {
          font-family: 'DM Mono', monospace;
          font-size: 22px; font-weight: 500; color: #fff;
        }
        .topup-per { font-size: 12px; color: #444; margin-top: 3px; }
        .topup-right { text-align: right; }
        .topup-price {
          font-family: 'DM Mono', monospace;
          font-size: 18px; font-weight: 500; color: #fff;
        }
        .topup-save {
          display: inline-block; margin-top: 4px;
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; padding: 2px 8px;
          border-radius: 100px; background: #4ade8015; color: #4ade80;
        }

        .faq-item {
          border-bottom: 0.5px solid #111; overflow: hidden;
        }
        .faq-q {
          width: 100%; background: none; border: none; text-align: left;
          padding: 20px 0; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          font-family: inherit; font-size: 15px; font-weight: 400;
          color: #ccc; transition: color 0.2s;
        }
        .faq-q:hover { color: #fff; }
        .faq-q.open { color: #fff; }
        .faq-icon {
          flex-shrink: 0; width: 20px; height: 20px;
          border: 0.5px solid #2a2a2a; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.25s; color: #555;
          font-size: 14px; line-height: 1;
        }
        .faq-icon.rotated { transform: rotate(45deg); }
        .faq-a {
          font-size: 14px; color: #555; line-height: 1.7;
          padding-bottom: 20px; padding-right: 36px;
          max-height: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s;
          opacity: 0;
        }
        .faq-a.open { max-height: 200px; opacity: 1; }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 26px; }
          .plan-price { font-size: 34px; }
        }
      `}</style>

      <div className="polaris-pricing">
        <div className="grid-bg" />
        <div className="glow-orb" style={{ width: 500, height: 500, top: -150, left: "50%", transform: "translateX(-50%)", background: "#38bdf8" }} />
        <div className="glow-orb" style={{ width: 300, height: 300, bottom: 200, left: -100, background: "#a78bfa" }} />

        <div className="content">

          {/* Header */}
          <div style={{ textAlign: "center", padding: "100px 24px 0" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BoltIcon size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>Polaris AI</span>
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 500,
              color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em",
              marginBottom: 16,
            }}>
              One interface.<br />
              <span style={{ color: "#38bdf8" }}>Every workflow.</span>
            </h1>
            <p style={{ fontSize: 17, color: "#555", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.6 }}>
              Pay for what you use. Start free. Scale when you're ready.
            </p>

            {/* Billing Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 72 }}>
              <div className="toggle-wrap">
                <button className={`toggle-btn ${billing === "monthly" ? "active" : "inactive"}`} onClick={() => setBilling("monthly")}>
                  Monthly
                </button>
                <button className={`toggle-btn ${billing === "yearly" ? "active" : "inactive"}`} onClick={() => setBilling("yearly")}>
                  Yearly
                </button>
              </div>
              {billing === "yearly" && <span className="save-badge">Save 20%</span>}
            </div>
          </div>

          {/* Plans */}
          <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px 100px" }}>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div key={plan.id} className={`plan-card ${plan.featured ? "featured" : "normal"}`}>
                  {plan.featured && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 1,
                      background: "linear-gradient(90deg, transparent, #38bdf8, transparent)",
                    }} />
                  )}

                  <div className="plan-tag" style={{ color: plan.tagColor }}>{plan.tag}</div>
                  <div className="plan-name">{plan.name}</div>

                  <div className="plan-price-wrap">
                    <div className="plan-price">
                      {typeof plan.priceLabel === "string" ? plan.priceLabel : plan.priceLabel[billing]}
                    </div>
                  </div>
                  <div className="plan-price-period">
                    {typeof plan.subLabel === "string" ? plan.subLabel : plan.subLabel[billing]}
                  </div>

                  <div className={`credits-chip ${plan.featured ? "featured-chip" : ""}`}>
                    <BoltIcon size={13} color={plan.featured ? "#38bdf8" : "#555"} />
                    <span className="credits-main">{plan.credits}</span>
                    <span className="credits-note">{plan.creditsNote}</span>
                  </div>

                  <hr className={`plan-divider ${plan.featured ? "featured-div" : ""}`} />

                  <ul className="feature-list">
                    {plan.features.map((f, i) => (
                      <li key={i} className="feature-item">
                        <CheckIcon />
                        {f}
                      </li>
                    ))}
                    {plan.excluded.map((f, i) => (
                      <li key={i} className="feature-item excluded">
                        <CrossIcon />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button className={`cta-btn ${plan.ctaStyle === "filled" ? "cta-filled" : "cta-outline"}`}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Costs */}
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 100px" }}>
            <div style={{ marginBottom: 40 }}>
              <div className="section-eyebrow">Credit usage</div>
              <h2 className="section-title">Credits per action</h2>
              <p className="section-sub">Heavier tasks consume more credits — lighter queries stay lean.</p>
            </div>

            <div style={{
              background: "#0a0a0a", border: "0.5px solid #1a1a1a",
              borderRadius: 16, padding: "8px 28px",
            }}>
              {creditActions.map((item, i) => (
                <div key={i} className="credit-row">
                  <div>
                    <div className="credit-action">{item.action}</div>
                    <div className="complexity-dots">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div key={d} className={`dot ${d <= item.complexity ? "filled" : ""}`} />
                      ))}
                    </div>
                  </div>
                  <div className="credit-cost">{item.cost} cr</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top-up Packs */}
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 100px" }}>
            <div style={{ marginBottom: 40 }}>
              <div className="section-eyebrow">Top-ups</div>
              <h2 className="section-title">Need more credits?</h2>
              <p className="section-sub">One-time credit packs for Pro users. Larger packs cost less per credit.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topups.map((t, i) => (
                <div key={i} className="topup-card">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <BoltIcon size={13} color="#38bdf8" />
                      <span className="topup-credits">{t.credits} credits</span>
                    </div>
                    <div className="topup-per">{t.per}</div>
                  </div>
                  <div className="topup-right">
                    <div className="topup-price">{t.price}</div>
                    {t.savings && <div className="topup-save">{t.savings}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 100px" }}>
            <div style={{ marginBottom: 48 }}>
              <div className="section-eyebrow">FAQ</div>
              <h2 className="section-title">Common questions</h2>
            </div>

            <div>
              {faqs.map((item, i) => (
                <div key={i} className="faq-item">
                  <button
                    className={`faq-q ${openFaq === i ? "open" : ""}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {item.q}
                    <div className={`faq-icon ${openFaq === i ? "rotated" : ""}`}>+</div>
                  </button>
                  <div className={`faq-a ${openFaq === i ? "open" : ""}`}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", padding: "0 24px 120px" }}>
            <div style={{
              display: "inline-block",
              background: "#0e0e0e", border: "0.5px solid #1e1e1e",
              borderRadius: 20, padding: "60px 80px", maxWidth: 600,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
                width: 200, height: 200, borderRadius: "50%",
                background: "#38bdf8", filter: "blur(80px)", opacity: 0.07,
                pointerEvents: "none",
              }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>
                Get started today
              </p>
              <h2 style={{ fontSize: 28, fontWeight: 500, color: "#fff", marginBottom: 12, lineHeight: 1.2 }}>
                100 free credits.<br />No card needed.
              </h2>
              <p style={{ fontSize: 14, color: "#444", marginBottom: 28, lineHeight: 1.6 }}>
                Sign up and start automating your workflows in minutes.
              </p>
              <button className="cta-btn cta-filled" style={{ width: "auto", padding: "13px 36px", display: "inline-block" }}>
                Create free account
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: "0.5px solid #111", padding: "28px 24px",
            textAlign: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BoltIcon size={10} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Polaris AI</span>
            </div>
            <p style={{ fontSize: 12, color: "#2a2a2a" }}>© 2026 Polaris AI. All rights reserved.</p>
          </div>

        </div>
      </div>
    </div>
  );
}