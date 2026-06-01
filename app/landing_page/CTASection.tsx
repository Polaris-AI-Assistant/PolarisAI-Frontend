"use client";

import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export default function CTASection() {
  return (
    <section
      aria-labelledby="cta-heading"
      style={{
        minHeight: "100vh",
        padding: "72px 32px",
        boxSizing: "border-box",
        background: "transparent",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          borderRadius: 28,
          overflow: "hidden",
          position: "relative",
          backgroundImage: "url('/cta%20card.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: 620,
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(7, 10, 18, 0.2), rgba(7, 10, 18, 0.1))",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: 620,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "112px 32px 40px",
          }}
        >
          <h2
            id="cta-heading"
            className={spaceGrotesk.className}
            style={{
              margin: 0,
              fontSize: "clamp(30px, 4.2vw, 60px)",
              lineHeight: 0.98,
              letterSpacing: "-0.05em",
              fontWeight: 700,
              color: "#f4f7fb",
              textShadow: "0 6px 24px rgba(0, 0, 0, 0.28)",
            }}
          >
            Everything you need.
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #3b82f6 0%, #22d3ee 60%, #4ade80 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              One conversation
            </span>{" "}
            away.
          </h2>

          <p
            className={spaceGrotesk.className}
            style={{
              margin: "16px 0 0",
              maxWidth: 540,
              fontSize: "clamp(14px, 1.2vw, 18px)",
              lineHeight: 1.55,
              color: "rgba(241, 245, 249, 0.82)",
              textShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
            }}
          >
            Polaris AI connects your apps, workflows, documents,
            <br />
            and tasks into one intelligent workspace.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 18,
              marginTop: 30,
            }}
          >
            <a
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                minWidth: 206,
                height: 50,
                padding: "0 18px",
                borderRadius: 10,
                background: "linear-gradient(90deg, #2563eb 0%, #0891b2 60%, #16a34a 100%)",
                color: "#f8fafc",
                fontSize: 13.5,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "none",
                border: "1px solid rgba(255, 255, 255, 0.14)",
              }}
            >
              Start Using Polaris
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 9h10M9 4l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <a
              href="/docs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                  minWidth: 206,
                  height: 50,
                  padding: "0 18px",
                  borderRadius: 10,
                background: "rgba(7, 10, 18, 0.22)",
                border: "1px solid rgba(145, 191, 255, 0.45)",
                color: "#edf2f7",
                  fontSize: 13.5,
                fontWeight: 500,
                textDecoration: "none",
                backdropFilter: "blur(10px)",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              }}
            >
              View Documentation
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 9h10M9 4l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}