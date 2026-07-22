import Link from 'next/link'
import Image from 'next/image'
import { Space_Grotesk } from 'next/font/google'
import { LayoutGrid, RefreshCw, Zap } from 'lucide-react'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export default function IntegrationsSection() {
    return (
        <section className="bg-black px-6 py-10 md:py-14 lg:py-16 overflow-hidden">
            <div className="mx-auto max-w-7xl">
                <div className="px-5 py-8 md:px-8 md:py-10 lg:px-10 lg:py-10">
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.18fr_0.82fr] lg:gap-24">
                        {/* Left side - Integration image */}
                        <div className="relative z-0 flex justify-center lg:justify-start">
                            <div className="relative mt-10 w-full max-w-150 lg:max-w-170 lg:scale-125 lg:origin-center">
                                <Image
                                    src="/apps-integration.png"
                                    alt="App integrations"
                                    width={2000}
                                    height={1700}
                                    priority
                                    className="h-auto w-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Right side - Text content */}
                        <div className="relative z-20 max-w-xl">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.22em] text-cyan-300">
                                <LayoutGrid size={14} strokeWidth={1.5} />
                                <span>CONNECTORS &amp; INTEGRATIONS</span>
                            </div>

                            {/* Headline */}
                            <h2 className={`${spaceGrotesk.className} mt-5 text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.95] tracking-[-0.05em] text-white`}>
                                When your apps{' '}
                                <span className="block bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                                    work together.
                                </span>
                            </h2>

                            {/* Description */}
                            <p className={`${spaceGrotesk.className} mt-4 max-w-lg text-[15px] leading-7 text-white/55 md:text-[16px]`}>
                                No more jumping between tools. Polaris brings your workspace together so information stays connected and work keeps moving.
                            </p>

                            {/* Feature items */}
                            <div className="mt-8 space-y-5">
                                {/* Row 1 - Sync */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-cyan-400/12 bg-cyan-400/5 text-cyan-300">
                                        <RefreshCw size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className={`${spaceGrotesk.className} text-[16px] font-semibold text-white md:text-[18px]`}>
                                            Everything stays in sync
                                        </div>
                                        <div className="mt-0.5 text-[13px] text-white/55 md:text-[14px]">
                                            From emails to meetings and documents
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2 - Lightning */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-cyan-400/12 bg-cyan-400/5 text-cyan-300">
                                        <Zap size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className={`${spaceGrotesk.className} text-[16px] font-semibold text-white md:text-[18px]`}>
                                            Less switching. More doing.
                                        </div>
                                        <div className="mt-0.5 text-[13px] text-white/55 md:text-[14px]">
                                            Spend less time in apps, more time on work
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}