"use client";

import DarkVeil from "../../components/ui/PrismaticBurst"
import { NavbarDemo } from "./navbar";
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export default function Hero() {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <NavbarDemo />
      </div>
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <DarkVeil speed={2.0} />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center px-6 max-w-5xl mx-auto">
            {/* Update Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80 backdrop-blur-md mb-8 border border-gray-600/50 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-md shadow-sm">
                NEW
              </span>
              <span className="text-white text-sm font-medium">Introducing Polaris AI</span>
              <span className="text-gray-300">›</span>
            </div>

            {/* Main Headline */}
            <h1 className={`${spaceGrotesk.className} text-5xl md:text-7xl lg:text-7xl font-bold text-white mb-6 leading-tight`}>
              The Smartest Version of You — Across Every App.
            </h1>

            {/* Subheading */}
            <p className={`${spaceGrotesk.className} text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed`}>
              From your tasks to your ideas to every conversation across apps, Polaris AI keeps it all connected and ready. Work faster with an AI that actually knows you.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group relative px-8 py-3.5 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white font-bold rounded-lg transition-all duration-300 inline-flex items-center gap-2 shadow-[0_4px_14px_0_rgba(59,130,246,0.5)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.7)] hover:scale-105 active:scale-95 overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/10 group-hover:via-white/20 group-hover:to-white/10 transition-all duration-500"></span>
                <span className="absolute inset-0 w-full h-full rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite'
                }}></span>
                <span className="relative z-10">Try Polaris AI</span>
                <span className="relative z-10">→</span>
              </button>
              <button className="px-8 py-3.5 bg-transparent border-2 border-gray-600 hover:border-gray-400 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-gray-800/30">
                How It Works
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </>
  );
}