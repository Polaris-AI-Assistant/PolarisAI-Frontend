'use client'
import { useState } from "react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For your hobby",
    price: { monthly: "₹0", yearly: "₹0" },
    period: "per user/month",
    credits: "100 credits on signup",
    cta: "Get Started",
    featured: false,
    features: [
      "Gmail, Calendar & Docs agents",
      "Web search, weather & maps",
      "7-day conversation memory",
      "5 scheduled reminders",
      "Basic intent routing",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For professionals",
    price: { monthly: "₹499", yearly: "₹399" },
    period: "per user/month",
    credits: "1,500 credits/month",
    cta: "Upgrade to Pro",
    featured: true,
    features: [
      "Everything in Starter",
      "GitHub & Microsoft 365 agents",
      "Flights, travel & PDF generation",
      "90-day semantic memory",
      "50 scheduled tasks",
      "Parallel multi-agent workflows",
      "Credit top-ups available",
    ],
  },
  {
    id: "power",
    name: "Power",
    tagline: "For power users",
    price: { monthly: "₹999", yearly: "₹799" },
    period: "per user/month",
    credits: "4,000 credits/month",
    cta: "Start with Power",
    featured: false,
    features: [
      "Everything in Pro",
      "Unlimited memory retention",
      "Unlimited scheduled tasks",
      "Priority queue execution",
      "Early access to new agents",
      "Advanced validation engine",
    ],
  },
];

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M2.5 7l3 3 6-6" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <section
      id="pricing"
      style={{
        backgroundColor: "transparent",
        backgroundImage: "url('/pricing_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Outfit', 'Helvetica Neue', sans-serif",
        color: "#f5f5f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 32px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .ps *, .ps *::before, .ps *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ps-inner {
          position: relative; z-index: 1;
          max-width: 1000px; margin: 0 auto; width: 100%;
        }

        .ps-eyebrow {
          text-align: center;
          font-size: 11px; font-weight: 600; letter-spacing: 0.16em;
          text-transform: uppercase; color: #22d3ee;
          margin-bottom: 10px;
        }

        .ps-title {
          text-align: center;
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 700; letter-spacing: -0.025em;
          color: #ffffff; line-height: 1.08;
          margin-bottom: 10px;
        }

        .ps-sub {
          text-align: center;
          font-size: 14px; color: #8ab4cc;
          max-width: 400px; margin: 0 auto 28px;
          line-height: 1.6; font-weight: 300;
        }

        /* Toggle */
        .ps-toggle-wrap { display: flex; justify-content: center; margin-bottom: 52px; align-items: center; gap: 12px; }
        .ps-toggle {
          display: inline-flex;
          background: rgba(4, 12, 28, 0.85);
          border: 0.5px solid rgba(34, 211, 238, 0.2);
          border-radius: 999px; padding: 3px;
        }
        .ps-tbtn {
          font-family: inherit; font-size: 13px; font-weight: 500;
          padding: 7px 22px; border: none; border-radius: 999px;
          cursor: pointer; transition: all 0.18s ease;
        }
        .ps-tbtn.on  { background: rgba(34, 211, 238, 0.18); color: #22d3ee; border: 0.5px solid rgba(34, 211, 238, 0.4); }
        .ps-tbtn.off { background: transparent; color: #4a6a85; border: 0.5px solid transparent; }
        .ps-tbtn.off:hover { color: #7ab8d0; }
        .ps-save {
          font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(34, 211, 238, 0.08); color: #22d3ee;
          border: 0.5px solid rgba(34, 211, 238, 0.25);
        }

        /* Grid */
        .ps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          align-items: stretch;
        }
        @media (max-width: 820px) {
          .ps-grid { grid-template-columns: 1fr; gap: 16px; }
          .ps-card-wrap { padding-top: 0 !important; margin-top: 0 !important; }
        }

        /* Card wrapper */
        .ps-card-wrap { display: flex; flex-direction: column; position: relative; }
        .ps-card-wrap.is-featured { margin-top: -16px; }

        /* Most Popular badge — dark navy, solid cyan border, no heavy glow */
        .ps-popular-badge {
          position: absolute;
          top: -15px; left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }
        .ps-popular-inner {
          display: inline-flex; align-items: center; gap: 7px;
          background: #0b1a30;
          border: 1px solid #22d3ee;
          border-radius: 999px; padding: 6px 18px;
          font-size: 12px; font-weight: 600; color: #22d3ee;
          letter-spacing: 0.04em; white-space: nowrap;
          box-shadow: none;
        }
        .ps-pop-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22d3ee; flex-shrink: 0;
        }

        /* ── Side cards: fully rounded on ALL corners ── */
        .ps-card-border-wrapper-default {
          flex: 1; display: flex; flex-direction: column;
          border-radius: 16px;
          overflow: hidden;
        }
        .ps-card {
          background: rgba(6, 13, 27, 0.97);
          border: 1px solid rgba(34, 211, 238, 0.11);
          padding: 28px 26px 22px;
          display: flex; flex-direction: column;
          flex: 1;
          position: relative; overflow: hidden;
          /* ALL four corners fully rounded */
          border-radius: 16px;
        }

        /* ── Featured card: diagonal blue→teal-green gradient border ── */
        .ps-card-border-wrapper {
          position: relative;
          border-radius: 16px;
          padding: 1px;
          /* Diagonal gradient: ocean blue bottom-left → coral teal-green top-right
             exactly matching the reference image */
          background: linear-gradient(
            135deg,
            #1a6cf5 0%,
            #1a8fd4 25%,
            #00c8aa 65%,
            #00d4a8 100%
          );
          box-shadow: none;
          flex: 1; display: flex; flex-direction: column;
        }

        /* Featured card inner */
        .ps-card.featured-card {
          background: rgba(6, 13, 27, 0.97);
          border: none;
          border-radius: 15px;
          padding-top: 34px;
          z-index: 2; flex: 1;
        }

        /* Shimmer line at top of featured card — same gradient direction */
        .ps-card.featured-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #1a6cf5 15%,
            #00c8aa 50%,
            #1a6cf5 85%,
            transparent 100%
          );
        }
        .ps-card.featured-card::after {
          content: '';
          position: absolute; top: 0; left: 10%; right: 10%; height: 36px;
          background: radial-gradient(ellipse at 50% 0%, rgba(26, 108, 245, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Plan name */
        .ps-plan-name {
          font-size: 15px; font-weight: 600; color: #ffffff;
          margin-bottom: 12px; letter-spacing: 0.01em;
        }

        .ps-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
        .ps-price {
          font-size: clamp(36px, 4vw, 54px); font-weight: 700; color: #ffffff;
          letter-spacing: -0.03em; line-height: 1;
        }
        .ps-price-period { font-size: 13px; color: #607d8f; font-weight: 300; }
        .ps-tagline { font-size: 13px; color: #607d8f; margin-bottom: 20px; font-weight: 300; }

        .ps-div {
          border: none; border-top: 1px solid rgba(255,255,255,0.07);
          margin: 0 0 18px;
        }

        .ps-features { list-style: none; display: flex; flex-direction: column; gap: 11px; flex: 1; }
        .ps-feat {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13.5px; color: #deeaf2; line-height: 1.4; font-weight: 400;
        }

        /* CTA buttons */
        .ps-cta {
          display: block; width: 100%; margin-top: 22px;
          padding: 13px 0; font-family: inherit; font-size: 14px; font-weight: 600;
          border-radius: 12px; cursor: pointer; text-align: center;
          transition: all 0.16s ease; letter-spacing: 0.01em;
        }
        .ps-cta-outline {
          background: rgba(6, 13, 27, 0.6);
          border: 1px solid rgba(34, 211, 238, 0.4);
          color: #22d3ee;
        }
        .ps-cta-outline:hover {
          background: rgba(34, 211, 238, 0.06);
          border-color: rgba(34, 211, 238, 0.65);
        }
        /* Filled — same blue→teal-green gradient as the card border, NO glow */
        .ps-cta-filled {
          background: linear-gradient(90deg, #1a6cf5 0%, #1a8fd4 45%, #00c8aa 100%);
          border: none;
          color: #ffffff;
          font-weight: 700;
          box-shadow: none;
        }
        .ps-cta-filled:hover {
          background: linear-gradient(90deg, #1558d0 0%, #1580c0 45%, #00b096 100%);
        }

        /* Credits */
        .ps-credits {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #3a6880; margin-top: 10px;
          justify-content: center; font-weight: 300;
        }
        .ps-credits-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: #3a6880; flex-shrink: 0;
        }

        /* Footer */
        .ps-footer {
          margin-top: 32px; text-align: center; font-size: 13px;
          display: flex; align-items: center; justify-content: center; gap: 18px;
          flex-wrap: wrap;
        }
        .ps-footer span { display: flex; align-items: center; gap: 6px; color: #3a6880; }
        .ps-footer-sep { width: 3px; height: 3px; border-radius: 50%; background: #1a3a50; }
      `}</style>

      <div className="ps-inner ps">

        <div className="ps-eyebrow">Pricing</div>
        <h2 className="ps-title">Plans and Pricing</h2>
        <p className="ps-sub">Receive more credits when you pay yearly, and save on your plan.</p>

        {/* Toggle */}
        <div className="ps-toggle-wrap">
          <div className="ps-toggle">
            <button className={`ps-tbtn ${billing === "monthly" ? "on" : "off"}`} onClick={() => setBilling("monthly")}>Monthly</button>
            <button className={`ps-tbtn ${billing === "yearly" ? "on" : "off"}`} onClick={() => setBilling("yearly")}>Annual</button>
          </div>
          {billing === "yearly" && <span className="ps-save">Save 20%</span>}
        </div>

        {/* Cards */}
        <div className="ps-grid">
          {plans.map((plan, i) => {
            return (
              <div key={plan.id} className={`ps-card-wrap ${plan.featured ? "is-featured" : ""}`}>
                {plan.featured && (
                  <div className="ps-popular-badge">
                    <div className="ps-popular-inner">
                      <div className="ps-pop-dot" />
                      Most Popular
                    </div>
                  </div>
                )}

                {plan.featured ? (
                  <div className="ps-card-border-wrapper">
                    <div className="ps-card featured-card">
                      <div className="ps-plan-name">{plan.name}</div>
                      <div className="ps-price-row">
                        <div className="ps-price">{plan.price[billing]}</div>
                        <div className="ps-price-period">{plan.period}</div>
                      </div>
                      <div className="ps-tagline">{plan.tagline}</div>
                      <hr className="ps-div" />
                      <ul className="ps-features">
                        {plan.features.map((f, j) => (
                          <li key={j} className="ps-feat"><CheckIcon />{f}</li>
                        ))}
                      </ul>
                      <button className="ps-cta ps-cta-filled">{plan.cta}</button>
                      <div className="ps-credits"><div className="ps-credits-dot" />{plan.credits}</div>
                    </div>
                  </div>
                ) : (
                  <div className="ps-card-border-wrapper-default">
                    <div className="ps-card">
                      <div className="ps-plan-name">{plan.name}</div>
                      <div className="ps-price-row">
                        <div className="ps-price">{plan.price[billing]}</div>
                        <div className="ps-price-period">{plan.period}</div>
                      </div>
                      <div className="ps-tagline">{plan.tagline}</div>
                      <hr className="ps-div" />
                      <ul className="ps-features">
                        {plan.features.map((f, j) => (
                          <li key={j} className="ps-feat"><CheckIcon />{f}</li>
                        ))}
                      </ul>
                      <button className="ps-cta ps-cta-outline">{plan.cta}</button>
                      <div className="ps-credits"><div className="ps-credits-dot" />{plan.credits}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="ps-footer">
          <span>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="3.5" width="10" height="7" rx="1.5" stroke="#3a6880" strokeWidth="1.2"/><path d="M4 3.5V2.5a2.5 2.5 0 015 0v1" stroke="#3a6880" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Cancel anytime
          </span>
          <div className="ps-footer-sep" />
          <span>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1a5.5 5.5 0 100 11A5.5 5.5 0 006.5 1zm0 3.5v3l2 1" stroke="#3a6880" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Credits never expire
          </span>
          <div className="ps-footer-sep" />
          <span>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L8.09 4.76l4.04.35-3.07 2.66 1 3.9L6.5 9.41l-3.56 2.26 1-3.9L.87 5.11l4.04-.35z" stroke="#3a6880" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            100 free credits on signup
          </span>
        </div>

      </div>
    </section>
  );
}