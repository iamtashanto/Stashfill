import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zero-Telemetry Privacy Policy & Threat Model Manifesto — Stashfill',
  description:
    'Our strict offline manifesto: zero network requests, zero telemetry, zero analytics tracking, and zero account databases. CI-verified code safety guarantee.',
  keywords: [
    'Stashfill privacy policy',
    'zero telemetry browser extension',
    'offline autofill privacy',
    'threat model',
    'no data collection extension',
  ],
  alternates: {
    canonical: 'https://stashfill.org/privacy',
  },
  openGraph: {
    title: 'Stashfill Zero-Telemetry Privacy Policy',
    description:
      'Zero servers, zero analytics, zero data collection. All identity profiles stay strictly on your local disk.',
    url: 'https://stashfill.org/privacy',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
