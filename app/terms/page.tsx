import TermsContent from '@/components/terms-content';
import { NavbarDemo } from '../landing_page/navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <NavbarDemo />
      <div className="pt-24">
        <TermsContent />
      </div>
    </div>
  );
}
