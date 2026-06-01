"use client";

import { NavbarDemo } from "./navbar";
import { Space_Grotesk } from 'next/font/google';
import { useState } from 'react';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export default function Hero() {
  const [inputValue, setInputValue] = useState('');

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <NavbarDemo />
      </div>
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        {/* Background gradient image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <img
            src="/hero%20gradient.png"
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center h-full" style={{ paddingTop: '48px' }}>
          <div className="text-center px-6 max-w-4xl mx-auto w-full">

            {/* Update Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80 backdrop-blur-md mb-1 border border-gray-600/50 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold rounded-md shadow-sm">
                NEW
              </span>
              <span className="text-white text-[13px] font-medium">Introducing Polaris AI</span>
              <span className="text-gray-300">›</span>
            </div>

            {/* Main Headline */}
            <h1
              className={`${spaceGrotesk.className} font-bold text-white mb-1 leading-tight`}
              style={{ fontSize: 'clamp(2rem, 4.2vw, 3.2rem)', letterSpacing: '-0.01em' }}
            >
              Your cross-app memory.
            </h1>

            {/* Gradient blue/cyan subheading line */}
            <h1
              className={`${spaceGrotesk.className} font-bold mb-5 leading-tight`}
              style={{
                fontSize: 'clamp(2rem, 4.2vw, 3.2rem)',
                letterSpacing: '-0.01em',
                background: 'linear-gradient(90deg, #3b82f6 0%, #22d3ee 60%, #4ade80 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              One AI that understands you.
            </h1>

            {/* Subheading */}
            <p
              className={`${spaceGrotesk.className} text-gray-300 mb-10 mx-auto leading-relaxed`}
              style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)', maxWidth: '680px' }}
            >
              Polaris AI connects your apps, data, and context into a single memory.{' '}
              <br /> Ask anything, get answers that are{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #3b82f6, #22d3ee)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                truly yours
              </span>
              .
            </p>

            {/* Chat Input Bar */}
            <div
              className="mx-auto"
              style={{
                maxWidth: '780px',
                position: 'relative',
              }}
            >
              {/* Outer glow / shadow layer */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-1px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(34,211,238,0.08) 100%)',
                  filter: 'blur(0px)',
                  zIndex: 0,
                }}
              />

              {/* Main input container */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'rgba(28, 28, 32, 0.92)',
                  borderRadius: '16px',
                  border: '1px solid rgba(80, 80, 100, 0.45)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: `
                    0 4px 6px -1px rgba(0,0,0,0.4),
                    0 20px 60px -10px rgba(0,0,0,0.7),
                    0 40px 80px -20px rgba(0,0,0,0.5),
                    inset 0 1px 0 rgba(255,255,255,0.04)
                  `,
                  padding: '18px 20px 14px 20px',
                }}
              >
                {/* Text input area */}
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything across your apps..."
                  rows={1}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.97rem',
                    fontFamily: spaceGrotesk.style.fontFamily,
                    resize: 'none',
                    lineHeight: '1.5',
                    caretColor: '#3b82f6',
                    minHeight: '28px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                />

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between" style={{ marginTop: '12px' }}>
                  {/* Left: Plus / attach */}
                  <button
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  >
                    +
                  </button>

                  {/* Right: Smart selector + mic + send */}
                  <div className="flex items-center gap-2">
                    {/* Smart mode selector */}
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: '0.83rem',
                        fontFamily: spaceGrotesk.style.fontFamily,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    >
                      Smart
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Mic button */}
                    <button
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    </button>

                    {/* Send button */}
                    <button
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 12px rgba(59,130,246,0.5)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.7)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(59,130,246,0.5)';
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"/>
                        <polyline points="5 12 12 5 19 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom shadow glow — the dark shadow puddle effect */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '10%',
                  right: '10%',
                  height: '40px',
                  background: 'rgba(0,0,0,0.55)',
                  borderRadius: '50%',
                  filter: 'blur(18px)',
                  zIndex: 0,
                }}
              />
            </div>

            {/* Bottom feature pills */}
            {/* <div
              className="flex flex-wrap items-center justify-center gap-8 mx-auto"
              style={{ marginTop: '48px', maxWidth: '860px' }}
            >
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
                      <line x1="12" y1="8" x2="5.5" y2="16.5"/><line x1="12" y1="8" x2="18.5" y2="16.5"/>
                    </svg>
                  ),
                  title: 'Cross-app memory',
                  desc: 'Connects your apps, data and conversations',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ),
                  title: 'Personalized answers',
                  desc: 'Understands your context and preferences',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  ),
                  title: 'Private by design',
                  desc: 'Your data stays secure and under your control',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  ),
                  title: 'Always in sync',
                  desc: 'Real-time memory across all your platforms',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-left"
                  style={{ minWidth: '180px', maxWidth: '200px' }}
                >
                  <div style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }}>{item.icon}</div>
                  <div>
                    <div
                      className={spaceGrotesk.className}
                      style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', marginBottom: '3px' }}
                    >
                      {item.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div> */}

          </div>
        </div>
      </div>
    </>
  );
}