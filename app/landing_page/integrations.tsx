import { cn } from '@/lib/utils'
import { LogoIcon } from './logo'
import { Button } from './button'
import Link from 'next/link'
import Image from 'next/image'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export default function IntegrationsSection() {
    return (
        <section>
            <div className="bg-black py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left side - Integration diagram */}
                        <div className="scale-125 origin-center">
                            <div className="relative mx-auto flex max-w-sm items-center justify-between">
                                <div className="space-y-6">
                                    <IntegrationCard position="left-top">
                                        <Image src="/Google_Calendar_icon_(2020).svg.png" alt="Google Calendar" width={24} height={24} />
                                    </IntegrationCard>
                                    <IntegrationCard position="left-middle">
                                        <Image src="/Google_Docs_logo_(2014-2020).svg.png" alt="Google Docs" width={24} height={24} />
                                    </IntegrationCard>
                                    <IntegrationCard position="left-bottom">
                                        <Image src="/Google_Forms_2020_Logo.svg.png" alt="Google Forms" width={24} height={24} />
                                    </IntegrationCard>
                                </div>
                                <div className="mx-auto my-2 flex w-fit justify-center gap-2">
                                    <div className="bg-neutral-900 relative z-20 rounded-2xl border border-neutral-700 p-1">
                                        <IntegrationCard
                                            className="bg-neutral-800 size-16 border-white/25 shadow-xl shadow-white/10"
                                            isCenter={true}>
                                            <LogoIcon />
                                        </IntegrationCard>
                                    </div>
                                </div>
                                <div
                                    role="presentation"
                                    className="absolute inset-1/3 bg-[radial-gradient(var(--dots-color)_1px,transparent_1px)] opacity-50 [--dots-color:white] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                                <div className="space-y-6">
                                    <IntegrationCard position="right-top">
                                        <Image src="/github-white-icon.webp" alt="GitHub" width={24} height={24} />
                                    </IntegrationCard>
                                    <IntegrationCard position="right-middle">
                                        <Image src="/Google_Meet-Logo.wine.png" alt="Google Meet" width={24} height={24} />
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
                            
                            <h2 className={`${spaceGrotesk.className} text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight`}>
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
        <div className={cn('bg-neutral-900 relative flex size-12 rounded-xl border border-neutral-700', className)}>
            <div className={cn('relative z-20 m-auto size-fit *:size-6', isCenter && '*:size-8')}>{children}</div>
            {position && !isCenter && (
                <div
                    className={cn(
                        'bg-linear-to-r to-gray-600/50 absolute z-10 h-px',
                        position === 'left-top' && 'left-full top-1/2 w-[130px] origin-left rotate-[25deg]',
                        position === 'left-middle' && 'left-full top-1/2 w-[120px] origin-left',
                        position === 'left-bottom' && 'left-full top-1/2 w-[130px] origin-left rotate-[-25deg]',
                        position === 'right-top' && 'bg-linear-to-l right-full top-1/2 w-[130px] origin-right rotate-[-25deg]',
                        position === 'right-middle' && 'bg-linear-to-l right-full top-1/2 w-[120px] origin-right',
                        position === 'right-bottom' && 'bg-linear-to-l right-full top-1/2 w-[130px] origin-right rotate-[25deg]'
                    )}
                />
            )}
        </div>
    )
}
