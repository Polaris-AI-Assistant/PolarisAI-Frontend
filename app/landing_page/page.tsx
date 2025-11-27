import Hero from "./hero";
import { Footer } from "@/components/ui/footer";
import IntegrationsSection from "./integrations";
export default function LandingPage() {
  return (
    <>
      <Hero />
      <div className="bg-black w-full">
        <IntegrationsSection/>
        <Footer />
      </div>
    </>
  );
}