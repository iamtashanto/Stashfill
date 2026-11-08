import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation & Cheatsheet — Stashfill',
  description:
    'Complete developer and user reference for Stashfill: keyboard shortcuts, snippet variable syntax ({{date}}, {{time}}, {{cursor}}), custom site rules, and multilingual Bangla synonym tables.',
  keywords: [
    'Stashfill documentation',
    'autofill keyboard shortcuts',
    'snippet variable expansion',
    'Bangla field matching',
    'custom autofill rules',
  ],
  alternates: {
    canonical: 'https://stashfill.org/docs',
  },
  openGraph: {
    title: 'Stashfill Documentation & Cheatsheet',
    description:
      'Keyboard shortcuts, snippet variable syntax, and multilingual synonym tables.',
    url: 'https://stashfill.org/docs',
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
