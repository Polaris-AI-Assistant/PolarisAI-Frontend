'use client';

import Image from 'next/image';
import { Space_Grotesk } from 'next/font/google';
import { UserRoundCheck, DatabaseZap, SlidersVertical, FileText, ShieldCheck } from 'lucide-react';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

const SECURITY_FEATURES = [
  {
    title: 'Approval before action',
    subtitle: 'Polaris asks before sending emails, creating events, or updating anything.',
  },
  {
    title: 'Opt-in memory',
    subtitle: 'Nothing is stored long-term unless you choose to remember.',
  },
  {
    title: 'Permission aware',
    subtitle: 'Access is scoped to what\'s needed, and nothing more.',
  },
  {
    title: 'Transparent execution',
    subtitle: 'See every step Polaris takes, in real time.',
  },
];

export default function SecurityTrustSection() {
  return (
    <section className="bg-black px-6 py-10 md:py-14 lg:py-16 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="px-5 py-8 md:px-8 md:py-10 lg:px-10 lg:py-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
            <div className="relative z-20 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.22em] text-teal-300">
                <ShieldCheck size={14} strokeWidth={1.5} />
                <span>SECURITY & TRUST</span>
              </div>

              <h3 className={`${spaceGrotesk.className} mt-5 text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.95] tracking-[-0.05em] text-white`}>
                Powerful AI.{' '}
                <span className="block bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  Under your control.
                </span>
              </h3>

              <p className={`${spaceGrotesk.className} mt-4 max-w-lg text-[15px] leading-7 text-white/55 md:text-[16px]`}>
                Polaris never acts silently. Every sensitive action is transparent, permissioned, and always your choice.
              </p>

              <div className="mt-8 space-y-5">
                {SECURITY_FEATURES.map((item, index) => {
                  let IconComponent;
                  if (index === 0) IconComponent = UserRoundCheck;
                  else if (index === 1) IconComponent = DatabaseZap;
                  else if (index === 2) IconComponent = SlidersVertical;
                  else IconComponent = FileText;

                  return (
                    <div key={item.title} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-500/40 bg-gradient-to-br from-teal-900/50 via-teal-800/30 to-teal-900/60 text-teal-300 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(20,184,166,0.15),0_0_20px_rgba(20,184,166,0.1)]">
                        <IconComponent size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className={`${spaceGrotesk.className} text-[16px] font-semibold text-white md:text-[18px]`}>
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-[13px] text-white/55 md:text-[14px]">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`${spaceGrotesk.className} mt-8 text-center lg:text-left text-[15px] font-medium text-white/70 md:text-[16px]`}>
                You stay in control. Always.
              </div>
            </div>

            <div className="relative z-0 flex justify-center lg:justify-end">
              <div className="relative mt-10 w-full max-w-245 lg:max-w-275 lg:scale-125 lg:origin-center">
                <Image
                  src="/Security_Visual.png"
                  alt="Security and trust visualization"
                  width={2000}
                  height={1700}
                  priority
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}