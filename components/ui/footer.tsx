'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface FooterLink {
	title: string;
	href: string;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Features', href: '#features' },
			{ title: 'Integrations', href: '#integrations' },
			{ title: 'Pricing', href: '#pricing' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About Us', href: '/about' },
			{ title: 'Privacy Policy', href: '/privacy_policy' },
			{ title: 'Terms of Service', href: '/terms' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Documentation', href: '/docs' },
			{ title: 'Help Center', href: '/help' },
			{ title: 'Contact', href: '/contact' },
		],
	},
];

const socialLinks = [
	{ icon: Github, href: 'https://github.com/Polaris-AI-Assistant', label: 'GitHub' },
	{ icon: Twitter, href: 'https://twitter.com/polarisai', label: 'Twitter' },
	{ icon: Linkedin, href: 'https://linkedin.com/company/polarisai', label: 'LinkedIn' },
	{ icon: Mail, href: 'mailto:contact@polarisai.com', label: 'Email' },
];

export function Footer() {
	return (
		<footer className="relative w-full mx-auto rounded-t-3xl md:rounded-t-[3rem] border-t border-white/10 bg-neutral-950 px-6 py-10 lg:py-12">
			{/* Top shine effect */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
			<div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-1/3 bg-gradient-to-b from-white/5 to-transparent blur-xl" />

			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
					{/* Logo and tagline */}
					<AnimatedContainer className="flex flex-col gap-4 lg:max-w-xs">
						<Link href="/" className="flex items-center gap-3">
							<Image src="/polaris.png" alt="Polaris AI" width={40} height={40} className="size-10" />
							<span className="text-xl font-semibold text-white">Polaris AI</span>
						</Link>
						<p className="text-sm text-neutral-400 leading-relaxed">
							Your intelligent AI assistant that brings all your apps together for seamless productivity.
						</p>
						{/* Social Links */}
						<div className="flex items-center gap-3 mt-2">
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center justify-center size-9 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
									aria-label={social.label}
								>
									<social.icon className="size-4" />
								</a>
							))}
						</div>
					</AnimatedContainer>

					{/* Links sections */}
					<div className="grid grid-cols-3 gap-8 lg:gap-16">
						{footerLinks.map((section, index) => (
							<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
								<div>
									<h3 className="text-sm font-medium text-white mb-4">{section.label}</h3>
									<ul className="space-y-2.5">
										{section.links.map((link) => (
											<li key={link.title}>
												<Link
													href={link.href}
													className="text-sm text-neutral-400 hover:text-white transition-colors duration-300"
												>
													{link.title}
												</Link>
											</li>
										))}
									</ul>
								</div>
							</AnimatedContainer>
						))}
					</div>
				</div>

				{/* Bottom bar */}
				<AnimatedContainer delay={0.4}>
					<div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-sm text-neutral-500">
							© {new Date().getFullYear()} Polaris AI. All rights reserved.
						</p>
						<div className="flex items-center gap-6">
							<Link href="/privacy_policy" className="text-sm text-neutral-500 hover:text-white transition-colors">
								Privacy
							</Link>
							<Link href="/terms" className="text-sm text-neutral-500 hover:text-white transition-colors">
								Terms
							</Link>
						</div>
					</div>
				</AnimatedContainer>
			</div>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return children;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}