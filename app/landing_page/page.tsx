import Hero from "./hero";
import { Footer } from "@/components/ui/footer";
import IntegrationsSection from "./integrations";
import LongTermMemorySection from "./longterm_memory";
import SecurityTrustSection from "./security_trust";
import PricingSection from "./PricingSection";
export default function LandingPage() {
  return (
    <>
      <Hero />
      <div className="bg-black w-full">
        <IntegrationsSection/>
        <LongTermMemorySection />
        <SecurityTrustSection />
        <PricingSection/>
        <Footer />
      </div>
    </>
  );
}