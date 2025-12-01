import { cn } from '@/lib/utils'
import { Button } from './button'
import Link from 'next/link'
import Image from 'next/image'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export default function IntegrationsSection() {
    return (
        <section>
            <div className="bg-black py-24 md:py-32">
                <div className="mx-auto max-w-8xl px-8 md:px-16 lg:px-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32 items-center">
                        {/* Left side - Integration diagram */}
                        <div className="scale-175 origin-center -ml-5">
                            <div className="relative mx-auto flex max-w-sm items-center justify-between">
                                <div className="space-y-6">
                                    <IntegrationCard position="left-top">
                                        <Image src="/Google_Calendar_icon_(2020).svg.png" alt="Google Calendar" width={24} height={24} />
                                    </IntegrationCard>
                                    <IntegrationCard position="left-middle">
                                        <Image src="/Google_Drive.png" alt="Google Forms" width={24} height={24} />
                                    </IntegrationCard>
                                    <IntegrationCard position="left-bottom">
                                        <Image src="/gmail.png" alt="Google Sheets" width={28} height={24} />
                                    </IntegrationCard>
                                </div>
                                <div className="mx-auto my-2 flex w-fit justify-center gap-2">
                                    <div className="relative z-20">
                                        <Image src="/polaris.png" alt="Polaris AI" width={120} height={120} className="size-24" />
                                    </div>
                                </div>
                                <div
                                    role="presentation"
                                    className="absolute inset-1/3 bg-[radial-gradient(var(--dots-color)_1px,transparent_1px)] opacity-50 [--dots-color:white] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                                <div className="space-y-6">
                                    <IntegrationCard position="right-top">
                                        <Image src="/git3.png" alt="GitHub" width={80} height={80} />
                                    </IntegrationCard>
                                    <IntegrationCard position="right-middle">
                                        <Image src="/meet_new.png" alt="Google Meet" width={28} height={20} />
                                    </IntegrationCard>
                                    <IntegrationCard position="right-bottom">
                                        <Image src="/Google_Sheets_logo_(2014-2020).svg.png" alt="Google Sheets" width={24} height={24} />
                                    </IntegrationCard>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Text content */}
                        <div className="space-y-6">
                            <div className="inline-block px-4 py-2 rounded-full border border-gray-700 bg-gray-900/50 backdrop-blur-sm">
                                <span className="text-white text-sm font-medium">Connectors and Integrations</span>
                            </div>
                            
                            <h2 className={`${spaceGrotesk.className} text-4xl md:text-5xl lg:text-5xl font-bold text-white leading-tight`}>
                                When Your Apps Work Together, You Work Better.
                            </h2>
                            
                            <p className={`${spaceGrotesk.className} text-lg md:text-xl text-gray-400 leading-relaxed`}>
                                No more jumping between tools. Polaris brings context from Google Workspace, Drive, Calendar, Meet, and more, so your AI always knows what you're working on — and what you need next.
                            </p>

                            <Button
                                variant="outline"
                                size="lg"
                                className="border-2 border-gray-600 text-black hover:bg-gray-800 rounded-full px-8"
                                asChild>
                                <Link href="#">Read more about connectors →</Link>
                            </Button>
                        </div>
                    </div>
                    
                </div>
            </div>
        </section>
    )
}

const IntegrationCard = ({ children, className, position, isCenter = false }: { children: React.ReactNode; className?: string; position?: 'left-top' | 'left-middle' | 'left-bottom' | 'right-top' | 'right-middle' | 'right-bottom'; isCenter?: boolean }) => {
    return (
        <div className={cn(
            'relative flex rounded-2xl p-[1px]',
            'bg-gradient-to-b from-white/30 via-white/5 to-transparent',
            isCenter ? 'size-16' : 'size-12',
            className
        )}>
            <div className={cn(
                'relative flex w-full h-full rounded-[14px]',
                'bg-gradient-to-b from-neutral-800 to-neutral-900',
                'shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]'
            )}>
                <div className={cn(
                    'relative z-20 m-auto flex items-center justify-center',
                    isCenter ? 'size-8' : 'size-6',
                    '[&>img]:max-w-full [&>img]:max-h-full [&>img]:w-auto [&>img]:h-auto [&>img]:object-contain'
                )}>{children}</div>
            </div>
            {position && !isCenter && (
                <div
                    className={cn(
                        'absolute z-10 h-[1.5px]',
                        position === 'left-top' && 'left-full top-1/2 w-[130px] origin-left rotate-[25deg] bg-gradient-to-r from-gray-600/50 to-transparent',
                        position === 'left-middle' && 'left-full top-1/2 w-[120px] origin-left bg-gradient-to-r from-gray-600/50 to-transparent',
                        position === 'left-bottom' && 'left-full top-1/2 w-[130px] origin-left rotate-[-25deg] bg-gradient-to-r from-gray-600/50 to-transparent',
                        position === 'right-top' && 'right-full top-1/2 w-[130px] origin-right rotate-[-25deg] bg-gradient-to-l from-gray-600/50 to-transparent',
                        position === 'right-middle' && 'right-full top-1/2 w-[120px] origin-right bg-gradient-to-l from-gray-600/50 to-transparent',
                        position === 'right-bottom' && 'right-full top-1/2 w-[130px] origin-right rotate-[25deg] bg-gradient-to-l from-gray-600/50 to-transparent'
                    )}
                />
            )}
        </div>
    )
}
