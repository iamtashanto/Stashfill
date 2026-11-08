import Hero from '@/components/Hero';
import InteractiveDemo from '@/components/InteractiveDemo';
import BentoFeatures from '@/components/BentoFeatures';
import ComparisonTable from '@/components/ComparisonTable';
import SecurityArchitecture from '@/components/SecurityArchitecture';
import HowItWorks from '@/components/HowItWorks';
import BrowserDownloadSection from '@/components/BrowserDownloadSection';
import FaqSection from '@/components/FaqSection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <InteractiveDemo />
      <BentoFeatures />
      <ComparisonTable />
      <SecurityArchitecture />
      <HowItWorks />
      <BrowserDownloadSection />
      <FaqSection />
    </>
  );
}
