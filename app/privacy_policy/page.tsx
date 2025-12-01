"use client";
import { NavbarDemo } from "../landing_page/navbar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <NavbarDemo />
      <div className="max-w-3xl mx-auto px-6 py-12 pt-24">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold mb-1">Privacy Policy</h1>
          <p className="text-neutral-500 text-sm">Last updated: November 2024</p>
        </div>

        {/* Introduction */}
        <p className="text-neutral-400 leading-relaxed mb-10">
          This Privacy Policy explains how Polaris AI collects, uses, and protects your information. By using our platform, you agree to this policy.
        </p>

        {/* Sections */}
        <div className="space-y-8">
          <Section title="Information We Collect">
            <p className="text-neutral-400 mb-3">We collect information you provide directly:</p>
            <ul className="text-neutral-400 space-y-1 mb-4">
              <li>• Name and email address</li>
              <li>• Encrypted password</li>
              <li>• Content from connected services (calendar, email, drive)</li>
            </ul>
            <p className="text-neutral-500 text-sm">
              We also collect device info, usage logs, and analytics to improve our service.
            </p>
          </Section>

          <Section title="How We Use Your Data">
            <ul className="text-neutral-400 space-y-1">
              <li>• Provide and improve Polaris AI features</li>
              <li>• Respond to queries and automate tasks</li>
              <li>• Enhance security and detect misuse</li>
              <li>• Send important service updates</li>
            </ul>
            <p className="text-neutral-500 mt-4 text-sm border-l-2 border-neutral-700 pl-3">
              We never sell your data, show targeted ads, or train unrelated AI models with your information.
            </p>
          </Section>

          <Section title="Data Security">
            <ul className="text-neutral-400 space-y-1">
              <li>• End-to-end encrypted transfers</li>
              <li>• Secure cloud storage</li>
              <li>• Encrypted credentials and tokens</li>
              <li>• Regular security audits</li>
            </ul>
          </Section>

          <Section title="Data Retention">
            <p className="text-neutral-400">
              We retain data only as long as needed to provide our services and comply with legal obligations. You can request deletion of your account and data at any time.
            </p>
          </Section>

          <Section title="Third-Party Services">
            <p className="text-neutral-400">
              When you connect external apps (Google, Microsoft, Slack, etc.), your use is subject to their respective privacy policies.
            </p>
          </Section>

          <Section title="Your Rights">
            <ul className="text-neutral-400 space-y-1">
              <li>• Access and export your data</li>
              <li>• Correct inaccurate information</li>
              <li>• Delete your account</li>
              <li>• Revoke third-party access</li>
            </ul>
          </Section>

          <Section title="Contact">
            <p className="text-neutral-400">
              Questions? Reach us at{" "}
              <a 
                href="mailto:support@polarisai.app" 
                className="text-white hover:underline"
              >
                support@polarisai.app
              </a>
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-neutral-800">
          <p className="text-neutral-500 text-sm">© 2024 Polaris AI</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-medium mb-3">{title}</h2>
      {children}
    </section>
  );
}