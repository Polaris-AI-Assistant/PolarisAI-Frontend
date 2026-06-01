import React from 'react';

export default function TermsContent() {
  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-neutral-800">
        <span className="inline-block text-[11px] font-medium tracking-widest uppercase text-neutral-400 bg-neutral-700/60 border border-neutral-600 rounded-full px-3 py-1 mb-4">
          Legal
        </span>
        <h1 className="text-4xl font-semibold text-white mb-2">Terms & Conditions</h1>
        <p className="text-sm text-neutral-300">
          Effective date: May 22, 2026 &nbsp;·&nbsp; Last updated: May 22, 2026 &nbsp;·&nbsp; Version 1.0
        </p>
      </div>

      {/* Table of Contents */}
      {/* <div className="bg-neutral-800/40 border border-neutral-700/60 rounded-xl px-5 py-4 mb-8">
        <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-300 mb-3">Contents</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            ['01', 'Acceptance of Terms'],
            ['07', 'Payments & Billing'],
            ['02', 'Description of Service'],
            ['08', 'Service Availability'],
            ['03', 'Eligibility'],
            ['09', 'Termination'],
            ['04', 'User Responsibilities'],
            ['10', 'Limitation of Liability'],
            ['05', 'Third-Party Integrations'],
            ['11', 'Intellectual Property'],
            ['06', 'Data Usage & Privacy'],
            ['12', 'Governing Law'],
          ].map(([num, title]) => (
            <div key={num} className="flex items-center gap-2 py-0.5">
              <span className="text-[10px] text-neutral-300 font-mono">{num}</span>
              <span className="text-sm text-neutral-300">{title}</span>
            </div>
          ))}
        </div>
      </div> */}

      {/* Intro paragraph */}
      <p className="text-sm text-neutral-300 leading-relaxed mb-8">
        Welcome to Polaris AI. These Terms and Conditions ("Terms") govern your access to and use of the
        Polaris AI platform, including our website, APIs, and all related services ("Service"). By creating
        an account or using our Service, you confirm that you have read, understood, and agree to be bound
        by these Terms.
      </p>

      {/* Sections */}
      <div className="space-y-0">
        {sections.map((section, i) => (
          <React.Fragment key={section.num}>
            <div className="py-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-[11px] font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded px-2 py-0.5 font-mono shrink-0">
                  {section.num}
                </span>
                <h2 className="text-2xl font-bold text-white ">{section.title}</h2>
              </div>
              <div className="text-sm text-neutral-300 leading-relaxed space-y-2 pl-0">
                {section.content}
              </div>
            </div>
            {i < sections.length - 1 && (
              <div className="border-t border-neutral-800" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Contact box */}
      <div className="mt-8 bg-neutral-800/40 border border-neutral-700/60 rounded-xl px-5 py-4 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white mb-0.5">Questions about these Terms?</p>
          <p className="text-sm text-neutral-300">
            Contact us at{' '}
            <a href="mailto:support@polarisai.app" className="text-white underline underline-offset-2 hover:text-neutral-200 transition-colors">
              support@polarisai.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const sections = [
  {
    num: '01',
    title: 'Acceptance of Terms',
    content: (
      <p>
        By accessing or using Polaris AI, you agree to comply with and be bound by these Terms. If you do not
        agree with any part of these Terms, you must not use the Service. These Terms constitute a legally
        binding agreement between you and Polaris AI.
      </p>
    ),
  },
  {
    num: '02',
    title: 'Description of Service',
    content: (
      <p>
        Polaris AI is an intelligent, multi-agent productivity platform that enables users to manage emails,
        calendars, documents, code repositories, and other digital workflows through natural language commands.
        The platform integrates with third-party services including Google Workspace, Microsoft 365, and GitHub
        via secure OAuth 2.0 connections.
      </p>
    ),
  },
  {
    num: '03',
    title: 'Eligibility',
    content: (
      <p>
        You must be at least 18 years of age to use this Service. By agreeing to these Terms, you represent
        that you meet this requirement. If you are using the Service on behalf of a business or organization,
        you represent that you have the authority to bind that entity to these Terms.
      </p>
    ),
  },
  {
    num: '04',
    title: 'User Responsibilities',
    content: (
      <>
        <p>You agree to:</p>
        <ul className="mt-2 space-y-1.5 list-disc list-outside ml-4">
          <li>Provide accurate, complete, and current information during registration.</li>
          <li>Maintain the security and confidentiality of your account credentials.</li>
          <li>Not use the Service for any unlawful, harmful, abusive, or unauthorized purpose.</li>
          <li>Comply with all applicable laws when using connected third-party services.</li>
          <li>Not attempt to reverse-engineer, decompile, or interfere with the platform's systems.</li>
          <li>Promptly notify us of any unauthorized access to your account.</li>
        </ul>
      </>
    ),
  },
  {
    num: '05',
    title: 'Third-Party Integrations',
    content: (
      <>
        <p>
          Polaris AI connects with external platforms (e.g., Gmail, Google Calendar, GitHub, Microsoft Outlook)
          via OAuth 2.0. By enabling these integrations:
        </p>
        <ul className="mt-2 space-y-1.5 list-disc list-outside ml-4">
          <li>You grant us permission to access specific data from those services solely to fulfill your requests.</li>
          <li>Polaris AI does not store third-party service data beyond what is necessary to operate the Service.</li>
          <li>Each third-party service is governed by its own terms and privacy policy, for which Polaris AI is not responsible.</li>
          <li>You may revoke access to any integration at any time from your account settings or directly through the third-party service.</li>
        </ul>
      </>
    ),
  },
  {
    num: '06',
    title: 'Data Usage & Privacy',
    content: (
      <>
        <p>Your privacy matters to us. Please review our Privacy Policy for full details. In summary:</p>
        <ul className="mt-2 space-y-1.5 list-disc list-outside ml-4">
          <li>We collect and process only the data necessary to provide and improve the Service.</li>
          <li>We do not sell, rent, or trade your personal data to third parties.</li>
          <li>All data is handled in accordance with applicable data protection laws.</li>
          <li>Data you input may be used in anonymized or aggregated form to improve our AI models, unless you opt out.</li>
        </ul>
      </>
    ),
  },
  {
    num: '07',
    title: 'Payments & Billing',
    content: (
      <>
        <p>Certain features of Polaris AI require a paid subscription. By subscribing:</p>
        <ul className="mt-2 space-y-1.5 list-disc list-outside ml-4">
          <li>You authorize us to charge your provided payment method for the applicable fees.</li>
          <li>Subscriptions auto-renew unless cancelled before the renewal date.</li>
          <li>Payments are processed securely by Razorpay. By making a payment, you also agree to Razorpay's Terms of Service.</li>
          <li>Fees are non-refundable except as required by applicable law or as explicitly stated in our refund policy.</li>
          <li>We reserve the right to modify pricing with at least 30 days' advance notice.</li>
        </ul>
      </>
    ),
  },
  {
    num: '08',
    title: 'Service Availability',
    content: (
      <ul className="space-y-1.5 list-disc list-outside ml-4">
        <li>We strive to maintain high availability but do not guarantee uninterrupted access to the Service.</li>
        <li>We may update, modify, or temporarily suspend features for maintenance, security, or improvement.</li>
        <li>We are not liable for interruptions caused by third-party service failures or events outside our control.</li>
      </ul>
    ),
  },
  {
    num: '09',
    title: 'Termination',
    content: (
      <ul className="space-y-1.5 list-disc list-outside ml-4">
        <li>We reserve the right to suspend or terminate your account for violations of these Terms or harmful activity.</li>
        <li>You may delete your account at any time through account settings or by contacting us.</li>
        <li>Upon termination, your right to use the Service ceases immediately. Provisions that should survive termination by their nature will do so.</li>
      </ul>
    ),
  },
  {
    num: '10',
    title: 'Limitation of Liability',
    content: (
      <>
        <p>To the maximum extent permitted by applicable law:</p>
        <ul className="mt-2 space-y-1.5 list-disc list-outside ml-4">
          <li>The Service is provided "as is" and "as available" without warranties of any kind.</li>
          <li>Polaris AI shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</li>
          <li>Our total aggregate liability to you shall not exceed the amount you paid, if any, in the six months preceding the claim.</li>
        </ul>
      </>
    ),
  },
  {
    num: '11',
    title: 'Intellectual Property',
    content: (
      <p>
        All content, branding, technology, and materials of Polaris AI are protected by copyright, trademark,
        and intellectual property laws. You may not copy, modify, distribute, sublicense, or reverse-engineer
        any part of the platform without prior written consent. You retain ownership of any original content
        you create using the Service.
      </p>
    ),
  },
  {
    num: '12',
    title: 'Governing Law & Dispute Resolution',
    content: (
      <p>
        These Terms are governed by the laws of India. Any disputes arising out of or in connection with these
        Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes
        shall be subject to the exclusive jurisdiction of the courts located in [Your City], India.
      </p>
    ),
  },
  {
    num: '13',
    title: 'Changes to These Terms',
    content: (
      <p>
        We may revise these Terms from time to time. When we do, we will update the "Last Updated" date at
        the top of this page and, where appropriate, notify you via email. Continued use of the Service after
        changes take effect constitutes your acceptance of the updated Terms.
      </p>
    ),
  },
];